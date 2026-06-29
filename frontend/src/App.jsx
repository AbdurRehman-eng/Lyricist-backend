import React, { useState } from 'react';
import Navbar from './components/navbar';

// Editorial Brutalist Skeleton Loader
const SongCardSkeleton = () => (
  <div className="song-card hairline-all p-4 flex flex-col gap-4 animate-pulse rounded-[4px] bg-[#F7F6F3] min-w-0">
    <div className="flex flex-col gap-2 min-h-[72px]">
      <div className="h-6 bg-[#E2E1DC] rounded-sm w-3/4"></div>
      <div className="h-4 bg-[#E2E1DC] rounded-sm w-1/2"></div>
      <div className="h-4 bg-[#E2E1DC] rounded-sm w-2/3"></div>
    </div>
    <div className="w-full aspect-square bg-[#E2E1DC] rounded-[2px] border border-[#E2E1DC] flex items-center justify-center">
      <span className="material-symbols-outlined text-[32px] text-[#BBBBB7] animate-spin">sync</span>
    </div>
    <div className="h-4 bg-[#E2E1DC] rounded-sm w-1/3 pt-2"></div>
  </div>
);

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const resultsPerPage = 6;

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults(null);
    setCurrentPage(1);
    setHasSearched(true);
    
    try {
      const response = await fetch(`http://localhost:5000/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setIsLoading(false);
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'No results found.');
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

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleReset = () => {
    setQuery('');
    setResults(null);
    setError(null);
    setHasSearched(false);
    setCurrentPage(1);
  };

  const paginatedResults = results
    ? results.ranked_results.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage)
    : [];

  const totalPages = results ? Math.ceil(results.ranked_results.length / resultsPerPage) : 0;

  const suggestions = [
    "i will always love you",
    "hotel california",
    "blinding lights",
    "sad indie heartbreak"
  ];

  return (
    <div className="min-h-screen flex flex-col font-body-md text-primary antialiased bg-[#F7F6F3]">
      <Navbar />

      {!hasSearched && !isLoading && !error ? (
        /* SEARCH HOME STATE */
        <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop pt-[52px] pb-stack-lg relative overflow-hidden">
          {/* Subtle Grid Overlay for structure */}
          <div className="absolute inset-0 max-w-container-max mx-auto hairline-grid opacity-20 pointer-events-none z-0 hidden md:block"></div>
          
          <div className="max-w-[800px] w-full flex flex-col items-center text-center z-10 relative">
            <span className="font-label-caps text-[11px] text-secondary tracking-[0.1em] uppercase mb-stack-md">
              LYRIC SEARCH ENGINE
            </span>
            <h1 className="font-display-lg-mobile md:font-display-lg text-primary mb-stack-lg max-w-[600px] mx-auto">
              Find the song you <br />
              <span className="italic text-surface-tint">can't get out of your head</span>
            </h1>
            
            <div className="w-full max-w-[560px] relative group mb-stack-md">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-surface-container-lowest border border-[#E2E1DC] focus:border-primary focus:ring-0 rounded h-[56px] pl-6 pr-14 font-body-lg text-primary placeholder-[#BBBBB7] transition-colors duration-200 outline-none shadow-none"
                placeholder="Search by lyrics, artist, or song title..."
              />
              <button
                onClick={() => handleSearch()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-high rounded transition-colors duration-100"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            {/* Suggestion Pills */}
            <div className="flex flex-wrap justify-center gap-2 max-w-[600px] mt-4">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="border border-[#E2E1DC] bg-transparent hover:bg-[#F0EFEA] hover:border-primary text-secondary hover:text-primary px-4 py-1.5 rounded-sm font-headline-md text-sm italic transition-colors duration-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </main>
      ) : (
        /* SEARCH RESULTS GRID STATE */
        <main className="flex-grow pt-[52px] pb-stack-lg flex justify-center w-full">
          <div className="w-full max-w-container-max relative grid-bg px-margin-mobile md:px-0">
            <div className="w-full md:grid md:grid-cols-12 min-h-full">
              <div className="md:col-span-12 md:pl-[8.333%] md:pr-[8.333%] pt-16">
                
                {/* Search Bar / Input Area */}
                <div className="w-full max-w-[640px] mb-8 flex items-center gap-3">
                  <div className="relative flex items-center flex-grow">
                    <span className="material-symbols-outlined absolute left-3 text-[#BBBBB7]">search</span>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="search-input w-full bg-transparent hairline-all py-3 pl-10 pr-10 font-body-md text-primary placeholder-[#BBBBB7] focus:border-primary"
                      placeholder="Search lyrics, artists, albums..."
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 text-secondary hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleSearch()}
                    className="px-6 h-[46px] border border-primary bg-transparent text-primary hover:bg-primary hover:text-white transition-all duration-100 font-label-caps text-label-caps rounded-sm uppercase tracking-wider flex items-center justify-center"
                  >
                    Search
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-3 h-[46px] hairline-all hover:bg-[#F0EFEA] text-secondary hover:text-primary transition-all duration-100 rounded-sm flex items-center justify-center"
                    title="Clear Search"
                  >
                    <span className="material-symbols-outlined">restart_alt</span>
                  </button>
                </div>

                {/* Loading Skeletons */}
                {isLoading && (
                  <div>
                    <div className="flex justify-between items-end pb-4 hairline-b mb-6">
                      <h1 className="font-headline-md text-[20px] text-primary">Searching lyric database...</h1>
                      <span className="font-metadata text-metadata text-secondary">Please wait</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(resultsPerPage)].map((_, i) => (
                        <SongCardSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                  <div>
                    <div className="flex justify-between items-end pb-4 hairline-b mb-6">
                      <h1 className="font-headline-md text-[20px] text-primary">Search Error</h1>
                      <span className="font-metadata text-metadata text-secondary">0 results found</span>
                    </div>
                    <div className="p-6 border border-error bg-[#ffdad6] text-error rounded-sm text-center">
                      <p className="font-body-md text-body-md font-semibold mb-2">{error}</p>
                      <button
                        onClick={handleReset}
                        className="mt-2 text-sm underline hover:text-primary transition-colors"
                      >
                        Go back to home page
                      </button>
                    </div>
                  </div>
                )}

                {/* Results Card Grid */}
                {results && !isLoading && (
                  <div>
                    <div className="flex justify-between items-end pb-4 hairline-b mb-6">
                      <h1 className="font-headline-md text-[20px] text-primary">
                        Showing results for '{results.query}'
                      </h1>
                      <span className="font-metadata text-metadata text-secondary">
                        {results.ranked_results.length} results found
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {paginatedResults.map(([details], index) => {
                        const cleanSpotifyId = details.spotify_id
                          ? details.spotify_id.replace(/['"]+/g, '').trim()
                          : '';

                        return (
                          <div
                            key={index}
                            className="song-card hairline-all p-4 flex flex-col gap-4 transition-colors duration-100 group rounded-[4px] bg-[#F7F6F3]"
                          >
                            <div className="flex flex-col gap-1 min-h-[72px]">
                              <h3
                                className="font-headline-md text-[20px] text-primary leading-tight truncate"
                                title={details.name}
                              >
                                {details.name}
                              </h3>
                              <p className="font-metadata text-metadata text-secondary truncate">
                                Artists: {details.artists}
                              </p>
                              <p className="font-metadata text-metadata text-secondary truncate">
                                Album: {details.album_name}
                              </p>
                            </div>

                            {cleanSpotifyId ? (
                              <div className="w-full bg-[#E2E1DC] relative overflow-hidden rounded-[2px] border border-[#E2E1DC]">
                                <iframe
                                  src={`https://open.spotify.com/embed/track/${cleanSpotifyId}`}
                                  width="100%"
                                  height="352"
                                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                  className="border-0 w-full"
                                  style={{ border: 'none', overflow: 'hidden', minWidth: '100%', maxWidth: '100%' }}
                                  loading="lazy"
                                ></iframe>
                              </div>
                            ) : (
                              <div className="w-full h-[354px] bg-[#E2E1DC] relative overflow-hidden rounded-[2px] border border-[#E2E1DC] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[48px] text-secondary">music_note</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                              {cleanSpotifyId ? (
                                <a
                                  href={`https://open.spotify.com/track/${cleanSpotifyId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 font-metadata text-[14px] text-primary hover:text-secondary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                  Open on Spotify
                                </a>
                              ) : (
                                <span className="font-metadata text-[14px] text-secondary">No Spotify Link</span>
                              )}
                              <div className="flex items-center gap-3">
                                {cleanSpotifyId && (
                                  <a
                                    href={`https://open.spotify.com/track/${cleanSpotifyId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-[36px] h-[36px] rounded-full border border-[#111110] flex items-center justify-center text-primary hover:bg-[#111110] hover:text-[#F7F6F3] transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                      play_arrow
                                    </span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-10 flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="w-[28px] h-[28px] hairline-all flex items-center justify-center text-secondary hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        </button>
                        
                        {(() => {
                          const buttons = [];
                          const maxVisiblePages = 5;
                          if (totalPages <= maxVisiblePages) {
                            for (let i = 1; i <= totalPages; i++) buttons.push(i);
                          } else {
                            buttons.push(1);
                            let start = Math.max(2, currentPage - 1);
                            let end = Math.min(totalPages - 1, currentPage + 1);
                            if (currentPage <= 3) {
                              end = 4;
                            } else if (currentPage >= totalPages - 2) {
                              start = totalPages - 3;
                            }
                            if (start > 2) buttons.push('ellipsis1');
                            for (let i = start; i <= end; i++) buttons.push(i);
                            if (end < totalPages - 1) buttons.push('ellipsis2');
                            buttons.push(totalPages);
                          }

                          return buttons.map((btn, i) => {
                            if (btn === 'ellipsis1' || btn === 'ellipsis2') {
                              return <span key={`ellipsis-${i}`} className="text-secondary px-1">...</span>;
                            }
                            const isCurrent = currentPage === btn;
                            return (
                              <button
                                key={btn}
                                onClick={() => setCurrentPage(btn)}
                                className={`w-[28px] h-[28px] flex items-center justify-center font-metadata text-metadata transition-colors ${
                                  isCurrent
                                    ? 'border-ink bg-primary text-surface font-semibold'
                                    : 'hairline-all text-secondary hover:text-primary hover:border-primary'
                                }`}
                              >
                                {btn}
                              </button>
                            );
                          });
                        })()}

                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="w-[28px] h-[28px] hairline-all flex items-center justify-center text-secondary hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="w-full py-stack-md px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto bg-surface border-t border-[#E2E1DC] mt-auto">
        <span className="font-metadata text-metadata text-secondary mb-4 md:mb-0">
          © 2024 Lyricist Editorial. All rights reserved.
        </span>
        <div className="flex space-x-6">
          <a className="font-metadata text-metadata text-secondary hover:underline transition-all" href="#">Privacy</a>
          <a className="font-metadata text-metadata text-secondary hover:underline transition-all" href="#">Terms</a>
          <a className="font-metadata text-metadata text-secondary hover:underline transition-all" href="#">Archive</a>
        </div>
      </footer>
    </div>
  );
}

export default App;