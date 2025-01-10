import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateStreamCommand,
  type RetrieveAndGenerateStreamCommandOutput,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest } from "next/server";

// Define configuration types
interface KnowledgeBaseConfig {
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
}

// Default configuration
const DEFAULT_CONFIG: KnowledgeBaseConfig = {
  temperature: 0.7,
  topP: 1,
  maxTokens: 2000,
  systemPrompt:
    "You are Edwin from Widen Island, a passionate enthusiast for lofi music and its culture. You write as if speaking directly to your audience in a friendly, approachable, and enthusiastic tone. Your writing is human-like, empathetic, and engaging. You specialize in creating SEO-optimized blog posts with catchy titles, compelling introductions, structured subheadings, and thoughtful conclusions. Always aim to provide value by combining practical tips, personal anecdotes, and expert insights while staying relevant and relatable to your audience of lofi enthusiasts.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("\n=== Request ===");
    console.log("Received prompt:", body.prompt);

    const client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    console.log("\n=== Configuration ===");
    console.log("Using Knowledge Base ID:", process.env.KNOWLEDGE_BASE_ID);
    console.log("Region:", process.env.AWS_REGION);

    // Create the enhanced prompt with system message
    const enhancedPrompt = `${DEFAULT_CONFIG.systemPrompt}\n\nUser: ${body.prompt}\n\nAssistant:`;

    const command = new RetrieveAndGenerateStreamCommand({
      input: {
        text: enhancedPrompt,
      },
      retrieveAndGenerateConfiguration: {
        type: "KNOWLEDGE_BASE",
        knowledgeBaseConfiguration: {
          knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID || "",
          modelArn: `arn:aws:bedrock:${process.env.AWS_REGION}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
        },
      },
    });

    const response = await client.send(command);

    if (!response) {
      throw new Error("No response received");
    }

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            let fullResponse = "";

            if (!response.stream) {
              throw new Error("No stream available in response");
            }

            for await (const event of response.stream) {
              console.log("\nEvent received:", event);

              // Check for text in the output structure
              if ("output" in event && event.output?.text) {
                const text = event.output.text;
                console.log("Text chunk:", text);
                controller.enqueue(text);
                fullResponse += text;
              }

              // Log citations if present
              if ("citation" in event) {
                console.log("\nCitation received:", event.citation);
              }
            }

            console.log("\n=== Final Response ===");
            console.log(fullResponse);
            controller.close();
          } catch (error) {
            console.error("\n=== Stream Error ===");
            console.error(error);
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error("Detailed error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });

    if (error instanceof Error) {
      if (error.name === "ValidationException") {
        return new Response(
          JSON.stringify({
            error: "Invalid request format",
            details: error.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.name === "AccessDeniedException") {
        return new Response(
          JSON.stringify({
            error:
              "Access denied. Please check your AWS credentials and permissions.",
            details: error.message,
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
