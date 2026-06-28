import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, ArrowRight, Activity, Map, Bot, Waves } from 'lucide-react';
import OceanBackground from '../components/ocean/OceanBackground';
import WhaleHero from '../components/ocean/WhaleHero';
import { NAUTIX_BRAND } from '../constants/ocean';

const Landing = () => {
  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-sky-500 selection:text-slate-950">
     {/* <OceanBackground density="heavy" variant="hero" /> */}
      <WhaleHero />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 glass-panel px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-sm">
            <Anchor className="h-6 w-6" />
          </div>
          <span className="font-heading text-xl font-bold tracking-wider text-white">
            {NAUTIX_BRAND}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-white/80 hover:text-white transition-colors duration-200 text-sm font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-lg bg-[#4cc9f0] hover:bg-[#00b4d8] text-slate-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/30"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative flex-1 flex flex-col z-10">
        <section className="relative px-6 py-16 md:py-24 flex flex-col items-center text-center max-w-5xl mx-auto">
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 drop-shadow-lg">
            Explore the Depths with{' '}
            <span className="text-[#4cc9f0] drop-shadow-[0_0_20px_rgba(76,201,240,0.5)]">
              Nautix Data Engine
            </span>
          </h2>

          <p className="text-white/80 text-base sm:text-lg max-w-3xl leading-relaxed mb-10 drop-shadow-md">
            A comprehensive, interactive platform that bridges the gap between global ocean monitoring
            systems and conversational AI. Query metadata, generate high-fidelity profiles, index
            manuals via RAG, and view migration tracks instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#4cc9f0] hover:bg-[#00b4d8] text-slate-950 font-bold transition-all duration-200 shadow-xl shadow-cyan-500/30 cursor-pointer group"
            >
              Sign Up Free
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass-card hover:bg-white/10 text-white font-semibold transition-all duration-200 cursor-pointer border border-white/30"
            >
              <Waves className="h-5 w-5" />
              Access Platform
            </Link>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="relative px-6 py-16 z-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-12 text-white drop-shadow">
              Engineered for Scientific Ocean Exploration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-6 rounded-2xl hover:border-cyan-400/40 transition-all duration-300 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6" />
                </div>
                <h4 className="font-heading text-xl font-bold mb-3 text-white">Interactive Plots</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Analyze temperature and salinity vertical structures compared against depth pressure.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl hover:border-teal-400/40 transition-all duration-300 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-400/30 text-teal-400 flex items-center justify-center mb-6">
                  <Map className="h-6 w-6" />
                </div>
                <h4 className="font-heading text-xl font-bold mb-3 text-white">3D Globe Explorer</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Track autonomous floats on an interactive 3D Earth with temperature-colored markers.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl hover:border-purple-400/40 transition-all duration-300 hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-400/30 text-purple-400 flex items-center justify-center mb-6">
                  <Bot className="h-6 w-6" />
                </div>
                <h4 className="font-heading text-xl font-bold mb-3 text-white">Semantic Chat & RAG</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Interact with a retrieval-augmented LLM assistant for ocean data and general questions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 glass-panel px-6 py-8 text-center text-slate-400 text-xs">
        <p className="mb-2">
          © {new Date().getFullYear()} {NAUTIX_BRAND} Ocean Data Chatbot System. Built using FastAPI & React.
        </p>
      </footer>
    </div>
  );
};

export default Landing;

