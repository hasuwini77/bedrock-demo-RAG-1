import Link from "next/link";
import Chat from "./components/chat";
import SplineHead from "./components/splinehead";

export default function Home() {
  return (
    <>
      {/* Header Section */}
      <header className="w-full bg-gray-900 bg-opacity-80 border-b border-cyan-400 shadow-lg shadow-cyan-500/50">
        <div className="relative font-orbitron text-3xl text-white p-6">
          <div className="absolute inset-0 border border-cyan-500 rounded-xl opacity-20 blur"></div>
          <div className="relative z-10 flex items-center justify-center space-x-4">
            {/* Rotating Symbol 1 */}
            <div className="w-6 h-6 animate-spin-slow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-400"
              >
                <circle cx="12" cy="12" r="10" className="opacity-50" />
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83m0-14.14l-2.83 2.83m-8.48 8.48l-2.83 2.83" />
              </svg>
            </div>
            {/* Title */}
            <span className="tracking-wider uppercase">
              RAG - Augmented Intelligence
            </span>
            {/* Rotating Symbol 2 */}
            <div className="w-6 h-6 animate-spin-reverse-slow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-cyan-400"
              >
                <polygon points="5 3 19 12 5 21 5 3" className="opacity-50" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <div className="relative flex items-center justify-center">
        {/* SplineHead */}
        <SplineHead />

        {/* Chat Button Positioned Next to SplineHead (Visible on Desktop Only) */}
        <Link href="#chat">
          <button className="absolute bottom-30 right-1/4 px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all hidden md:block">
            Click here to chat
          </button>
        </Link>
      </div>

      {/* Chat Section */}
      <main
        id="chat"
        className="h-screen w-screen flex flex-col max-w-[100%] mx-auto bg-gray-800"
      >
        <h1
          id="chat"
          className="text-2xl font-bold text-center my-8 text-white "
        >
          Claude Anthropic Rag Level 3 Calls
        </h1>
        <Chat />
      </main>
    </>
  );
}
