import { Link } from 'react-router-dom';
import { Home, Mic, Info, FileText } from 'lucide-react';

const isActive = (path) => {
  return window.location.pathname === path 
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110' 
    : 'text-gray-400 hover:text-white hover:bg-white/5';
};

const Navbar = () => {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 flex flex-row items-center justify-around bg-gray-950/80 backdrop-blur-xl border border-white/10 shadow-2xl z-[9999] px-4 rounded-full md:fixed md:left-6 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:right-auto md:-translate-x-0 md:w-16 md:h-auto md:max-w-none md:flex-col md:justify-center md:space-y-6 md:space-x-0 md:py-6 md:px-2 md:rounded-2xl transition-all duration-300">
      <Link 
        to="/main" 
        className={`p-3 rounded-full transition-all duration-300 ${isActive('/main')}`}
        title="Home Search"
      >
        <Home className="h-5.5 w-5.5" />
      </Link>
      <Link 
        to="/audio-search" 
        className={`p-3 rounded-full transition-all duration-300 ${isActive('/audio-search')}`}
        title="Audio Search"
      >
        <Mic className="h-5.5 w-5.5" />
      </Link>
      <Link 
        to="/form" 
        className={`p-3 rounded-full transition-all duration-300 ${isActive('/form')}`}
        title="Add Song"
      >
        <FileText className="h-5.5 w-5.5" />
      </Link>
      <Link 
        to="/about" 
        className={`p-3 rounded-full transition-all duration-300 ${isActive('/about')}`}
        title="About Lyrica"
      >
        <Info className="h-5.5 w-5.5" />
      </Link>
    </nav>
  );
};

export default Navbar;
