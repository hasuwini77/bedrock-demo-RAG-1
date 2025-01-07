import Chat from "./components/chat";

export default function Home() {
  return (
    <main>
      <h1 className="text-2xl font-bold text-center my-8">
        Claude Anthropic Basic Calls
      </h1>
      <Chat />
    </main>
  );
}
