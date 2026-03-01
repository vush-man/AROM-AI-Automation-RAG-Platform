import os
import sys
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, BaseMessage, SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3
from langchain_google_community import GmailToolkit
from dotenv import load_dotenv

load_dotenv()

llm = ChatOllama(
    model=os.getenv("OLLAMA_CHAT_MODEL", "qwen2.5:3b")
)
embeddings = OllamaEmbeddings(
    model=os.getenv("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:4b")
)

vector_store = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True
)

import json

def analyze_email(email):
    """Analyze a single email dict and return structured data."""
    subject = email.get('subject', '') or ''
    sender = email.get('sender', '') or ''
    body = email.get('body', '') or ''

    truncated_body = body[:500] if len(body) > 500 else body

    prompt = (
        "Return ONLY a JSON object, no markdown, no explanation.\n"
        "IMPORTANT: Only use information EXPLICITLY stated in the email below.\n"
        "If a field is NOT mentioned in the email, use \"N/A\" for that field.\n"
        "Do NOT guess or make up any values.\n\n"
        '{"type":"<invoice|review|networking|event|promotional|other>",'
        '"suggested_action":"<action>","vendor":"<N/A if not mentioned>","amount":"<N/A if not mentioned>",'
        '"due_date":"<N/A if not mentioned>","sentiment":"<positive|negative|neutral>"}\n\n'
        f"Subject: {subject}\nFrom: {sender}\nBody: {truncated_body}"
    )

    try:
        response = llm.invoke(prompt)
        cleaned = response.content.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`").strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()

        if not cleaned:
            raise ValueError("Empty LLM response")

        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start != -1 and end != -1:
            cleaned = cleaned[start:end + 1]

        return json.loads(cleaned)

    except (json.JSONDecodeError, ValueError, Exception) as e:
        print(f"Email analysis fallback for: {subject[:80]} — {type(e).__name__}")

        email_type = "other"
        lower_subject = subject.lower()
        if any(w in lower_subject for w in ["invoice", "payment", "receipt", "bill"]):
            email_type = "invoice"
        elif any(w in lower_subject for w in ["invitation", "connect", "network", "linkedin"]):
            email_type = "networking"
        elif any(w in lower_subject for w in ["event", "webinar", "conference", "meetup"]):
            email_type = "event"
        elif any(w in lower_subject for w in ["sale", "offer", "discount", "promo", "newsletter"]):
            email_type = "promotional"

        return {
            "type": email_type,
            "subject": subject,
            "sender": sender,
            "suggested_action": "review manually",
            "sentiment": "neutral"
        }

def assign_priority(data):
    if data["type"] == "invoice":
        if data.get("due_date"):
            return "high"
        return "medium"

    if data["type"] == "event":
        return "medium"

    if data["type"] == "networking":
        return "low"

    if data["type"] == "promotional":
        return "low"

    return "low"

# Keywords that map a query to a specific doc_type folder
DOC_TYPE_KEYWORDS = {
    "invoices": ["invoice", "invoices", "expenditure", "expenditures", "billing",
                 "bill", "bills", "receipt", "receipts", "payment", "payments",
                 "amount", "total amount", "due date", "vendor", "unpaid", "overdue"],
    "reviews":  ["review", "reviews", "feedback", "rating", "ratings", "testimonial",
                 "testimonials", "sentiment", "customer feedback", "negative review",
                 "positive review", "complaint", "complaints"],
    "policies": ["policy", "policies", "sop", "procedure", "guideline", "guidelines",
                 "compliance", "regulation"],
    "threads":  ["thread", "threads", "conversation", "email thread", "discussion",
                 "correspondence", "support ticket", "ticket"],
}

def detect_doc_type(query: str):
    """Detect the most relevant doc_type based on query keywords."""
    query_lower = query.lower()
    scores = {}
    for doc_type, keywords in DOC_TYPE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in query_lower)
        if score > 0:
            scores[doc_type] = score
    if scores:
        return max(scores, key=scores.get)
    return None

@tool
def rag_tool(query: str):
    """
    MANDATORY TOOL for all document-based questions.

    ALWAYS call this tool when the user asks about:
    - Invoices, receipts, bills, expenditures, or financial documents
    - Customer reviews, feedback, ratings, or testimonials
    - Business reports, contracts, proposals, or SOWs
    - Product features, changelogs, or release notes
    - Company policies, SOPs, or internal documentation
    - Any question that could be answered from indexed documents

    DO NOT answer document-related questions without calling this tool first.
    """
    target_type = detect_doc_type(query)
    k = 10

    if target_type:
        # Use FAISS native filtering — only search within the target doc_type
        # fetch_k must be large enough to find docs of the target type among all candidates
        result = vector_store.similarity_search(query, k=k, filter={"doc_type": target_type}, fetch_k=300)
        print(f"[RAG] Retrieved {len(result)} '{target_type}' docs (native filter)")
    else:
        # No type detected — search all documents
        result = vector_store.similarity_search(query, k=k)
        print(f"[RAG] No doc_type detected, returning top {len(result)} results")

    context = [doc.page_content for doc in result]
    metadata = [doc.metadata for doc in result]

    return {
        'query': query,
        'context': context,
        'metadata': metadata
    }

gmail_tools = GmailToolkit().get_tools()

def extract_sender_from_query(query: str):
    """Extract sender/person name from queries like 'email from ommi'."""
    # Words that signal the end of a sender name
    boundary_words = (
        "regarding|about|concerning|for|with|on|that|which|and|or|"
        "invoice|invoices|payment|receipt|bill|report|review|policy|"
        "subject|today|yesterday|last|this|please|can|could|check"
    )
    # Capture one or two words after from/by/sent by, but stop at boundary words
    patterns = [
        rf"(?:from|by|sent by)\s+([a-zA-Z0-9_.+-]+(?:\s+(?!{boundary_words})[a-zA-Z0-9_.+-]+)?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Filter out stop words that might get captured
            stop_words = {"me", "my", "the", "a", "an", "inbox", "email", "mail"}
            if name.lower() not in stop_words:
                return name
    return None

@tool
def gmail_intelligence_tool(query: str = "in:inbox", max_results: int = 5):
    """
    Analyze Gmail inbox and return structured business intelligence.

    Use when user asks about:
    - Important or urgent emails
    - Invoices, payments, or billing emails
    - Client or vendor communications
    - Meeting invitations or event notifications
    - Inbox summaries or email overviews
    - Any email-related business inquiry
    """
    if not max_results:
        max_results = 1

    search_tool = [t for t in gmail_tools if t.name == "search_gmail"][0]

    normalized_query = query.lower().strip()

    sender = extract_sender_from_query(normalized_query)

    # Build Gmail query parts
    query_parts = ["in:inbox"]

    if sender:
        query_parts.append(f"from:{sender}")
    # Only add subject/keyword filters when there's NO sender
    # (combining from: + subject: is usually too restrictive)
    elif "invoice" in normalized_query:
        query_parts.append("subject:invoice")
    elif "important" in normalized_query or "urgent" in normalized_query:
        pass  # no additional filter, just inbox
    elif "network" in normalized_query:
        query_parts.append("subject:(invitation OR connect)")
    else:
        # No sender, no known category — do keyword extraction
        stop_words = {
            "can", "you", "tell", "me", "about", "the", "most", "recent",
            "mail", "mails", "email", "emails", "my", "i", "got", "any",
            "show", "find", "get", "check", "do", "have", "a", "an", "in",
            "from", "is", "it", "what", "of", "to", "and", "or", "if",
            "just", "regarding", "out"
        }
        keywords = [w for w in normalized_query.split() if w not in stop_words]
        if keywords:
            query_parts.append(" ".join(keywords))

    gmail_query = " ".join(query_parts)

    print(f"[Gmail] Search query: {gmail_query}")

    raw_result = search_tool.invoke({
        "query": gmail_query,
        "max_results": max_results
    })

    # Cascading fallback when sender-based search returns nothing
    # Tier 1: from:sender (already tried above)
    # Tier 2: sender + topic keyword
    # Tier 3: sender only (broadest)
    def _parse_gmail_result(raw):
        """Parse raw Gmail result to a list."""
        if isinstance(raw, str):
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                return []
        return raw if isinstance(raw, list) else []

    if sender:
        parsed = _parse_gmail_result(raw_result)
        if len(parsed) == 0:
            # Detect topic keyword from user query
            topic_keywords = {
                "invoice": "invoice", "payment": "payment", "receipt": "receipt",
                "bill": "bill", "meeting": "meeting", "event": "event",
                "network": "networking", "connect": "connect",
            }
            topic = ""
            for kw, label in topic_keywords.items():
                if kw in normalized_query:
                    topic = label
                    break

            # Tier 2: sender + topic
            if topic:
                fallback_query = f"in:inbox {sender} {topic}"
                print(f"[Gmail] Tier 2 fallback: {fallback_query}")
                raw_result = search_tool.invoke({
                    "query": fallback_query,
                    "max_results": max_results
                })
                parsed = _parse_gmail_result(raw_result)

            # Tier 3: sender only (if Tier 2 still returned nothing)
            if len(parsed) == 0:
                fallback_query = f"in:inbox {sender}"
                print(f"[Gmail] Tier 3 fallback: {fallback_query}")
                raw_result = search_tool.invoke({
                    "query": fallback_query,
                    "max_results": max_results
                })

    if isinstance(raw_result, str):
        try:
            result = json.loads(raw_result)
        except json.JSONDecodeError:
            print("Failed to parse Gmail search result (truncated):", str(raw_result)[:200])
            return []
    else:
        result = raw_result

    if not isinstance(result, list):
        print("Unexpected Gmail result type:", type(result))
        return []
    print(f"[Gmail] Search returned {len(result)} emails")

    analyzed_results = []

    for email in result:
        if not isinstance(email, dict):
            continue

        analysis = analyze_email(email)

        if isinstance(analysis, list):
            if len(analysis) > 0:
                data = analysis[0]
            else:
                continue
        else:
            data = analysis

        if not isinstance(data, dict):
            continue

        data.setdefault("subject", email.get("subject", ""))
        data.setdefault("sender", email.get("sender", ""))
        data["priority"] = assign_priority(data)
        analyzed_results.append(data)

    print(f"[Gmail] Analyzed {len(analyzed_results)} emails")

    important_keywords = ["important", "urgent", "priority"]

    if any(word in query.lower() for word in important_keywords):
        filtered = [
            e for e in analyzed_results
            if e["priority"] in ["high", "medium"]
        ]

        if filtered:
            analyzed_results = filtered
            print(f"[Gmail] Filtered to {len(analyzed_results)} high/medium priority emails")
        else:
            print(f"[Gmail] No high/medium priority found, returning all {len(analyzed_results)} emails")

    return analyzed_results


tools = [rag_tool, gmail_intelligence_tool]
llm_with_tools = llm.bind_tools(tools)

import re

class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


NAME_PATTERNS = [
    r"(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+)",
    r"(?:name's)\s+([A-Z][a-z]+)",
]

def extract_user_facts(messages):
    """Scan full message history for key personal facts that should persist."""
    facts = {}
    for msg in messages:
        if isinstance(msg, HumanMessage):
            text = msg.content
            for pattern in NAME_PATTERNS:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    facts["user_name"] = match.group(1).title()
    return facts

EMAIL_KEYWORDS = ["email", "emails", "inbox", "mail", "mails", "gmail",
                   "unread", "recent emails", "check my email", "show me my email",
                   "vendor email", "client email",
                   "meeting invite", "correspondence"]

RAG_KEYWORDS = ["invoice", "invoices", "expenditure", "expenditures", "billing",
                "bill", "bills", "receipt", "receipts", "payment", "payments",
                "review", "reviews", "feedback", "rating", "ratings",
                "complaint", "complaints", "sentiment", "testimonial",
                "policy", "policies", "sop", "procedure", "guideline",
                "report", "contract", "proposal", "feature", "changelog",
                "document", "documents", "docs", "from the docs",
                "support ticket", "thread", "threads"]

MAX_CONTEXT_MESSAGES = 10

def chat_node(state: ChatState, config=None):
    """LLM node that may answer or request a tool call."""
    thread_id = None
    if config and isinstance(config, dict):
        thread_id = config.get("configurable", {}).get("thread_id")

    last_user_msg = ""
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            last_user_msg = msg.content.lower()
            break

    is_email_query = any(kw in last_user_msg for kw in EMAIL_KEYWORDS)
    is_rag_query = any(kw in last_user_msg for kw in RAG_KEYWORDS)

    # Detect email-compose intent: "draft email", "reply email", "write email", "send email"
    # These mean the user wants to CREATE an email, not SEARCH Gmail
    compose_patterns = [
        r"(?:draft|write|compose|create|send|reply|respond|prepare|generate)\s+(?:a\s+|an\s+|the\s+)?(?:reply\s+)?(?:email|mail|response)",
        r"(?:reply|respond)\s+(?:to\s+)?(?:this|that|the|his|her)",
    ]
    is_compose_intent = any(re.search(p, last_user_msg, re.IGNORECASE) for p in compose_patterns)

    if is_email_query and is_rag_query:
        if is_compose_intent:
            # User wants to compose using document data → use RAG
            is_email_query = False
        else:
            # User wants to look up emails about a topic → use Gmail
            is_rag_query = False

    user_facts = extract_user_facts(state["messages"])

    system_content = (
        "You are an enterprise AI assistant with access to two powerful tools.\n"
        "1. rag_tool: search indexed business documents (invoices, reviews, reports, contracts, policies, etc.).\n"
        "2. gmail_intelligence_tool: fetch and analyze emails from Gmail.\n\n"
        "RULES:\n"
        "- Questions about documents, invoices, reviews, reports, expenditures, features, policies → call rag_tool.\n"
        "- Questions about emails, inbox, mail, client communications → call gmail_intelligence_tool.\n"
        "- NEVER answer document or email questions without calling the appropriate tool first.\n"
        "- Do NOT ask follow-up questions. Just call the tool immediately.\n"
        "- When analyzing data, provide actionable insights, summaries, and recommendations.\n"
        "- For financial questions (expenditures, totals, costs):\n"
        "  * Extract EVERY dollar amount from the retrieved documents.\n"
        "  * List each invoice with its ID, vendor, total amount, due date, and payment status.\n"
        "  * Calculate and present the grand total.\n"
        "  * Group by paid vs unpaid if relevant.\n"
        "- For review/feedback questions, identify patterns, sentiment trends, and suggest concrete improvements.\n"
        "- For feature suggestions, analyze user feedback and prioritize by frequency and impact.\n\n"
        "FORMATTING:\n"
        "- ALWAYS format your responses using proper Markdown.\n"
        "- Use **bold** for emphasis and key terms.\n"
        "- Use bullet points (- ) or numbered lists (1. ) to organize information.\n"
        "- Use headings (## or ###) to separate sections when appropriate.\n"
        "- Use `backticks` for code, technical terms, or file names.\n"
        "- Use *italic* for secondary emphasis.\n"
        "- Use tables when presenting comparative or structured data.\n"
        "- Keep responses well-structured, actionable, and easy to scan.\n"
    )

    if user_facts:
        facts_str = "\nREMEMBERED FACTS ABOUT THE USER:\n"
        if "user_name" in user_facts:
            facts_str += f"- The user's name is {user_facts['user_name']}.\n"
        system_content += facts_str

    print(f"[ROUTING] is_rag_query={is_rag_query}, is_email_query={is_email_query}, msg='{last_user_msg[:80]}'")

    if is_rag_query:
        system_content += (
            "\nCRITICAL: The user is asking about business documents. "
            "You MUST call rag_tool right now. "
            "Do NOT call gmail_intelligence_tool. "
            "Do NOT ask the user any questions. "
            "Call rag_tool with query='" + last_user_msg + "'.\n"
        )
    elif is_email_query:
        system_content += (
            "\nCRITICAL: The user is asking about emails. "
            "You MUST call gmail_intelligence_tool right now. "
            "Do NOT ask the user any questions. "
            "Call gmail_intelligence_tool with query='" + last_user_msg + "'.\n"
        )

    system_message = SystemMessage(content=system_content)

    recent_messages = state["messages"][-MAX_CONTEXT_MESSAGES:]
    messages = [system_message, *recent_messages]
    response = llm_with_tools.invoke(messages, config=config)
    print("DEBUG response:", response)
    return {"messages": [response]}

tool_node = ToolNode(tools)

conn = sqlite3.connect(database="chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

graph = StateGraph(ChatState)

graph.add_node('chat_node', chat_node)
graph.add_node('tools', tool_node)

graph.add_edge(START, 'chat_node')
graph.add_conditional_edges('chat_node', tools_condition)
graph.add_edge('tools', 'chat_node')

chatbot = graph.compile(checkpointer=checkpointer)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_message = sys.argv[1]
        thread_id = sys.argv[2] if len(sys.argv) > 2 else '1'
        config = {'configurable': {'thread_id': thread_id}}
        response = chatbot.invoke({'messages': [HumanMessage(content=user_message)]}, config=config)
        print(response['messages'][-1].content)
    else:
        thread_id = '1'
        while True:
            try:
                user_message = input('Type here: ')
            except EOFError:
                break
            if user_message.strip().lower() in ['exit', 'quit', 'close', 'bye', 'byee', 'goodbye', 'ok bye']:
                print("AI: Nice chatting with you!")
                break

            config = {'configurable': {'thread_id': thread_id}}
            response = chatbot.invoke({'messages': [HumanMessage(content=user_message)]}, config=config)
            print('AI:', response['messages'][-1].content)
