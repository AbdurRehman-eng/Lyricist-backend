import React from 'react';
import Navbar from './components/navbar'; // Import the Navbar component

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 pb-24 md:pb-6 md:pl-24 text-gray-100 relative">
      <Navbar /> {/* Include the Navbar component */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        <h1 className="text-4xl font-semibold mb-6 text-white mt-4" style={{ fontFamily: 'Zen Antique Soft, serif' }}>About Lyrica</h1>
        
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg text-gray-300 mb-4">
            <h2 className="text-2xl font-semibold text-blue-500 mb-4">Welcome to Lyrica</h2>
            <p className="mb-4">
              Lyrica is a cutting-edge lyric-based song search engine that revolutionizes the way you discover music. Our advanced AI-powered system allows you to find songs based on lyrics, melodies, or even the emotions they evoke.
            </p>
            <p className="mb-4">
              Whether you're trying to remember a song from a few lyrics or exploring new music that matches your mood, Lyrica is here to help. Our extensive database and intelligent search algorithms ensure that you find exactly what you're looking for.
            </p>
            <p className="mb-4">
              Join us on this musical journey and explore the world of music like never before. Welcome to Lyrica!
            </p>
          </div>
        </div>
        
        <div className="w-full max-w-2xl mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-blue-500">How It Works</h2>
          <div className="flex flex-col space-y-4">
            {[
              { title: "Voice Input", description: "Speak or sing the lyrics you remember" },
              { title: "AI Processing", description: "Our AI analyzes your input and searches our dataset" },
              { title: "Results", description: "Get a list of matching songs with details" },
              { title: "Discover", description: "Explore similar songs and expand your music library" },
            ].map((step, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-lg text-gray-300">
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <footer className="mt-12 text-center text-gray-500">
          <p>&copy; 2024 Lyrica. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default AboutPage;