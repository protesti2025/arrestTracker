import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/dashboard" className="navbar-brand">
            Protest Tracker
          </Link>
          <ul className="navbar-nav">
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            {user?.role === 'spotter' && (
              <li>
                <Link to="/submit-event">Submit Event</Link>
              </li>
            )}
            <li>
              <span>Welcome, {user?.email}</span>
            </li>
            <li>
              <span>Role: {user?.role}</span>
            </li>
            <li>
              <button className="btn btn-secondary" onClick={logout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;