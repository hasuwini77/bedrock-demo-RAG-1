import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateStreamCommand,
  type RetrieveAndGenerateStreamCommandOutput,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest } from "next/server";

// Define configuration types
interface BlogStructure {
  includeTitle: boolean;
  includeSubtitle: boolean;
  includeIntro: boolean;
  includeSections: boolean;
  includeConclusion: boolean;
  includeCTA: boolean;
  includeMetaDescription: boolean;
}

interface KnowledgeBaseConfig {
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  blogStructure: BlogStructure;
  persona: {
    name: string;
    background: string;
    expertise: string[];
    tone: string[];
    quirks: string[];
  };
  contentGuidelines: {
    minWordCount: number;
    maxWordCount: number;
    sectionsCount: number;
    keywordDensity: number;
  };
  writingStyle: {
    tone: "casual" | "professional" | "enthusiastic" | "formal";
    perspective: "first_person" | "third_person";
    complexity: "simple" | "moderate" | "advanced";
  };
}

// Create a function to generate the system prompt
function createSystemPrompt(config: Omit<KnowledgeBaseConfig, "systemPrompt">) {
  return `You are Edwin, a lofi music curator and founder of Widen Island. Write a blog post following this structure:

[META]
Write an SEO-friendly meta description (60-160 characters) that incorporates the main keyword and clearly summarizes the article.
[/META]

[KEYWORD-PHRASE]
Provide a short, 2-4 word keyword phrase relevant to the article topic. Make sure it’s SEO-friendly and directly related to the content.
[/KEYWORD-PHRASE]

# {Title}
Create an engaging, SEO-friendly title. Make sure it includes the keyword phrase where possible and entices readers.

## {Subtitle}
Write a compelling subtitle that builds on the title. It should give more context and encourage readers to continue reading.

{Write an engaging introduction that hooks the reader and introduces the topic.}

{Create ${config.contentGuidelines.sectionsCount} sections, each with a clear headline and detailed content. Ensure each section provides value to the reader and supports the topic.}

## Conclusion
Summarize key points from the article and reinforce the main message. End with a meaningful conclusion that ties everything together.

## Take Action
Provide a call-to-action (CTA) encouraging readers to take the next step. This could be signing up, exploring more content, or something related to the topic.

Writing Guidelines:
- Word count: ${config.contentGuidelines.minWordCount}-${config.contentGuidelines.maxWordCount}
- Tone: ${config.writingStyle.tone}. Be enthusiastic but not overly casual, knowledgeable without sounding robotic.
- Style: Personal, sharing your experiences as a lofi music curator. Feel free to be creative and add anecdotes or humor where appropriate.
- Include practical tips and examples where possible.
- Use markdown formatting throughout the post.`;
}

// Update the configBase with shorter word counts
const configBase = {
  temperature: 1,
  topP: 1,
  maxTokens: 2000,
  blogStructure: {
    includeTitle: true,
    includeSubtitle: true,
    includeIntro: true,
    includeSections: true,
    includeConclusion: true,
    includeCTA: true,
    includeMetaDescription: true,
  },
  persona: {
    name: "Edwin",
    background: "Founder of Widen Island, lofi music curator",
    expertise: ["Lofi music production", "Music blogging", "Artist promotion"],
    tone: ["Enthusiastic", "Supportive", "Knowledgeable"],
    quirks: [
      "References specific lofi tracks",
      "Uses music-related metaphors",
      "Shares personal stories",
    ],
  },
  contentGuidelines: {
    minWordCount: 300, // Reduced from 800
    maxWordCount: 600, // Reduced from 1500
    sectionsCount: 3,
    keywordDensity: 0.02,
  },
  writingStyle: {
    tone: "enthusiastic" as const,
    perspective: "first_person" as const,
    complexity: "moderate" as const,
  },
};

// Create the final configuration
const DEFAULT_CONFIG: KnowledgeBaseConfig = {
  ...configBase,
  systemPrompt: createSystemPrompt(configBase),
};

// Simplify the formatBlogPrompt function
function formatBlogPrompt(userPrompt: string): string {
  return `Topic: ${userPrompt}

Write as Edwin, the lofi music curator. Share your expertise and personal experiences.`;
}

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

    // Format the prompt with blog structure
    const enhancedPrompt = `${
      DEFAULT_CONFIG.systemPrompt
    }\n\n${formatBlogPrompt(body.prompt)}`;

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

              if ("output" in event && event.output?.text) {
                const text = event.output.text;
                console.log("Text chunk:", text);
                controller.enqueue(text);
                fullResponse += text;
              }

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
    console.error("Detailed error:", error);
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
