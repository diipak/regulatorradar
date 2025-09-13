import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Subscribe from './pages/Subscribe';
import { RSSDemo } from './components/RSSDemo';
import TranslationDemo from './components/TranslationDemo';
import EmailSubscription from './components/EmailSubscription';
import SystemTest from './components/SystemTest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="subscribe" element={<Subscribe />} />
          <Route path="rss-demo" element={<RSSDemo />} />
          <Route path="translation-demo" element={<TranslationDemo />} />
          <Route path="email-demo" element={<EmailSubscription />} />
          <Route path="system-test" element={<SystemTest />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;