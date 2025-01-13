import Chat from "./components/chat";

export default function Home() {
  return (
    <main className="h-screen w-[70%] mx-auto flex flex-col">
      <h1 className="text-3xl font-bold text-center my-8">
        Claude Anthropic Basic Calls
      </h1>
      <Chat />
    </main>
  );
}
