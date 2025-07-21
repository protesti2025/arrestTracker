import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import EventSubmission from './pages/EventSubmission';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './services/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id" 
              element={
                <ProtectedRoute>
                  <EventDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/submit-event" 
              element={
                <ProtectedRoute requiredRole="spotter">
                  <EventSubmission />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;