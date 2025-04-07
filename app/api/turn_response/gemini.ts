// Google Gemini AI Implementation

import { GOOGLE_API_KEY } from "@/config/constants";

const apiKey: string = GOOGLE_API_KEY || ""; // Provide a default value for GOOGLE_API_KEY if it is undefined
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// POST request
export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json(); // Parse the incoming request from the frontend
    console.log("Received messages:", messages); // Log the received messages
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction:
        messages.find((msg: { role: string; }) => msg.role === "system")?.content || "",
    });

    // Format messages for Gemini
    const chatHistory = messages
      .filter((msg: { role: string; }) => msg.role !== "system")
      .map((msg: { role: string; content: any; }) => ({
        role: msg.role === "assistant" ? "model" : msg.role,
        parts: [{ text: msg.content }],
      }));

    // Start a chat session
    const chat = model.startChat({
      history: chatHistory.slice(0, -1),
      tools: tools
        ? tools.map((tool: { function: { name: any; description: any; parameters: any; }; }) => ({
            functionDeclarations: [
              {
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters,
              },
            ],
          }))
        : undefined,
    });

    // Generate streaming response
    const result = await chat.sendMessageStream(
      chatHistory[chatHistory.length - 1].parts[0].text
    );

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            if (chunk.text) {
              // Text generation event
              const data = JSON.stringify({
                event: "text",
                data: {
                  text: { value: chunk.text },
                },
              });
              controller.enqueue(`data: ${data}\n\n`);
            } else if (chunk.functionCalls) {
              // Tool call event
              const data = JSON.stringify({
                event: "tool_call",
                data: {
                  tool_call: {
                    tool_name: chunk.functionCalls.name,
                  },
                },
              });
              controller.enqueue(`data: ${data}\n\n`);
            }
          }

          controller.close(); // Close the stream when done
        } catch (error) {
          console.error("Error in Gemini streaming loop:", error);
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
    console.error("Error in Gemini POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Test key
console.log(GOOGLE_API_KEY); // Log the API key
