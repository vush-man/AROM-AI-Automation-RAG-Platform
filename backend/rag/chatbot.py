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
    model = "qwen2.5:3b"
)
embeddings = OllamaEmbeddings(
    model = "qwen3-embedding:4b"
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
        '{"type":"<invoice|review|networking|event|promotional|other>",'
        '"suggested_action":"<action>","vendor":"<name>","amount":"<amount>",'
        '"due_date":"<date>","sentiment":"<positive|negative|neutral>"}\n\n'
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

retriever = vector_store.as_retriever(search_type='similarity', search_kwargs={'k':4})

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
    result = retriever.invoke(query)

    context = [doc.page_content for doc in result]
    metadata = [doc.metadata for doc in result]

    return {
        'query': query,
        'context': context,
        'metadata': metadata
    }

gmail_tools = GmailToolkit().get_tools()

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

    if "important" in normalized_query or "urgent" in normalized_query:
        gmail_query = "in:inbox"

    elif "invoice" in normalized_query:
        gmail_query = "in:inbox subject:invoice"

    elif "network" in normalized_query:
        gmail_query = "in:inbox subject:(invitation OR connect)"

    else:
        stop_words = {
            "can", "you", "tell", "me", "about", "the", "most", "recent",
            "mail", "mails", "email", "emails", "my", "i", "got", "any",
            "show", "find", "get", "check", "do", "have", "a", "an", "in",
            "from", "is", "it", "what", "of", "to", "and", "or", "if"
        }
        keywords = [w for w in normalized_query.split() if w not in stop_words]
        if keywords:
            gmail_query = "in:inbox " + " ".join(keywords)
        else:
            gmail_query = "in:inbox"

    print(f"[Gmail] Search query: {gmail_query}")

    raw_result = search_tool.invoke({
        "query": gmail_query,
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
                   "invoice", "invoices", "networking", "urgent", "important",
                   "unread", "recent emails", "check my", "show me my",
                   "vendor email", "client email", "payment", "billing",
                   "meeting invite", "correspondence"]

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
        "- For financial questions (expenditures, totals, costs), extract and calculate amounts from the retrieved documents.\n"
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

    if is_email_query:
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