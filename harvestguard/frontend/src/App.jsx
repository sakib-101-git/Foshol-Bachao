/**
 * Main App Component - Routing Configuration
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Weather from './pages/Weather';
import Profile from './pages/Profile';
import RiskPrediction from './pages/RiskPrediction';
import CropScanner from './pages/CropScanner';
import LocalRiskMap from './pages/LocalRiskMap';
import ProtectedRoute from './components/ProtectedRoute';
import VoiceButton from './components/VoiceButton';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes - A2: Authentication Required */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* A3: Weather Forecast */}
        <Route path="/weather" element={
          <ProtectedRoute>
            <Weather />
          </ProtectedRoute>
        } />
        
        {/* A4: Risk Prediction & ETCL */}
        <Route path="/risk-prediction" element={
          <ProtectedRoute>
            <RiskPrediction />
          </ProtectedRoute>
        } />
        
        {/* A5: Crop Health Scanner */}
        <Route path="/crop-scanner" element={
          <ProtectedRoute>
            <CropScanner />
          </ProtectedRoute>
        } />
        
        {/* B1: Local Risk Map - Community Awareness */}
        <Route path="/risk-map" element={
          <ProtectedRoute>
            <LocalRiskMap />
          </ProtectedRoute>
        } />
      </Routes>
      {/* Global voice assistant button */}
      <VoiceButton />
    </Router>
  );
}

export default App;
