"use client";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  sources?: Array<{
    reference: string;
    page?: number;
  }>;
}

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: prompt.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + "-assistant",
        type: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: msg.content + text }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setPrompt("");
    }
  };

  return (
    <BackgroundGradient className="p-6 sm:p-10 rounded-[22px] h-screen w-full max-w-5xl mx-auto">
      <div
        id="chat"
        className="flex flex-col min-h-full bg-gray-900 border border-cyan-400 rounded-xl shadow-lg shadow-cyan-500/50"
      >
        <h1
          id="chat"
          className="text-2xl font-bold text-center my-8 text-white "
        >
          RAG Augmented Chatbot
        </h1>
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-4 border-b border-cyan-400">
          <h1 className="font-orbitron text-xl text-center text-cyan-300">
            Anthropic Claude v3
          </h1>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-cyan-400 text-center py-8">
              Start a conversation with me, I'll write a blog post for you 😊
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.type === "user"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-800 text-cyan-200"
                } shadow-md`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-cyan-400 text-sm">
                    <p className="font-semibold text-cyan-400">Sources:</p>
                    <ul className="list-disc pl-4">
                      {message.sources.map((source, index) => (
                        <li key={index} className="text-cyan-300">
                          {source.reference}
                          {source.page && ` (Page ${source.page})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-cyan-400 p-4 bg-gray-800 rounded-b-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Choose a cool topic for a blog post"
              className="w-full p-3 border border-cyan-400 rounded bg-gray-700 text-cyan-200 placeholder-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              rows={3}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Send"
              )}
            </button>
          </form>
        </div>
      </div>
    </BackgroundGradient>
  );
}
