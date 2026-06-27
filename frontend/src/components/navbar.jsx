import { Link } from 'react-router-dom';
import { Home, Mic, Info, FileText } from 'lucide-react';

const isActive = (path) => {
  return window.location.pathname === path 
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
    : 'text-gray-400 hover:text-white hover:bg-gray-800/80';
};

const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 w-full flex flex-row items-center justify-around bg-gray-900/90 backdrop-blur-md border-t border-gray-800/60 z-[9999] py-0 px-4 md:top-0 md:bottom-auto md:left-0 md:right-auto md:h-full md:w-16 md:flex-col md:justify-center md:space-y-8 md:py-8 md:border-t-0 md:border-r md:rounded-r-xl transition-all duration-300">
      <Link 
        to="/main" 
        className={`p-3 rounded-xl transition-all duration-200 ${isActive('/main')}`}
        title="Home Search"
      >
        <Home className="h-6 w-6" />
      </Link>
      <Link 
        to="/audio-search" 
        className={`p-3 rounded-xl transition-all duration-200 ${isActive('/audio-search')}`}
        title="Audio Search"
      >
        <Mic className="h-6 w-6" />
      </Link>
      <Link 
        to="/form" 
        className={`p-3 rounded-xl transition-all duration-200 ${isActive('/form')}`}
        title="Add Song"
      >
        <FileText className="h-6 w-6" />
      </Link>
      <Link 
        to="/about" 
        className={`p-3 rounded-xl transition-all duration-200 ${isActive('/about')}`}
        title="About Lyrica"
      >
        <Info className="h-6 w-6" />
      </Link>
    </nav>
  );
};

export default Navbar;
