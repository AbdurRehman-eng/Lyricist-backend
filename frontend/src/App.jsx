import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mic, Sparkles, BookOpen, AlertCircle, Check } from 'lucide-react';
import Navbar from './components/navbar';

// Skeleton Loader Component for Song Cards
const SongCardSkeleton = () => (
  <div className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-4 rounded-2xl shadow-md dark:shadow-lg animate-pulse flex flex-col justify-between h-[510px] min-w-0 overflow-hidden">
    <div>
      <div className="h-6 bg-slate-200 dark:bg-gray-800/60 rounded-md w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-200/80 dark:bg-gray-800/40 rounded-md w-1/2 mb-2"></div>
      <div className="h-4 bg-slate-200/80 dark:bg-gray-800/40 rounded-md w-2/3 mb-4"></div>
    </div>
    <div className="h-[380px] bg-slate-100/50 dark:bg-gray-800/20 rounded-xl w-full flex items-center justify-center border border-slate-200 dark:border-white/5">
      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-800/30 flex items-center justify-center">
        <div className="w-4 h-4 bg-slate-300 dark:bg-gray-800/50 rounded-sm"></div>
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
    <div className="min-h-screen flex flex-col items-center bg-slate-50 dark:bg-black p-6 pb-28 md:pb-6 md:pl-28 text-slate-800 dark:text-gray-100 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] aspect-square rounded-full bg-blue-200/40 dark:bg-blue-950/15 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50vw] aspect-square rounded-full bg-indigo-200/40 dark:bg-indigo-950/15 blur-[120px]"></div>
      </div>

      <Navbar />
      
      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-6xl z-10">
        <h1 
          className="text-5xl md:text-6xl font-bold mb-8 text-slate-900 dark:text-white select-none text-center tracking-wide" 
          style={{ fontFamily: 'Zen Antique Soft, serif' }}
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
              className="w-full pl-12 pr-4 py-3.5 bg-white/70 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all shadow-xl dark:shadow-2xl group-hover:border-slate-300 dark:group-hover:border-white/15"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400/80 h-5.5 w-5.5 group-hover:text-slate-600 dark:group-hover:text-gray-300 transition-colors" />
          </div>
          
          <div className="flex mt-4 space-x-4">
            <button
              onClick={handleSearch}
              className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center space-x-2"
              disabled={isLoading}
            >
              <Sparkles className="w-5 h-5" />
              <span>Search Database</span>
            </button>
            <Link 
              to="/audio-search" 
              className="flex items-center justify-center px-6 bg-white/70 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-gray-500/30"
            >
              <Mic className="h-5 w-5 mr-2 text-blue-400" />
              Voice Search
            </Link>
          </div>
        </div>

        {/* Query Syntax Helper Tips */}
        {!results && !isLoading && !error && (
          <div className="w-full max-w-2xl bg-slate-100/60 dark:bg-gray-950/20 backdrop-blur-sm border border-slate-200 dark:border-white/5 p-5 rounded-2xl text-slate-600 dark:text-gray-400 text-sm mt-8 animate-fadeIn shadow-md dark:shadow-lg">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3 text-base flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-blue-400" />
              Search Syntax Tips
            </h3>
            <ul className="space-y-2.5 list-disc list-inside">
              <li><strong>Phrase Match:</strong> Use double quotes to find exact lyrics, e.g., <code className="text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded bg-slate-200/50 dark:bg-white/5">"perfect love"</code>.</li>
              <li><strong>Boolean logic:</strong> Combine terms using <code className="text-blue-400">AND</code>, <code className="text-blue-400">OR</code>, or <code className="text-blue-400">NOT</code>, e.g., <code className="text-blue-400">happy OR sad</code>.</li>
              <li><strong>Typo Tolerance:</strong> Query terms are automatically spelling-corrected, e.g., searching <code className="text-blue-400">lovve</code> retrieves <code className="text-blue-400">love</code> matches.</li>
            </ul>
          </div>
        )}

        {/* Loading Skeletons State */}
        {isLoading && (
          <div className="w-full max-w-4xl mt-8">
            <div className="flex items-center space-x-3 mb-6 bg-slate-100/60 dark:bg-gray-950/20 backdrop-blur-sm border border-slate-200 dark:border-white/5 p-4 rounded-xl max-w-sm shadow-md">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-lg font-semibold text-blue-500">Searching lyric database...</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(resultsPerPage)].map((_, i) => (
                <SongCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 rounded-xl max-w-xl text-center shadow-md dark:shadow-xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Results */}
        {results && !isLoading && (
          <div className="w-full max-w-6xl mt-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 pb-2 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-xl font-semibold text-blue-500">
                Results for <span className="text-slate-900 dark:text-white">"{results.query}"</span>:
              </h2>
              <span className="text-sm text-slate-500 dark:text-gray-500 mt-1 sm:mt-0">
                Found {results.ranked_results.length} matched songs
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedResults.map(([details], index) => (
                <div 
                  key={index} 
                  className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-4 rounded-2xl shadow-md dark:shadow-xl text-slate-700 dark:text-gray-300 flex flex-col justify-between hover:border-blue-500/20 dark:hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-blue-500/5 min-w-0 overflow-hidden"
                >
                  <div className="mb-2">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1" title={details.name}>
                      {details.name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-1" title={details.artists}>
                      Artists: {details.artists}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-1" title={details.album_name}>
                      Album: {details.album_name}
                    </p>
                  </div>
                  {details.spotify_id && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/40 w-full min-w-0">
                      <iframe
                        src={`https://open.spotify.com/embed/track/${details.spotify_id.replace(/['"]+/g, '').trim()}`}
                        width="100%"
                        height="380"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        className="rounded-xl shadow-inner border-0"
                        style={{ border: 'none', overflow: 'hidden', minWidth: '100%', maxWidth: '100%' }}
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
                  className="px-5 py-2.5 bg-white/70 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                >
                  Previous
                </button>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                  Page {currentPage} of {Math.ceil(results.ranked_results.length / resultsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, Math.ceil(results.ranked_results.length / resultsPerPage))
                    )
                  }
                  disabled={currentPage === Math.ceil(results.ranked_results.length / resultsPerPage)}
                  className="px-5 py-2.5 bg-white/70 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <footer className="mt-16 text-center text-slate-400 dark:text-gray-600 text-sm z-10">
        <p>&copy; 2024 Lyrica. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;