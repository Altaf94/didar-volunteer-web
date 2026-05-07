import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomInput from '../../components/CustomInput/CustomInput';
import Alert from '../../components/Alert/Alert';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
// colors not used in this component
import { useAlert } from '../../hooks/useAlert';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { decodeJWT } from '../../utils/base64';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { alert, showError, hideAlert } = useAlert();
  const [emailAlert, setEmailAlert] = useState({ isVisible: false, message: '' });
  const { login, isAuthenticated } = useAuth();

  // Email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation
  const isValidPassword = (pwd) => {
    return pwd.length >= 6;
  };

  const isFormValid = isValidEmail(username) && isValidPassword(password);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded?.role === 2 || decoded?.role === 5) {
          navigate('/maker');
        } else if (decoded?.role === 3 || decoded?.role === 6) {
          navigate('/checker');
        }
      }
    }
  }, [isAuthenticated, navigate]);

  // Load saved email on mount
  useEffect(() => {
    loadSavedCredentials();
    testApiConnection();
  }, []);

  const loadSavedCredentials = () => {
    try {
      const savedEmail = localStorage.getItem('rememberedEmail');
      const savedRememberMe = localStorage.getItem('rememberMe');

      if (savedEmail && savedRememberMe === 'true') {
        setUsername(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const testApiConnection = async () => {
    try {
      const isConnected = await apiService.testConnection();
      setApiConnected(isConnected);
    } catch (error) {
      console.error('API connection test failed:', error);
      setApiConnected(false);
    }
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      setEmailError('');
      setEmailAlert({ isVisible: false, message: '' });
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid Email Address');
      setEmailAlert({
        isVisible: true,
        message: 'Please enter a valid Email Address',
      });
    } else {
      setEmailError('');
      setEmailAlert({ isVisible: false, message: '' });
    }
  };

  const handleEmailChange = (value) => {
    setUsername(value.toLowerCase());
    if (emailError) {
      setEmailError('');
      setEmailAlert({ isVisible: false, message: '' });
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    validateEmail(username);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    hideAlert();
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      showError('Validation Error', 'Username and password are required');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login...');
      const data = await apiService.login({ username, password });

      if (data.access_token && data.refresh_token) {
        // Check user role
        const decodedToken = decodeJWT(data.access_token);
        
        if (!decodedToken) {
          throw new Error('Invalid token received');
        }
        
        const userRole = decodedToken.role;

        // Accept the role ids currently issued by the backend.
        if (userRole !== 2 && userRole !== 3 && userRole !== 5 && userRole !== 6) {
          throw new Error(
            'Access denied. Only Makers and Checkers can access this system.'
          );
        }

        login(data.access_token, data.refresh_token, data.user);

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', username);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }

        console.log('Login successful! Redirecting based on role:', userRole);
        
        // Route based on user role
        if (userRole === 2 || userRole === 5) {
          navigate('/maker');
        } else if (userRole === 3 || userRole === 6) {
          navigate('/checker');
        }
      } else {
        throw new Error('Both access token and refresh token are required');
      }
    } catch (err) {
      console.error('Login error:', err);
      showError(
        'Login Failed',
        err.message || 'Incorrect Email Address or Password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <IsmailiLoader visible={loading} message="Signing In..." />

      <Alert
        type={alert.type}
        message={alert.message}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        autoClose
        autoCloseDelay={15000}
      />

      <Alert
        type="error"
        message={emailAlert.message}
        isVisible={emailAlert.isVisible}
        onClose={() => setEmailAlert({ isVisible: false, message: '' })}
        autoClose
        autoCloseDelay={5000}
      />

      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <img src="/ismaililogo.png" alt="Logo" style={{ width: 80, height: 80, borderRadius: 16 }} />
        </div>
        {/* Title */}
        <h1 className="login-title">Welcome</h1>
        <p className="login-subtitle">
          Enter the credentials shared by your respective Council
        </p>

        {/* Form */}
        <form className="login-form" onSubmit={handleSignIn}>
          <CustomInput
            type="email"
            label="Email Address"
            placeholder="Enter your Email Address"
            value={username}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            error={emailTouched && !!emailError}
          />

          <CustomInput
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
          />

          {/* Remember Me & Forgot Password */}
          <div className="login-options">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-checkbox"
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="login-forgot-btn">
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={!isFormValid || loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* API Status */}
        <div className="login-api-status">
          <span
            className={`status-indicator ${apiConnected === true ? 'connected' : apiConnected === false ? 'disconnected' : ''}`}
          />
          <span className="status-text">
            {apiConnected === null
              ? 'Checking connection...'
              : apiConnected
              ? 'Connected to server'
              : 'Server unreachable'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
