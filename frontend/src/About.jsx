import React from 'react';
import Navbar from './components/navbar';

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 pb-28 md:pb-6 md:pl-28 text-gray-100 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] aspect-square rounded-full bg-blue-950/15 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50vw] aspect-square rounded-full bg-indigo-950/15 blur-[120px]"></div>
      </div>

      <Navbar />
      
      <div className="flex flex-col items-center justify-center flex-grow w-full z-10">
        <h1 
          className="text-4xl font-semibold mb-6 text-white mt-4" 
          style={{ fontFamily: 'Zen Antique Soft, serif', letterSpacing: '0.05em' }}
        >
          About Lyrica
        </h1>
        
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-2xl bg-gray-900/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl text-gray-300 mb-4">
            <h2 className="text-2xl font-semibold text-blue-500 mb-4">Welcome to Lyrica</h2>
            <p className="mb-4 leading-relaxed">
              Lyrica is a cutting-edge lyric-based song search engine that revolutionizes the way you discover music. Our advanced AI-powered system allows you to find songs based on lyrics, melodies, or even the emotions they evoke.
            </p>
            <p className="mb-4 leading-relaxed">
              Whether you're trying to remember a song from a few lyrics or exploring new music that matches your mood, Lyrica is here to help. Our extensive database and intelligent search algorithms ensure that you find exactly what you're looking for.
            </p>
            <p className="leading-relaxed">
              Join us on this musical journey and explore the world of music like never before. Welcome to Lyrica!
            </p>
          </div>
        </div>
        
        <div className="w-full max-w-2xl mt-10">
          <h2 className="text-2xl font-semibold mb-6 text-blue-500 text-center md:text-left">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Voice Input", description: "Speak or sing the lyrics you remember into the audio query interface." },
              { title: "AI Processing", description: "Our AI preprocesses, spells-corrects, and queries our dataset instantly." },
              { title: "Results", description: "Get a list of matching songs accompanied by interactive Spotify players." },
              { title: "Discover", description: "Explore similar tracks to expand your musical library dynamically." },
            ].map((step, index) => (
              <div 
                key={index} 
                className="bg-gray-905/30 backdrop-blur-sm border border-white/5 p-5 rounded-xl shadow-lg text-gray-300 hover:border-blue-500/20 transition-all duration-200"
              >
                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <footer className="mt-16 text-center text-gray-600 text-sm">
          <p>&copy; 2024 Lyrica. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default AboutPage;