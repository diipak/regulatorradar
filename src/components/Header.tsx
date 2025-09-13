import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 hover-lift transition-smooth">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse-glow">
              <span className="text-white font-bold text-sm">RR</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              RegulatorRadar
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              Live
            </span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 font-medium transition-smooth focus-visible:focus"
              title="View regulatory alerts and compliance dashboard"
            >
              Dashboard
            </Link>
            <Link
              to="/system-health"
              className="text-gray-600 hover:text-gray-900 font-medium transition-smooth focus-visible:focus"
              title="Monitor system health and performance"
            >
              System Health
            </Link>
            <Link
              to="/subscribe"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-smooth hover-lift focus-visible:focus"
              title="Subscribe to regulatory alerts and notifications"
            >
              Subscribe
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;