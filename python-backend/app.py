from flask import Flask, request, Response
from flask_cors import CORS
import os
from dotenv import load_dotenv
from anthropic import Anthropic
from openai import OpenAI
from typing import List, Dict

load_dotenv(dotenv_path="../.env.local")

app = Flask(__name__)
CORS(app)

MAX_LENGTH = 24000

class CoreMessage:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

class Models:
    OPENAI = "OpenAI"
    ANTHROPIC = "Anthropic"

def stream_text(model: str, messages: List[CoreMessage]) -> Response:
    if model == Models.OPENAI:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": message.role, "content": message.content}
                for message in messages
            ],
            stream=True,
        )
    elif model == Models.ANTHROPIC:
        client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        completion = client.completions.create(
            model="claude-3-5-haiku-latest",
            messages=[
                {"role": message.role, "content": message.content}
                for message in messages
            ],
            stream=True,
        )
    else:
        return Response("Invalid model", status=400)

    def generate_response(completion):
        for chunk in completion:
            # Check if content is not None before encoding
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content.encode('utf-8') 

    return Response(generate_response(completion), mimetype="text/event-stream")

@app.route('/', methods=['POST'])
def generate():
    req_data = request.get_json()

    if (
        "currentModel" not in req_data
        or "sysPrompt" not in req_data
        or "userData" not in req_data
        or req_data["currentModel"] not in [Models.OPENAI, Models.ANTHROPIC]
        or len(req_data["userData"]) == 0
        or len(req_data["sysPrompt"]) > MAX_LENGTH
        or len(req_data["userData"]) > MAX_LENGTH
    ):
        return Response("Bad data", status=400)

    messages = []
    if len(req_data["sysPrompt"]) > 0:
        messages.append(CoreMessage(role="system", content=req_data["sysPrompt"]))
    messages.append(CoreMessage(role="user", content=req_data["userData"]))

    return stream_text(req_data["currentModel"], messages)

if __name__ == "__main__":
    app.run(debug=True)