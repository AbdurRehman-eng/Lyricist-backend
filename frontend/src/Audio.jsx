import { useState, useEffect, useRef } from 'react';
import { Mic, ArrowLeft, Headphones, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { Application } from '@splinetool/runtime';
import Navbar from './components/navbar';
import { GlassButton } from './components/GlassButton';

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

function AudioSearch() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;

  const canvasRef = useRef(null);
  const [splineLoaded, setSplineLoaded] = useState(false);

  // Load Spline Scene Programmatically using @splinetool/runtime
  useEffect(() => {
    let splineApp = null;
    
    if (canvasRef.current) {
      splineApp = new Application(canvasRef.current);
      splineApp.load('https://prod.spline.design/ZVPXbznt8G-AWbk9/scene.splinecode')
        .then(() => {
          // Force the background of the loaded scene to be transparent
          splineApp.setBackgroundColor('transparent');
          setSplineLoaded(true);
        })
        .catch((err) => {
          console.error('Error loading Spline scene:', err);
        });
    }

    return () => {
      if (splineApp) {
        splineApp.dispose();
      }
    };
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
    <div className="min-h-screen flex flex-col items-center bg-slate-50 dark:bg-black p-6 pb-28 md:pb-6 md:pl-28 text-slate-800 dark:text-gray-100 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] aspect-square rounded-full bg-blue-200/40 dark:bg-blue-950/15 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50vw] aspect-square rounded-full bg-indigo-200/40 dark:bg-indigo-950/15 blur-[120px]"></div>
      </div>

      <Navbar />
      
      <div className="w-full max-w-6xl flex flex-col items-center z-10">
        <h1 
          className="text-4xl md:text-5xl font-semibold mb-6 text-slate-900 dark:text-white text-center" 
          style={{ fontFamily: 'Zen Antique Soft, serif' }}
        >
          Audio Search
        </h1>
        
        {/* Main Recording Panel */}
        {!results && !isLoading && (
          <div className="flex flex-col items-center justify-center w-full max-w-md bg-white/70 dark:bg-gray-900/20 backdrop-blur-md border border-slate-200 dark:border-white/5 p-8 rounded-2xl shadow-md dark:shadow-2xl mt-4">
            
            {/* 3D Spline Canvas Container */}
            <div className="w-full aspect-square max-w-[280px] md:max-w-[340px] relative overflow-hidden rounded-full flex items-center justify-center bg-transparent">
              {!splineLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full object-cover scale-110"
                style={{ background: 'transparent' }}
              />
            </div>

            {/* Status indicators */}
            <div className="mt-6 text-center">
              {isRecording ? (
                <div className="flex items-center justify-center space-x-2 text-red-500 animate-pulse">
                  <span className="w-3 h-3 rounded-full bg-red-500 shadow-glow shadow-red-500/50"></span>
                  <span className="font-semibold text-lg">Recording... Speak lyrics</span>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Click below and speak or sing lyrics to search
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 w-full mt-6">
              <GlassButton
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 text-lg font-semibold text-white ${isRecording ? 'animate-pulse' : ''}`}
                glassColor={isRecording ? 'rgba(220, 38, 38, 0.85)' : 'rgba(37, 99, 235, 0.85)'}
              >
                {isRecording ? 'Stop & Search' : 'Start Recording'}
              </GlassButton>
              <GlassButton
                onClick={() => window.history.back()}
                className="text-slate-800 dark:text-white font-medium"
                glassColor="rgba(255, 255, 255, 0.15)"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </GlassButton>
            </div>
          </div>
        )}

        {/* Loading Skeletons State */}
        {isLoading && (
          <div className="w-full max-w-4xl mt-6">
            <div className="flex items-center space-x-3 mb-6 bg-slate-100/60 dark:bg-gray-950/20 backdrop-blur-sm border border-slate-200 dark:border-white/5 p-4 rounded-xl max-w-sm mx-auto shadow-md">
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
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 backdrop-blur-sm border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 rounded-xl w-full max-w-md text-center shadow-md dark:shadow-2xl flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => { setError(null); setResults(null); }}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Display Transcription */}
        {transcription && !isLoading && (
          <div className="mt-6 w-full max-w-2xl bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-md dark:shadow-xl flex items-center space-x-3">
            <Headphones className="w-6 h-6 text-blue-500 dark:text-blue-400 shrink-0" />
            <div>
              <h2 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Voice Query:</h2>
              <p className="text-xl font-medium text-slate-900 dark:text-white italic">"{transcription}"</p>
            </div>
          </div>
        )}

        {/* Results grid */}
        {results && !isLoading && (
          <div className="w-full max-w-6xl mt-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 pb-2 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-xl font-semibold text-blue-500">
                Matched Songs:
              </h2>
              <button 
                onClick={() => { setResults(null); setTranscription(''); }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 sm:mt-0 font-medium flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-1 text-blue-500 dark:text-blue-400" />
                Perform another search
              </button>
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

export default AudioSearch;