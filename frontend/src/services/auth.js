import jwt_decode from 'jwt-decode';

export const auth = {
  // Store JWT token in localStorage
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Get JWT token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Remove JWT token from localStorage
  removeToken: () => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = auth.getToken();
    if (!token) return false;
    
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Token decode error:', error);
      return false;
    }
  },

  // Get user role from JWT token
  getUserRole: () => {
    const token = auth.getToken();
    if (!token) return null;
    
    try {
      const decoded = jwt_decode(token);
      return decoded.role;
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  },

  // Get user data from JWT token
  getUserData: () => {
    const token = auth.getToken();
    if (!token) return null;
    
    try {
      const decoded = jwt_decode(token);
      return {
        id: decoded.user_id || decoded.id,
        email: decoded.email,
        role: decoded.role,
        exp: decoded.exp
      };
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  },

  // Logout user
  logout: () => {
    auth.removeToken();
    window.location.href = '/login';
  }
};

export default auth;