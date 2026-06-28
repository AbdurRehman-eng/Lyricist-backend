import { Link, useLocation } from 'react-router-dom';
import { Home, Mic, Info, FileText, Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const NavLink = ({ to, icon: Icon, title }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`relative p-3 rounded-full transition-all duration-300 flex items-center justify-center group ${
        active 
          ? 'text-blue-600 dark:text-white scale-105' 
          : 'text-slate-500 hover:text-slate-950 dark:text-gray-400 dark:hover:text-white hover:scale-110'
      }`}
      title={title}
    >
      {/* Active glass droplet background */}
      {active && (
        <>
          {/* Glass refraction layer */}
          <div
            className="absolute inset-0 -z-10 overflow-hidden rounded-full"
            style={{ backdropFilter: 'url("#navbar-liquid-glass")' }}
          />
          {/* Glass 3D reflection highlights & glowing shadow */}
          <div className="absolute inset-0 z-0 rounded-full border border-blue-500/30 dark:border-blue-400/20 shadow-[0_4px_10px_rgba(59,130,246,0.25),inset_1px_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_0_12px_rgba(59,130,246,0.35),inset_2px_2px_1px_-1px_rgba(255,255,255,0.7),inset_-2px_-2px_1.5px_-1px_rgba(255,255,255,0.2),inset_0_0_4px_2px_rgba(59,130,246,0.15)] bg-blue-500/5 dark:bg-blue-500/10 animate-pulse" />
        </>
      )}
      
      {/* Hover state subtle background */}
      {!active && (
        <div className="absolute inset-0 rounded-full bg-slate-200/0 group-hover:bg-slate-200/50 dark:bg-white/0 dark:group-hover:bg-white/5 transition-all duration-300" />
      )}

      {/* The Icon itself */}
      <Icon className="h-5.5 w-5.5 relative z-10 transition-transform duration-300 group-hover:scale-105" />
    </Link>
  );
};

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[390px] h-16 flex flex-row items-center justify-around z-[9999] px-4 rounded-full md:fixed md:left-6 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:right-auto md:-translate-x-0 md:w-16 md:h-auto md:max-w-none md:flex-col md:justify-center md:space-y-6 md:space-x-0 md:py-6 md:px-2 md:rounded-2xl transition-all duration-300 border border-slate-200 dark:border-white/10 isolate bg-white/80 dark:bg-white/[0.03]">
      {/* Liquid Glass Refraction Backdrop */}
      <div
        className="absolute inset-0 -z-10 overflow-hidden rounded-full md:rounded-2xl"
        style={{ backdropFilter: 'url("#navbar-liquid-glass")' }}
      />
      
      {/* 3D Liquid Glass Shadow & Reflections Layer */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none rounded-full md:rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] bg-slate-100/10 dark:bg-white/[0.03]" 
      />

      {/* Nav Links */}
      <NavLink to="/main" icon={Home} title="Home Search" />
      <NavLink to="/audio-search" icon={Mic} title="Audio Search" />
      <NavLink to="/form" icon={FileText} title="Add Song" />
      <NavLink to="/about" icon={Info} title="About Lyrica" />

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="relative p-3 rounded-full transition-all duration-300 flex items-center justify-center group text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:scale-110"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <div className="absolute inset-0 rounded-full bg-slate-200/0 group-hover:bg-slate-200/50 dark:bg-white/0 dark:group-hover:bg-white/5 transition-all duration-300" />
        {theme === 'dark' ? (
          <Sun className="h-5.5 w-5.5 relative z-10 transition-transform duration-300 group-hover:scale-105 text-amber-400" />
        ) : (
          <Moon className="h-5.5 w-5.5 relative z-10 transition-transform duration-300 group-hover:scale-105 text-indigo-600" />
        )}
      </button>

      {/* SVG Liquid Glass Filter */}
      <GlassFilter />
    </nav>
  );
};

function GlassFilter() {
  return (
    <svg className="hidden absolute w-0 h-0 pointer-events-none">
      <defs>
        <filter
          id="navbar-liquid-glass"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          {/* Generate turbulent noise for distortion */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04 0.04"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />

          {/* Blur the turbulence pattern slightly */}
          <feGaussianBlur in="turbulence" stdDeviation="1.5" result="blurredNoise" />

          {/* Displace the source graphic with the noise */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="45"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />

          {/* Apply overall blur on the final result */}
          <feGaussianBlur in="displaced" stdDeviation="3.5" result="finalBlur" />

          {/* Output the result */}
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

export default Navbar;
