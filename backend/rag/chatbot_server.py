"""
Lightweight Flask wrapper around chatbot.py
Supports both regular and STREAMING responses via SSE
"""
from flask import Flask, request, jsonify, Response
import sys
import os
import json

# Make sure we can import chatbot from the same directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chatbot import chatbot, HumanMessage

app = Flask(__name__)


@app.route("/chat", methods=["POST"])
def chat_endpoint():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        query = data.get("query", "")
        thread_id = data.get("thread_id", "1")

        if not query:
            return jsonify({"error": "No query provided"}), 400

        config = {"configurable": {"thread_id": thread_id}}
        response = chatbot.invoke(
            {"messages": [HumanMessage(content=query)]}, config=config
        )
        answer = response["messages"][-1].content
        return jsonify({"answer": answer})
    except Exception as e:
        import traceback
        print("🔥 Server Error:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/chat/stream", methods=["POST"])
def chat_stream():
    """Stream response tokens via Server-Sent Events (SSE)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        query = data.get("query", "")
        thread_id = data.get("thread_id", "1")

        if not query:
            return jsonify({"error": "No query provided"}), 400

        config = {"configurable": {"thread_id": thread_id}}

        def generate():
            try:
                full_answer = ""
                emitted_tool_calls = set()
                emitted_tool_results = set()
                for event in chatbot.stream(
                    {"messages": [HumanMessage(content=query)]},
                    config=config,
                    stream_mode="messages",
                ):
                    msg, metadata = event

                    # Stream AI response tokens
                    if hasattr(msg, "content") and msg.content and metadata.get("langgraph_node") == "chat_node":
                        if hasattr(msg, "tool_calls") and msg.tool_calls:
                            for tc in msg.tool_calls:
                                tool_name = tc.get("name", "unknown")
                                if tool_name not in emitted_tool_calls:
                                    emitted_tool_calls.add(tool_name)
                                    tool_event = {
                                        "tool_call": True,
                                        "tool_name": tool_name,
                                        "tool_args": tc.get("args", {}),
                                    }
                                    yield f"data: {json.dumps(tool_event)}\n\n"
                        else:
                            chunk = msg.content
                            full_answer += chunk
                            yield f"data: {json.dumps({'token': chunk})}\n\n"

                    # Stream tool results (documents retrieved, email analysis, etc.)
                    if metadata.get("langgraph_node") == "tools" and hasattr(msg, "content") and hasattr(msg, "name"):
                        tool_name = getattr(msg, "name", "tool")
                        if tool_name not in emitted_tool_results:
                            emitted_tool_results.add(tool_name)
                            sources = []
                            try:
                                tool_content = msg.content
                                if isinstance(tool_content, str):
                                    tool_content = json.loads(tool_content)
                                if isinstance(tool_content, dict):
                                    if "metadata" in tool_content:
                                        for meta in tool_content["metadata"]:
                                            if isinstance(meta, dict) and "source" in meta:
                                                source_name = meta["source"].split("/")[-1].split("\\")[-1]
                                                if source_name not in sources:
                                                    sources.append(source_name)
                                    if "context" in tool_content:
                                        sources.append(f"{len(tool_content['context'])} document chunks")
                                elif isinstance(tool_content, list):
                                    sources.append(f"{len(tool_content)} emails analyzed")
                            except (json.JSONDecodeError, TypeError, AttributeError):
                                pass

                            tool_result_event = {
                                "tool_result": True,
                                "tool_name": tool_name,
                                "sources": sources,
                            }
                            yield f"data: {json.dumps(tool_result_event)}\n\n"

                # Signal completion
                yield f"data: {json.dumps({'done': True, 'full_answer': full_answer})}\n\n"
            except Exception as e:
                import traceback
                print("🔥 Stream Error:", traceback.format_exc())
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return Response(
            generate(),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Access-Control-Allow-Origin": "*",
            },
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("🤖 Python Chatbot API starting on http://127.0.0.1:5001")
    print("   Streaming endpoint: POST /chat/stream")
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
