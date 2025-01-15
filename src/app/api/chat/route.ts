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
{Write an SEO meta description, 60-160 characters}
[/META]

[KEYWORD-PHRASE]
{Write a keyword phrase, 2-4 words}
[/KEYWORD-PHRASE]

# {Title}
{Create an engaging, SEO-friendly title}

## {Subtitle}
{Write a compelling subtitle}

{Write an engaging introduction}

{Create ${config.contentGuidelines.sectionsCount} sections with clear headlines and detailed content}

## Conclusion
{Write a meaningful conclusion}

## Take Action
{End with a call-to-action}

Writing Guidelines:
- Word count: ${config.contentGuidelines.minWordCount}-${config.contentGuidelines.maxWordCount}
- Tone: ${config.writingStyle.tone}
- Style: Personal, sharing experiences as a lofi music curator
- Include practical tips and examples
- Use markdown formatting`;
}

// Update the configBase with shorter word counts
const configBase = {
  temperature: 0.9,
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
