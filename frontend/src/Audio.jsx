import { useState, useEffect } from 'react';
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

function AudioSearch() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@splinetool/viewer@1.9.54/build/spline-viewer.js';
    script.type = 'module';
    document.body.appendChild(script);
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
    <div className="min-h-screen flex flex-col items-center bg-black p-6 pb-24 md:pb-6 md:pl-24 text-gray-100 relative transition-all duration-300">
      <Navbar />
      
      <div className="w-full max-w-4xl flex flex-col items-center">
        <h1 
          className="text-4xl md:text-5xl font-semibold mb-6 text-white text-center" 
          style={{ fontFamily: 'Zen Antique Soft, serif' }}
        >
          Audio Search
        </h1>
        
        {/* Main Recording Panel */}
        {!results && !isLoading && (
          <div className="flex flex-col items-center justify-center w-full max-w-md bg-gray-900/20 border border-gray-800/80 p-8 rounded-2xl shadow-xl mt-4">
            {/* 3D Spline Canvas Container (Responsive sizing) */}
            <div className="w-full aspect-square max-w-[280px] md:max-w-[340px] relative overflow-hidden rounded-full border border-gray-850 shadow-lg bg-black/40">
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
                  <span className="font-semibold text-lg">Recording... Speak clearly</span>
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
                className={`flex-1 py-3.5 px-6 rounded-xl text-lg font-semibold transition-all duration-200 active:scale-[0.98] ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-650/30 animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-650/20'
                }`}
              >
                {isRecording ? 'Stop & Search' : 'Start Recording'}
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3.5 bg-gray-800 border border-gray-700/60 hover:bg-gray-700 text-white rounded-xl font-medium transition-all active:scale-[0.98]"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeletons State */}
        {isLoading && (
          <div className="w-full max-w-4xl mt-6">
            <div className="flex items-center space-x-3 mb-6 bg-gray-900/30 p-4 border border-gray-800/60 rounded-xl max-w-md mx-auto">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-semibold text-blue-500">Transcribing and searching audio...</p>
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
          <div className="mt-6 p-4 bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl w-full max-w-md text-center shadow-lg">
            {error}
            <button 
              onClick={() => { setError(null); setResults(null); }}
              className="block mx-auto mt-3 text-sm text-blue-400 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Display Transcription */}
        {transcription && !isLoading && (
          <div className="mt-6 w-full max-w-2xl bg-gray-900/30 border border-gray-800/80 p-5 rounded-xl shadow-md">
            <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-wider">You Searched:</h2>
            <p className="mt-2 text-xl font-medium text-white italic">"{transcription}"</p>
          </div>
        )}

        {/* Results grid */}
        {results && !isLoading && (
          <div className="w-full max-w-4xl mt-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 pb-2 border-b border-gray-800/60">
              <h2 className="text-xl font-semibold text-blue-500">
                Matched Songs:
              </h2>
              <button 
                onClick={() => { setResults(null); setTranscription(''); }}
                className="text-sm text-blue-400 hover:underline mt-2 sm:mt-0 font-medium"
              >
                Perform another voice search
              </button>
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

export default AudioSearch;