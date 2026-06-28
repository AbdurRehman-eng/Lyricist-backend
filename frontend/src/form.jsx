import { useState, useEffect } from 'react';
import { Music, Link as LinkIcon, Users, Disc, FileText, CheckCircle } from 'lucide-react';
import Navbar from './components/navbar';

export default function AddSongForm() {
  const [formData, setFormData] = useState({
    name: '',
    spotifyLink: '',
    artists: '',
    album: '',
    lyrics: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const extractSpotifyID = (url) => {
    const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const spotifyID = extractSpotifyID(formData.spotifyLink);

    if (!spotifyID) {
      setError('Invalid Spotify link. Please provide a valid track link (e.g., https://open.spotify.com/track/...).');
      setIsLoading(false);
      return;
    }

    const payload = {
      id: spotifyID,
      name: formData.name,
      album_name: formData.album,
      artists: formData.artists,
      lyrics: formData.lyrics,
      danceability: 0.63,
      energy: 0.6,
      key: 8,
      loudness: -6.3,
      mode: 1,
      speechiness: 0.04,
      acousticness: 0.27,
      instrumentalness: 0.0,
      liveness: 0.12,
      valence: 0.35,
      tempo: 120.0,
      duration_ms: 198000
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/add_document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to add song. Please check the backend connection and try again.');
      }

      setSuccess(true);
      setFormData({ name: '', spotifyLink: '', artists: '', album: '', lyrics: '' });
    } catch (err) {
      setError(err.message || 'An error occurred while submitting the form.');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically dismiss the success toast after 4 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-50 dark:bg-black p-6 pb-28 md:pb-6 md:pl-28 text-slate-800 dark:text-gray-100 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] aspect-square rounded-full bg-blue-200/40 dark:bg-blue-950/15 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50vw] aspect-square rounded-full bg-indigo-200/40 dark:bg-indigo-950/15 blur-[120px]"></div>
      </div>

      <Navbar />
      
      <div className="w-full max-w-2xl flex flex-col justify-center flex-grow z-10">
        <h1 
          className="text-4xl font-semibold mb-6 text-slate-900 dark:text-white text-center mt-4" 
          style={{ fontFamily: 'Zen Antique Soft, serif' }}
        >
          Add New Song
        </h1>

        <form 
          onSubmit={handleSubmit} 
          className="w-full bg-white/70 dark:bg-gray-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-6 sm:p-8 rounded-2xl shadow-md dark:shadow-2xl transition-all"
        >
          <div className="mb-4">
            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 flex items-center">
              <Music className="w-4 h-4 mr-2 text-blue-500" />
              Song Title
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="e.g. Bohemian Rhapsody"
              className="w-full p-3 bg-slate-50/50 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 placeholder-slate-400 dark:placeholder-gray-500 transition-all disabled:opacity-50"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="spotifyLink" className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 flex items-center">
              <LinkIcon className="w-4 h-4 mr-2 text-blue-500" />
              Spotify Link
            </label>
            <input
              type="url"
              id="spotifyLink"
              name="spotifyLink"
              value={formData.spotifyLink}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="e.g. https://open.spotify.com/track/..."
              className="w-full p-3 bg-slate-50/50 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 placeholder-slate-400 dark:placeholder-gray-500 transition-all disabled:opacity-50"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="artists" className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              Artists (separated by commas)
            </label>
            <input
              type="text"
              id="artists"
              name="artists"
              value={formData.artists}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="e.g. Queen"
              className="w-full p-3 bg-slate-50/50 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 placeholder-slate-400 dark:placeholder-gray-500 transition-all disabled:opacity-50"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="album" className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 flex items-center">
              <Disc className="w-4 h-4 mr-2 text-blue-500" />
              Album Name
            </label>
            <input
              type="text"
              id="album"
              name="album"
              value={formData.album}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="e.g. A Night at the Opera"
              className="w-full p-3 bg-slate-50/50 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 placeholder-slate-400 dark:placeholder-gray-500 transition-all disabled:opacity-50"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="lyrics" className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Lyrics
            </label>
            <textarea
              id="lyrics"
              name="lyrics"
              value={formData.lyrics}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Paste song lyrics here..."
              className="w-full p-3 bg-slate-50/50 dark:bg-gray-900/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 placeholder-slate-400 dark:placeholder-gray-500 transition-all disabled:opacity-50"
              rows="4"
            />
          </div>

          <button
            type="submit"
            className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Indexing song...</span>
              </>
            ) : (
              <span>Add Song to Index</span>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-xl text-center shadow-md dark:shadow-lg">
            {error}
          </div>
        )}
      </div>

      {/* Floating Modern Toast Notification */}
      {success && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-4 bg-green-600 border border-green-500/30 text-white rounded-xl shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="font-semibold text-base">Song successfully added and indexed!</span>
        </div>
      )}
      
      <footer className="mt-16 text-center text-slate-400 dark:text-gray-600 text-sm">
        <p>&copy; 2024 Lyrica. All rights reserved.</p>
      </footer>
    </div>
  );
}
