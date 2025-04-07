// Azure OpenAI Implementation; from Azure AI Foundry

import {
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_ENDPOINT,
} from "@/config/constants";
import { NextResponse } from "next/server";
import { AzureOpenAI } from "openai";

// POST request
export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json(); // Parse the incoming request from the frontend
    console.log("Received messages:", messages); // Log the received messages

    // Set up Azure OpenAI client
    const client = new AzureOpenAI({
      apiKey: AZURE_OPENAI_API_KEY,
      endpoint: AZURE_OPENAI_ENDPOINT,
      apiVersion: "2025-03-01-preview",
      deployment: "o3-mini"
    });

    // Start streaming chat completion from Azure OpenAI
    const events = await client.responses.create({
      model: "o3-mini", // Using deployment name
      input: messages,
      tools,
      stream: true,
      parallel_tool_calls: false,
    });

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }

          controller.close(); // Close the stream when done
        } catch (error) {
          console.error("Error in Azure OpenAI streaming loop:", error);
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
    console.error("Error in Azure OpenAI POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Test key & endpoint
console.log(AZURE_OPENAI_API_KEY); // Log the API key
console.log(AZURE_OPENAI_ENDPOINT); // Log the endpoint

// Example POST request
