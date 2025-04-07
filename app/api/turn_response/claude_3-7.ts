// Anthropic Claude Implementation

import { ANTHROPIC_API_KEY } from "@/config/constants";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// POST request
export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json(); // Parse the incoming request from the frontend
    console.log("Received messages:", messages); // Log the received messages

    // Set up Anthropic client
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Start streaming chat completion from Claude
    const stream = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      messages: messages,
      tools: tools,
      stream: true,
      max_tokens: 4096,
    });

    // Create a ReadableStream that emits SSE data
    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              // Text generation event
              const data = JSON.stringify({
                event: "text",
                data: {
                  text: { value: chunk.delta.text },
                },
              });
              controller.enqueue(`data: ${data}\n\n`);
            } else if ('tool_use' in chunk) {
              // Tool call event
              const data = JSON.stringify({
                event: "tool_call",
                data: {
                  tool_call: {
                    tool_name: (chunk.tool_use as { name: string }).name,
                    tool_arguments: (chunk.tool_use as { arguments: any }).arguments,
                  },
                },
              });
              controller.enqueue(`data: ${data}\n\n`);
            }
          }

          controller.close(); // Close the stream when done
        } catch (error) {
          console.error("Error in Claude streaming loop:", error);
          controller.error(error); // Handle errors
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in Claude POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Test key
console.log(ANTHROPIC_API_KEY); // Log the API key
