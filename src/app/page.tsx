"use client";
import Link from "next/link";
import Chat from "./components/chat";

import { motion } from "framer-motion";
import SplineHeadSecond from "./components/splinehead2";

export default function Home() {
  return (
    <>
      <div className="min-h-[50%] md:h-screen">
        {/* Header Section */}
        <header className="w-full bg-gray-900 bg-opacity-90 border-b border-cyan-500 shadow-xl shadow-cyan-400/40">
          <div className="relative font-orbitron text-md md:text-3xl text-white p-6">
            <div className="absolute inset-0 border border-cyan-400 rounded-xl backdrop-blur-md opacity-30"></div>
            <div className="relative z-10 flex items-center justify-center space-x-4">
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="absolute inset-1 blur-[6px] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-blue-500">
                  RAG - Augmented Intelligence
                </span>
                <span className="relative tracking-wide text-white text-xl md:text-4xl font-semibold drop-shadow-[0_3px_6px_rgba(0,255,255,0.5)] group-hover:drop-shadow-[0_5px_10px_rgba(0,255,255,0.8)] transition-all">
                  RAG - Augmented Intelligence
                </span>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Main Hero Section */}
        <div className="relative flex items-center justify-center">
          {/* SplineHead */}
          <SplineHeadSecond />

          {/* Chat Button Positioned Next to SplineHead (Visible on Desktop Only) */}
          <Link href="#chat">
            <button
              className="absolute bottom-30 right-1/4 px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all hidden md:block"
              style={{
                boxShadow:
                  "0 0 15px rgba(0, 255, 255, 0.7), 0 0 20px rgba(0, 255, 255, 0.7)",
                textShadow: "0 0 10px rgba(0, 255, 255, 1)",
                backgroundImage:
                  "linear-gradient(45deg, rgba(0,255,255,0.4), rgba(0,204,255,0.6), rgba(0,255,255,0.7))",
                backgroundSize: "200% 200%",
                animation: "gradientMotion 3s ease infinite",
              }}
            >
              Click here to chat
            </button>
          </Link>
        </div>
      </div>

      {/* Chat Section */}
      <main
        id="chat"
        className="h-screen w-screen flex flex-col max-w-[100%] mx-auto bg-gray-800"
      >
        <Chat />
      </main>
    </>
  );
}
