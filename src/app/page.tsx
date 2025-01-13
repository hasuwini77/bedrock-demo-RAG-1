import Chat from "./components/chat";

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col max-w-[80%] mx-auto bg-gray-800">
      <h1 className="text-2xl font-bold text-center my-8 text-white">
        Claude Anthropic Rag Level 3 Calls
      </h1>
      <Chat />
    </main>
  );
}
