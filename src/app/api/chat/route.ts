import { MAX_LENGTH, Models } from "@/app/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

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

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: "system",
        content: reqObj.sysPrompt,
      },
      {
        role: "user",
        content: reqObj.userData,
      },
    ]
  });

  return result.toDataStreamResponse();
}