import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Subscribe from './pages/Subscribe';

// Landing Page Component
function LandingPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI-Powered Regulatory Intelligence for Fintech
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Stay ahead of regulatory changes with intelligent monitoring and impact analysis.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 mb-3">Real-time Monitoring</h3>
              <p className="text-blue-700">
                Continuously monitor regulatory sources and get instant alerts on relevant changes.
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-900 mb-3">Impact Analysis</h3>
              <p className="text-green-700">
                AI-powered analysis of how regulatory changes affect your business operations.
              </p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-purple-900 mb-3">Compliance Tracking</h3>
              <p className="text-purple-700">
                Track compliance requirements and get actionable insights for your team.
              </p>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold text-lg"
            >
              🚀 View Live Dashboard
            </Link>
            <Link
              to="/subscribe"
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-semibold text-lg"
            >
              📧 Subscribe to Alerts
            </Link>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">RSS Monitoring</span>
                <span className="text-green-600 font-medium">✅ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">AI Processing</span>
                <span className="text-green-600 font-medium">✅ Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Notification Service</span>
                <span className="text-green-600 font-medium">✅ Ready</span>
              </div>
            </div>
          </div>

          {/* Demo Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">🎯 Demo Instructions</h3>
            <div className="space-y-2 text-blue-800">
              <p>• <strong>Dashboard:</strong> View real-time regulatory alerts and system monitoring</p>
              <p>• <strong>Subscribe:</strong> Set up email notifications with custom preferences</p>
              <p>• <strong>RSS Monitoring:</strong> Automatically fetches SEC regulatory updates</p>
              <p>• <strong>Impact Analysis:</strong> AI-powered severity scoring and business impact assessment</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Header Component
function Header() {
  const location = useLocation();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
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
              to="/dashboard"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/subscribe"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/subscribe'
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Subscribe
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function App() {
  // Detect if we're running on GitHub Pages
  const basename = window.location.hostname === 'diipak.github.io' ? '/regulatorradar' : '';
  
  return (
    <Router basename={basename}>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscribe" element={<Subscribe />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;