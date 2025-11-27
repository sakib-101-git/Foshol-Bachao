import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Weather from './pages/Weather';
import Profile from './pages/Profile';
import RiskPrediction from './pages/RiskPrediction';
import CropScanner from './pages/CropScanner';

/**
 * Main App component
 * Routing for HarvestGuard / Foshol Bachao
 * 
 * Features:
 * A2 - Farmer + Crop Management (Dashboard, Profile, Batches)
 * A3 - Hyper-Local Weather Forecast (Weather)
 * A4 - Risk Prediction + ETCL Model (RiskPrediction)
 * A5 - Crop Health Scanner AI (CropScanner)
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* A2: Farmer + Crop Management */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* A3: Weather Forecast */}
        <Route path="/weather" element={<Weather />} />
        
        {/* A4: Risk Prediction & ETCL */}
        <Route path="/risk-prediction" element={<RiskPrediction />} />
        
        {/* A5: Crop Health Scanner */}
        <Route path="/crop-scanner" element={<CropScanner />} />
      </Routes>
    </Router>
  );
}

export default App;
