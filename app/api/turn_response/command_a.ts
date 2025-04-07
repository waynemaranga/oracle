
import { COHERE_API_KEY } from "@/config/constants";
import { NextResponse } from "next/server";
import { CohereClient } from "cohere-ai";

// POST request
export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json(); // Parse the incoming request from the frontend
    console.log("Received messages:", messages); // Log the received messages

    // Set up Cohere client
    const cohere = new CohereClient({
      token: COHERE_API_KEY,
    });

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start streaming chat completion from Cohere
          const response = await cohere.chatStream({
            message: messages[messages.length - 1].content,
            chatHistory: messages.slice(0, -1).map((msg: { role: any; content: any; }) => ({
              role: msg.role,
              message: msg.content,
            })),
            tools: tools,
            model: "command", // Using Cohere's Command model
          });

          // Process each chunk from the stream
          for await (const chunk of response) {
            if (chunk.eventType === "text-generation") {
              // Text generation event
              const data = JSON.stringify({
                event: "text",
                data: {
                  text: { value: chunk.text || "" },
                },
              });
              controller.enqueue(`data: ${data}\n\n`);
            } else if (chunk.eventType === "tool-calls-generation") {
              // Tool call event
              const data = JSON.stringify({
                event: "tool_call",
                data: {
                  tool_call: chunk.toolCalls,
                },
              });
              controller.enqueue(`data: ${data}\n\n`);
            }
          }

          controller.close(); // Close the stream when done
        } catch (error) {
          console.error("Error in Cohere streaming loop:", error);
          controller.error(error); // Handle errors
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in Cohere POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Test key
console.log(COHERE_API_KEY); // Log the API key
