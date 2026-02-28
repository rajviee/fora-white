import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Diagnostic logging for debugging
    console.log('Login Attempt for:', email);

    try {
      // 1. Perform Login API Call
      // api.js handles the baseURL (e.g., http://192.168.0.104:3000/api)
      const res = await api.post('auth/login', { email, password });
      
      console.log('Login Response received:', res.status, res.data);

      // 2. Extract Token and Subscription from various possible structures
      // Backend might return { token, subscription } or { data: { token, subscription } }
      // Or might return token as the root object directly
      const token = res.data?.token || res.data?.data?.token || (typeof res.data === 'string' ? res.data : null);
      const subscription = res.data?.subscription || res.data?.data?.subscription;

      // 3. Validation
      if (!token) {
        console.error('Login Error: Server response missing token', res.data);
        throw new Error('Login failed: Token not provided by server');
      }

      // 4. Update Auth State (Context + LocalStorage)
      // login() handles storage and jwt decoding safely
      await login(token, subscription);
      
      console.log('Login state updated successfully. Navigating...');

      // 5. Navigation
      // Force navigation to dashboard
      navigate('/dashboard', { replace: true });

    } catch (err) {
      console.error('Login Catch block:', err);
      
      // 6. Detailed Error Messaging
      let msg = 'Login failed. Please check your credentials.';
      
      if (err.message === 'Network Error') {
        msg = 'Connection Error: Check if server is running or if backend URL is correct.';
      } else if (err.response?.status === 401) {
        msg = 'Invalid email or password.';
      } else if (err.response?.status === 404) {
        msg = 'Server endpoint not found. Contact administrator.';
      } else if (err.response?.data?.message || err.response?.data?.error) {
        msg = err.response.data.message || err.response.data.error;
      } else if (err.message) {
        msg = err.message;
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <h1 className="text-2xl font-bold text-secondary">ForaTask</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="you@company.com"
                data-testid="login-email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Enter your password"
                data-testid="login-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              data-testid="login-submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline" data-testid="register-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
