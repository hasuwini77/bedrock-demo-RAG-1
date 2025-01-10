import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateStreamCommand,
  type RetrieveAndGenerateStreamCommandOutput,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("\n=== Request ===");
    console.log("Received prompt:", body.prompt);

    const client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || "us-east-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    console.log("\n=== Configuration ===");
    console.log("Using Knowledge Base ID:", process.env.KNOWLEDGE_BASE_ID);
    console.log("Region:", process.env.AWS_REGION);

    const command = new RetrieveAndGenerateStreamCommand({
      input: {
        text: body.prompt,
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

    console.log("\n=== Streaming Response ===");

    // ... previous imports and initial code remain the same

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
