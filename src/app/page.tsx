/*
Client component containing form for prompts and model responses
*/

"use client";

import { useState } from "react";
import { Models } from "./lib/utils";
import axios from "axios";

export default function Home() {
  const [currentModel, setCurrentModel] = useState<Models>("OpenAI");
  const [sysPrompt, setSysPrompt] = useState<string>("");
  const [userData, setUserData] = useState<string>("");
  const [modelData, setModelData] = useState<string>("");

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentModel, sysPrompt, userData
        })
      });
      const reader = response.body?.getReader();
      if (reader) {
        let currentChunk = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const decodedChunk = new TextDecoder().decode(value);
          currentChunk += decodedChunk;
          const lines = currentChunk.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('0:')) {
              const word = line.substring(3, line.length - 1);
              setModelData(prev => prev + word.replaceAll("\\n", "\n"));
            }
          }
          currentChunk = '';
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  const handleNew = async () => {
    setCurrentModel("OpenAI");
    setSysPrompt("");
    setUserData("");
    setModelData("");
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">AI Chat</h1>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="model" className="text-lg font-medium">Choose Model:</label>
          <select
            id="model"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value as Models)}>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sysPrompt" className="text-lg font-medium">System Prompt:</label>
          <textarea
            id="sysPrompt"
            className="border rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sysPrompt}
            onChange={(e) => setSysPrompt(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="userData" className="text-lg font-medium">User Input:</label>
          <textarea
            id="userData"
            className="border rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={userData}
            onChange={(e) => setUserData(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={handleSubmit}>
            Submit
          </button>
          <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={handleNew}>
            New
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-lg font-medium">Model Response:</label>
          <div className="border rounded px-3 py-2 resize-none whitespace-pre-line" dangerouslySetInnerHTML={{ __html: modelData }} />
        </div>
      </div>
    </div>
  );
}

