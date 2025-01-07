"use client";
import { useState } from "react";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      if (!res.ok) throw new Error("Failed to fetch response");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      // Create a new message for the assistant's response
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + "-assistant",
        type: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Read the stream
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
      console.error("Error:", error);
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
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask your question..."
            className="w-full p-2 border rounded bg-gray-700 text-white resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400 hover:bg-blue-600 transition-colors"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
