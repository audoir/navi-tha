/*
API for model text generation
*/

import { MAX_LENGTH, Models } from "@/app/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from "@ai-sdk/anthropic";

interface ReqObj {
  currentModel: Models
  sysPrompt: string
  userData: string
}

export async function POST(request: NextRequest) {
  // get inputs and input validation
  const reqObj: ReqObj = await request.json();
  if (reqObj.currentModel === undefined ||
    reqObj.sysPrompt === undefined ||
    reqObj.userData === undefined ||
    !(reqObj.currentModel === "OpenAI" || reqObj.currentModel === "Anthropic") ||
    reqObj.userData.length === 0 ||
    reqObj.sysPrompt.length > MAX_LENGTH ||
    reqObj.userData.length > MAX_LENGTH
  ) {
    return new NextResponse("Bad data", { status: 400 });
  }

  // create messages as necessary
  const messages: CoreMessage[] = [];
  if (reqObj.sysPrompt.length > 0) {
    messages.push({
      role: "system",
      content: reqObj.sysPrompt,
    });
  }
  messages.push({
    role: "user",
    content: reqObj.userData,
  });

  // api access for streaming
  const result = await streamText({
    model: reqObj.currentModel === "OpenAI" ?
      openai('gpt-4o-mini') :
      anthropic('claude-3-5-haiku-latest'),
    messages
  });

  return result.toDataStreamResponse();
}