import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// Simple Subscribe component for now
function Subscribe() {
  return <div className="p-4"><h1>Subscribe</h1><p>Subscribe content here</p></div>;
}

function App() {
  return (
    <Router>
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