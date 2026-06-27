import { useState, useEffect } from 'react';
import { Mic, ArrowLeft, Headphones, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import Navbar from './components/navbar';

// Skeleton Loader Component for Song Cards
const SongCardSkeleton = () => (
  <div className="bg-gray-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg animate-pulse flex flex-col justify-between h-[510px] min-w-0 overflow-hidden">
    <div>
      <div className="h-6 bg-gray-800/60 rounded-md w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-800/40 rounded-md w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-800/40 rounded-md w-2/3 mb-4"></div>
    </div>
    <div className="h-[380px] bg-gray-800/20 rounded-xl w-full flex items-center justify-center border border-white/5">
      <div className="w-10 h-10 rounded-full bg-gray-800/30 flex items-center justify-center">
        <div className="w-4 h-4 bg-gray-800/50 rounded-sm"></div>
      </div>
    </div>
  </div>
);

function AudioSearch() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;

  // Append Spline Viewer Script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@splinetool/viewer@1.9.54/build/spline-viewer.js';
    script.type = 'module';
    document.body.appendChild(script);
  }, []);

  // Hides the "Built with Spline" watermark logo from shadow DOM
  useEffect(() => {
    const injectStyle = setInterval(() => {
      const viewer = document.querySelector('spline-viewer');
      if (viewer && viewer.shadowRoot) {
        // Appends a custom style tag inside the shadow root if not already present
        if (!viewer.shadowRoot.querySelector('#hide-watermark-style')) {
          const style = document.createElement('style');
          style.id = 'hide-watermark-style';
          style.textContent = `
            #logo, .logo, a[href*="spline.design"], #logo-container, [class*="watermark"] { 
              display: none !important; 
              opacity: 0 !important; 
              visibility: hidden !important; 
              pointer-events: none !important; 
            }
          `;
          viewer.shadowRoot.appendChild(style);
        }
      }
    }, 100);
    return () => clearInterval(injectStyle);
  }, []);

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
            setError(data.error);
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

  const paginatedResults = results
    ? results.ranked_results.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage)
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center bg-black p-6 pb-28 md:pb-6 md:pl-28 text-gray-100 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] aspect-square rounded-full bg-blue-950/15 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50vw] aspect-square rounded-full bg-indigo-950/15 blur-[120px]"></div>
      </div>

      <Navbar />
      
      <div className="w-full max-w-4xl flex flex-col items-center z-10">
        <h1 
          className="text-4xl md:text-5xl font-semibold mb-6 text-white text-center" 
          style={{ fontFamily: 'Zen Antique Soft, serif' }}
        >
          Audio Search
        </h1>
        
        {/* Main Recording Panel */}
        {!results && !isLoading && (
          <div className="flex flex-col items-center justify-center w-full max-w-md bg-gray-905/20 backdrop-blur-md border border-white/5 p-8 rounded-2xl shadow-2xl mt-4">
            
            {/* 3D Spline Canvas Container (Watermark hidden, border removed) */}
            <div className="w-full aspect-square max-w-[280px] md:max-w-[340px] relative overflow-hidden rounded-full">
              <spline-viewer 
                loading-anim-type="spinner-small-light" 
                interaction-prompt="none" 
                url="https://prod.spline.design/ZVPXbznt8G-AWbk9/scene.splinecode" 
                className="absolute inset-0 w-full h-full object-cover scale-110"
              ></spline-viewer>
            </div>

            {/* Status indicators */}
            <div className="mt-6 text-center">
              {isRecording ? (
                <div className="flex items-center justify-center space-x-2 text-red-500 animate-pulse">
                  <span className="w-3 h-3 rounded-full bg-red-500 shadow-glow shadow-red-500/50"></span>
                  <span className="font-semibold text-lg">Recording... Speak lyrics</span>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Click below and speak or sing lyrics to search
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 w-full mt-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 py-3.5 px-6 rounded-xl text-lg font-semibold transition-all duration-250 active:scale-[0.98] ${
                  isRecording 
                    ? 'bg-red-650 hover:bg-red-750 text-white shadow-lg shadow-red-650/30 animate-pulse ring-4 ring-red-500/20' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-650/20'
                }`}
              >
                {isRecording ? 'Stop & Search' : 'Start Recording'}
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3.5 bg-gray-900/40 border border-white/10 hover:bg-gray-800 text-white rounded-xl font-medium transition-all active:scale-[0.98] flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeletons State */}
        {isLoading && (
          <div className="w-full max-w-4xl mt-6">
            <div className="flex items-center space-x-3 mb-6 bg-gray-955/20 backdrop-blur-sm border border-white/5 p-4 rounded-xl max-w-sm mx-auto shadow-lg">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-semibold text-blue-500">Transcribing & searching audio...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[...Array(resultsPerPage)].map((_, i) => (
                <SongCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Errors display */}
        {error && (
          <div className="mt-6 p-4 bg-red-955/20 backdrop-blur-sm border border-red-900/30 text-red-300 rounded-xl w-full max-w-md text-center shadow-2xl flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => { setError(null); setResults(null); }}
              className="mt-3 text-sm text-blue-400 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Display Transcription */}
        {transcription && !isLoading && (
          <div className="mt-6 w-full max-w-2xl bg-gray-900/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl flex items-center space-x-3">
            <Headphones className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h2 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Voice Query:</h2>
              <p className="text-xl font-medium text-white italic">"{transcription}"</p>
            </div>
          </div>
        )}

        {/* Results grid */}
        {results && !isLoading && (
          <div className="w-full max-w-4xl mt-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 pb-2 border-b border-white/5">
              <h2 className="text-xl font-semibold text-blue-500">
                Matched Songs:
              </h2>
              <button 
                onClick={() => { setResults(null); setTranscription(''); }}
                className="text-sm text-blue-400 hover:underline mt-2 sm:mt-0 font-medium flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-1 text-blue-400" />
                Perform another search
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedResults.map(([details], index) => (
                <div 
                  key={index} 
                  className="bg-gray-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-xl text-gray-300 flex flex-col justify-between hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 min-w-0 overflow-hidden"
                >
                  <div className="mb-2">
                    <h4 className="text-xl font-bold text-white mb-2 line-clamp-1" title={details.name}>
                      {details.name}
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-1" title={details.artists}>
                      Artists: {details.artists}
                    </p>
                    <p className="text-sm text-gray-400 line-clamp-1 animate-fadeIn" title={details.album_name}>
                      Album: {details.album_name}
                    </p>
                  </div>
                  {details.spotify_id && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/5 bg-black/40 w-full min-w-0">
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
                  className="px-5 py-2.5 bg-gray-900/40 border border-white/10 text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
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
                  className="px-5 py-2.5 bg-gray-900/40 border border-white/10 text-white rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <footer className="mt-16 text-center text-gray-600 text-sm z-10">
        <p>&copy; 2024 Lyrica. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AudioSearch;