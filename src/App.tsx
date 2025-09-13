import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// Simple Subscribe component for now
function Subscribe() {
  return <div className="p-4"><h1>Subscribe</h1><p>Subscribe content here</p></div>;
}

function App() {
  // Detect if we're running on GitHub Pages
  const basename = window.location.hostname === 'diipak.github.io' ? '/regulatorradar' : '';
  
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="subscribe" element={<Subscribe />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;