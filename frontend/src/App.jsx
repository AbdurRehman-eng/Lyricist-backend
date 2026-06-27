import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mic } from 'lucide-react';
import Navbar from './components/navbar';

// Skeleton Loader Component for Song Cards
const SongCardSkeleton = () => (
  <div className="bg-gray-800/60 p-4 rounded-xl shadow-lg border border-gray-700/30 animate-pulse flex flex-col justify-between h-[510px]">
    <div>
      <div className="h-6 bg-gray-700/60 rounded-md w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-700/40 rounded-md w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-700/40 rounded-md w-2/3 mb-4"></div>
    </div>
    <div className="h-[380px] bg-gray-700/20 rounded-lg w-full flex items-center justify-center border border-gray-700/10">
      <div className="w-10 h-10 rounded-full bg-gray-700/30 flex items-center justify-center">
        <div className="w-4 h-4 bg-gray-700/50 rounded-sm"></div>
      </div>
    </div>
  </div>
);

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults(null);
    setCurrentPage(1);
    
    try {
      const response = await fetch(`http://localhost:5000/search?query=${query}`);
      const data = await response.json();
      setIsLoading(false);
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setIsLoading(false);
      setError('An error occurred while fetching the data.');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const paginatedResults = results
    ? results.ranked_results.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage)
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center bg-black p-6 pb-24 md:pb-6 md:pl-24 text-gray-100 relative transition-all duration-300">
      <Navbar />
      
      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl">
        <h1 
          className="text-5xl md:text-6xl font-bold mb-8 text-white select-none text-center" 
          style={{ fontFamily: 'Zen Antique Soft, serif', letterSpacing: '0.05em' }}
        >
          Lyrica
        </h1>
        
        {/* Search bar container */}
        <div className="mb-6 w-full max-w-2xl transition-all duration-200">
          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter song name, artists, or lyrics..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-800/80 border border-gray-700/60 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 text-lg text-white placeholder-gray-400/70 transition-all shadow-md group-hover:border-gray-600/80"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400/80 h-5.5 w-5.5 group-hover:text-gray-300" />
          </div>
          
          <div className="flex mt-4 space-x-4">
            <button
              onClick={handleSearch}
              className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              disabled={isLoading}
            >
              Search Database
            </button>
            <Link 
              to="/audio-search" 
              className="flex items-center justify-center px-6 bg-gray-800 border border-gray-700/60 text-white rounded-xl hover:bg-gray-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-gray-500/50"
            >
              <Mic className="h-5 w-5 mr-2 text-blue-400" />
              Voice Search
            </Link>
          </div>
        </div>

        {/* Query Syntax Helper Tips */}
        {!results && !isLoading && !error && (
          <div className="w-full max-w-2xl bg-gray-900/40 border border-gray-800/80 p-5 rounded-xl text-gray-400 text-sm mt-8 animate-fadeIn">
            <h3 className="font-semibold text-white mb-3 text-base flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 shadow-glow shadow-blue-500/50"></span>
              Search Syntax Tips
            </h3>
            <ul className="space-y-2.5 list-disc list-inside">
              <li><strong>Phrase Match:</strong> Use double quotes to find exact lyrics, e.g., <code className="text-blue-400 px-1 py-0.5 rounded bg-gray-800">"perfect love"</code>.</li>
              <li><strong>Boolean logic:</strong> Combine terms using <code className="text-blue-400">AND</code>, <code className="text-blue-400">OR</code>, or <code className="text-blue-400">NOT</code>, e.g., <code className="text-blue-400">happy OR sad</code>.</li>
              <li><strong>Typo Tolerance:</strong> Query terms are automatically spelling-corrected, e.g., searching <code className="text-blue-400">lovve</code> retrieves <code className="text-blue-400">love</code> matches.</li>
            </ul>
          </div>
        )}

        {/* Loading Skeletons State */}
        {isLoading && (
          <div className="w-full max-w-4xl mt-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-xl font-semibold text-blue-500">Searching lyric database...</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(resultsPerPage)].map((_, i) => (
                <SongCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl max-w-xl text-center shadow-lg">
            {error}
          </div>
        )}

        {/* Search Results */}
        {results && !isLoading && (
          <div className="w-full max-w-4xl mt-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 pb-2 border-b border-gray-800/60">
              <h2 className="text-xl font-semibold text-blue-500">
                Results for <span className="text-white">"{results.query}"</span>:
              </h2>
              <span className="text-sm text-gray-500 mt-1 sm:mt-0">
                Found {results.ranked_results.length} matched songs
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedResults.map(([details], index) => (
                <div 
                  key={index} 
                  className="bg-gray-800/60 border border-gray-700/30 p-4 rounded-xl shadow-lg text-gray-300 flex flex-col justify-between hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
                >
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2 line-clamp-1" title={details.name}>
                      {details.name}
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-1" title={details.artists}>
                      Artists: {details.artists}
                    </p>
                    <p className="text-sm text-gray-400 line-clamp-1 mb-4" title={details.album_name}>
                      Album: {details.album_name}
                    </p>
                  </div>
                  {details.spotify_id && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-700/20 bg-gray-900/50">
                      <iframe
                        src={`https://open.spotify.com/embed/track/${details.spotify_id.replace(/['"]+/g, '').trim()}`}
                        width="100%"
                        height="380"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        className="rounded-lg shadow-inner"
                        loading="lazy"
                      ></iframe>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {results.ranked_results.length > resultsPerPage && (
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 bg-gray-800 border border-gray-700/60 text-white rounded-xl hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                >
                  Previous
                </button>
                <span className="text-gray-400 text-sm font-medium">
                  Page {currentPage} of {Math.ceil(results.ranked_results.length / resultsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, Math.ceil(results.ranked_results.length / resultsPerPage))
                    )
                  }
                  disabled={currentPage === Math.ceil(results.ranked_results.length / resultsPerPage)}
                  className="px-5 py-2.5 bg-gray-800 border border-gray-700/60 text-white rounded-xl hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <footer className="mt-16 text-center text-gray-600 text-sm">
        <p>&copy; 2024 Lyrica. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;