import { useState, useEffect } from 'react';
import Navbar from './components/navbar';

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

// Spotify Embed with Skeleton Loader
const SpotifyEmbed = ({ trackId }) => {
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  return (
    <div className="w-full h-[354px] bg-[#E2E1DC] relative overflow-hidden rounded-[2px] border border-[#E2E1DC]">
      {isIframeLoading && (
        <div className="absolute inset-0 flex flex-col p-4 bg-[#F1EDEC] animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#E2E1DC] rounded-[2px]"></div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="w-2/3 h-4 bg-[#E2E1DC] rounded"></div>
              <div className="w-1/3 h-3 bg-[#E2E1DC] rounded"></div>
            </div>
            <div className="w-6 h-6 bg-[#E2E1DC] rounded-full"></div>
          </div>
          <div className="flex-1 bg-[#E2E1DC] rounded-[2px] flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-[#BBBBB7] opacity-40">music_note</span>
          </div>
          <div className="mt-4 w-full h-1 bg-[#E2E1DC] rounded-full"></div>
        </div>
      )}
      <iframe
        src={`https://open.spotify.com/embed/track/${trackId}`}
        width="100%"
        height="352"
        scrolling="no"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className={`border-0 w-full transition-opacity duration-300 ${isIframeLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ border: 'none', overflow: 'hidden', minWidth: '100%', maxWidth: '100%' }}
        loading="lazy"
        onLoad={() => setIsIframeLoading(false)}
      ></iframe>
    </div>
  );
};

// Artist Parser Helper
const formatArtists = (artists) => {
  if (!artists) return '';
  if (Array.isArray(artists)) {
    return artists.join(', ');
  }
  if (typeof artists === 'string') {
    const trimmed = artists.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const matches = [...trimmed.matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
        if (matches.length > 0) {
          return matches.join(', ');
        }
      } catch (e) {}
      return trimmed
        .replace(/^\[|\]$/g, '')
        .replace(/['"]/g, '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .join(', ');
    }
    return artists;
  }
  return String(artists);
};

export default function AudioSearch() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;

  // Real-time Waveform Animation Heights (28 bars)
  const [barHeights, setBarHeights] = useState(Array(28).fill(6));

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setBarHeights(
          Array(28)
            .fill(0)
            .map(() => Math.floor(Math.random() * 32) + 6)
        );
      }, 80);
    } else {
      setBarHeights(Array(28).fill(6));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      setMediaRecorder(recorder);

      const audioChunks = [];
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');

        setIsLoading(true);
        setError(null);
        setResults(null);
        setTranscription('');
        
        try {
          const response = await fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          setIsLoading(false);
          if (response.ok) {
            setTranscription(data.transcription);
            setResults(data);
          } else {
            console.error('Error transcribing audio:', data.error);
            setError(data.error || 'Failed to index sound.');
          }
        } catch (err) {
          console.error('Network error during transcription:', err);
          setIsLoading(false);
          setError('Could not connect to the transcription server.');
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied. Please enable permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleReset = () => {
    setIsRecording(false);
    setTranscription('');
    setResults(null);
    setError(null);
    setCurrentPage(1);
  };

  const paginatedResults = results
    ? results.ranked_results.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage)
    : [];

  const totalPages = results ? Math.ceil(results.ranked_results.length / resultsPerPage) : 0;

  return (
    <div className="min-h-screen flex flex-col font-body-md text-primary antialiased bg-[#F7F6F3]">
      <Navbar />

      <main className="flex-grow pt-[52px] pb-stack-lg flex justify-center w-full">
        <div className="w-full max-w-container-max relative grid-bg px-margin-mobile md:px-0">
          <div className="w-full md:grid md:grid-cols-12 min-h-full">
            <div className="md:col-span-12 md:pl-[8.333%] md:pr-[8.333%] pt-16">
              
              {!results && !isLoading && !error ? (
                /* RECORDING INITIAL PANEL STATE */
                <div className="w-full max-w-[520px] mx-auto text-center flex flex-col items-center gap-stack-lg pt-12">
                  <header className="flex flex-col gap-unit">
                    <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-unit">
                      AUDIO QUERY
                    </p>
                    <h1 className="font-display-lg-mobile md:font-display-lg text-primary tracking-tight">
                      Hum it. <span className="italic font-light">We'll name it.</span>
                    </h1>
                    <p className="font-body-md text-[15px] text-secondary font-light max-w-[400px] mx-auto">
                      Sing, hum, or describe a melody to query our neural lyric database.
                    </p>
                  </header>

                  {/* Visualizer mic trigger */}
                  <div className={`w-full flex items-center justify-center py-8 relative ${isRecording ? 'listening-active' : ''}`}>
                    <div className="relative w-64 h-64 flex items-center justify-center">
                      {/* Outer rippling borders */}
                      <div className="absolute inset-0 rounded-full border border-primary opacity-20 circle-ripple transition-all duration-300"></div>
                      <div className="absolute inset-8 rounded-full border border-primary opacity-40 circle-ripple transition-all duration-300"></div>
                      <div className="absolute inset-16 rounded-full border border-primary opacity-60 circle-ripple transition-all duration-300"></div>
                      
                      {/* Inner breathing dot trigger */}
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-20 h-20 rounded-full bg-primary flex items-center justify-center relative cursor-pointer hover:scale-105 transition-transform duration-200 outline-none focus:outline-none ${isRecording ? 'bg-[#ba1a1a]' : ''}`}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                      >
                        <span className="material-symbols-outlined text-[36px] text-surface-bright flex items-center justify-center">
                          {isRecording ? 'square' : 'mic'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Waveform Visualization Bars */}
                  <div className={`flex items-end justify-center gap-[3px] h-[40px] mb-4 w-full transition-opacity duration-200 ${isRecording ? 'opacity-100 listening-active' : 'opacity-30'}`}>
                    {barHeights.map((h, i) => (
                      <div
                        key={i}
                        className="waveform-bar"
                        style={{ height: `${h}px` }}
                      ></div>
                    ))}
                  </div>

                  {/* Text action button */}
                  <div>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className="px-6 h-[46px] border border-primary bg-transparent text-primary hover:bg-primary hover:text-white transition-all duration-100 font-label-caps text-label-caps rounded-sm uppercase tracking-wider flex items-center justify-center"
                    >
                      {isRecording ? 'Stop & Search' : 'Start Listening'}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Loading State */}
              {isLoading && (
                <div>
                  <div className="flex justify-between items-end pb-4 hairline-b mb-6">
                    <h1 className="font-headline-md text-[20px] text-primary">Transcribing & indexing audio...</h1>
                    <span className="font-metadata text-metadata text-secondary">Neural match in progress</span>
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
                <div className="w-full max-w-[520px] mx-auto text-center flex flex-col items-center gap-6 pt-12">
                  <header className="flex flex-col gap-unit">
                    <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase mb-unit">
                      SYSTEM ERROR
                    </p>
                    <h1 className="font-display-lg-mobile md:font-display-lg text-primary tracking-tight">
                      Unable to <span className="italic font-light">transcribe</span>.
                    </h1>
                  </header>
                  <div className="w-full p-6 border border-error bg-[#ffdad6] text-error rounded-sm text-center">
                    <p className="font-body-md text-body-md font-semibold mb-2">{error}</p>
                    <button
                      onClick={handleReset}
                      className="mt-2 text-sm underline hover:text-primary transition-colors font-metadata"
                    >
                      Reset and Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Transcription Results card grid */}
              {results && !isLoading && (
                <div>
                  <header className="flex flex-col gap-1 pb-4 hairline-b mb-8">
                    <p className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
                      VOICE TRANSCRIBED
                    </p>
                    <h1 className="font-display-lg-mobile md:font-headline-md text-primary italic font-light tracking-tight max-w-[800px] leading-tight">
                      "{transcription || "Unknown Humming"}"
                    </h1>
                    <div className="flex justify-between items-baseline mt-4 w-full">
                      <span className="font-metadata text-metadata text-secondary">
                        Found {results.ranked_results.length} matches
                      </span>
                      <button
                        onClick={handleReset}
                        className="font-metadata text-[14px] text-primary hover:text-secondary underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                        New Audio Search
                      </button>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                              Artists: {formatArtists(details.artists)}
                            </p>
                            <p className="font-metadata text-metadata text-secondary truncate">
                              Album: {details.album_name}
                            </p>
                          </div>

                          {cleanSpotifyId ? (
                            <SpotifyEmbed trackId={cleanSpotifyId} />
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