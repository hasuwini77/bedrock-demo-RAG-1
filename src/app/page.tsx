import Chat from "./components/chat";
import SplineHead from "./components/splinehead";

export default function Home() {
  return (
    <>
      <div className="h-screen">
        <div className="font-orbitron text-3xl text-white bg-gray-900 bg-opacity-80 border border-cyan-400 rounded-xl p-6 shadow-lg shadow-cyan-500/50 relative">
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

        <SplineHead />
      </div>

      <main className="h-screen w-screen flex flex-col max-w-[80%] mx-auto bg-gray-800">
        <h1 className="text-2xl font-bold text-center my-8 text-white hidden">
          Claude Anthropic Rag Level 3 Calls
        </h1>
        <Chat />
      </main>
    </>
  );
}
