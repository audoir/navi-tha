/*
Client component containing form for prompts and model responses
*/

"use client";

import { Fragment, useRef, useState } from "react";
import { Models } from "./lib/utils";

export default function Home() {
  const [backendMode, setBackendMode] = useState<BackendMode>("nextjs");
  const [currentModel, setCurrentModel] = useState<Models>("OpenAI");
  const [sysPrompt, setSysPrompt] = useState<string>("");
  const [userData, setUserData] = useState<string>("");
  const [modelData, setModelData] = useState<string>("");
  const [viewState, setViewState] = useState<ViewStates>("default");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [history, setHistory] = useState<HistoryObj[]>([]);

  // sends user input to backend API, gets streaming data and updates states
  const handleSubmit = async () => {
    setErrorMessage("");
    if (userData === "") {
      setErrorMessage("User Input is required.");
      return;
    }
    setViewState("loading");
    try {
      const response = await fetch(backendMode === "nextjs" ?
        '/api/chat' : 'http://127.0.0.1:5000/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentModel, sysPrompt, userData
          })
        });
      if (response.status !== 200) {
        throw new Error();
      }
      // handle streaming data
      const reader = response.body?.getReader();
      let collectedModelData = '';
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
            if (backendMode === "nextjs") {
              if (line.startsWith('0:')) {
                const word = line.substring(3, line.length - 1).replaceAll("\\n", "\n");
                setModelData(prev => prev + word);
                collectedModelData += word;
              }
            } else {
              if (line === "") {
                setModelData(prev => prev + "\n");
                collectedModelData += "\n";
              } else {
                setModelData(prev => prev + line);
                collectedModelData += line;
              }
            }
          }
          currentChunk = '';
        }
      }
      setViewState("done");
      setHistory([...history, { backendMode, currentModel, sysPrompt, userData, modelData: collectedModelData }]);
    } catch (error) {
      setViewState("default");
      setErrorMessage("An error has occurred. Please try again.");
    }
  }

  // resets form to allow new user input
  const handleNew = () => {
    setSysPrompt("");
    setUserData("");
    setModelData("");
    setErrorMessage("");
    setViewState("default");
  }

  // updates form to show item in history
  const viewHistory = (index: number) => {
    setBackendMode(history[index].backendMode);
    setCurrentModel(history[index].currentModel);
    setSysPrompt(history[index].sysPrompt);
    setUserData(history[index].userData);
    setModelData(history[index].modelData);
    setErrorMessage("");
    setViewState("done");
    rootRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mx-auto p-4" ref={rootRef}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            className={`bg-green-500 ${viewState === "loading" ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"} text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline`}
            onClick={handleNew}
            disabled={viewState === "loading"}
          >
            New
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="backendMode" className="text-lg font-medium">Choose Backend Mode:</label>
          <select
            id="backendMode"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={backendMode}
            onChange={(e) => setBackendMode(e.target.value as BackendMode)}
            disabled={viewState !== "default"}
          >
            <option value="nextjs">Next.js</option>
            <option value="python">Python</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="model" className="text-lg font-medium">Choose Model:</label>
          <select
            id="model"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value as Models)}
            disabled={viewState !== "default"}
          >
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
            disabled={viewState !== "default"}
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
            disabled={viewState !== "default"}
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`bg-blue-500 ${viewState !== "default" ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
            onClick={handleSubmit}
            disabled={viewState !== "default"}
          >
            Submit
          </button>
        </div>
        {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
        {viewState === "loading" && <div className="text-green-500 mb-4">Generating...</div>}
        <div className="flex flex-col gap-2">
          <label className="text-lg font-medium">Model Response:</label>
          <div className="border rounded px-3 py-2 resize-none whitespace-pre-line" dangerouslySetInnerHTML={{ __html: modelData }} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-lg font-medium">History:</label>
          <ul className="border rounded px-3 py-2 whitespace-pre-line">
            {history.map((item, index) => (
              <Fragment key={index}>
                <HistoryItem item={item} onClick={() => viewHistory(index)} />
                {index < history.length - 1 && <hr className="my-2" />}
              </Fragment>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type ViewStates = "default" | "loading" | "done";
type BackendMode = "nextjs" | "python";

interface HistoryObj {
  backendMode: BackendMode
  currentModel: Models
  sysPrompt: string
  userData: string
  modelData: string
}

interface HistoryItemProps {
  item: HistoryObj;
  onClick: () => void;
}

function HistoryItem({ item, onClick }: HistoryItemProps) {
  return (
    <li
      className="cursor-pointer hover:bg-gray-100 p-2 rounded"
      onClick={onClick}
    >
      <div className="font-bold">User Data:</div>
      <div>{item.userData}</div>
      <div className="font-bold">System Prompt:</div>
      <div>{item.sysPrompt}</div>
    </li>
  );
}