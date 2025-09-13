import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RR</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              RegulatorRadar
            </span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/system-health"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              System Health
            </Link>
            <Link
              to="/subscribe"
              className="btn-primary"
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