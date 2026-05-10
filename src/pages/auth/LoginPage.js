import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomInput from '../../components/CustomInput/CustomInput';
import Alert from '../../components/Alert/Alert';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
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
  const [emailAlert, setEmailAlert] = useState({
    isVisible: false,
    message: '',
  });

  const { login, isAuthenticated } = useAuth();

  const normalizeRole = (role) => {
    if (role === null || role === undefined) {
      return null;
    }

    if (typeof role === 'number') {
      return role;
    }

    const roleString = String(role).trim().toLowerCase();

    if (/^\d+$/.test(roleString)) {
      return Number(roleString);
    }

    if (roleString.includes('maker')) {
      return 2;
    }

    if (roleString.includes('checker')) {
      return 3;
    }

    if (roleString.includes('admin')) {
      return 1;
    }

    return null;
  };

  const redirectByRole = (role) => {
    const normalizedRole = normalizeRole(role);

    console.log('Redirecting by role:', {
      originalRole: role,
      normalizedRole,
    });

    if (normalizedRole === 2 || normalizedRole === 5) {
      navigate('/maker', { replace: true });
      return;
    }

    if (normalizedRole === 3 || normalizedRole === 6) {
      navigate('/checker', { replace: true });
      return;
    }

    console.warn('Unknown role. Staying on login page:', normalizedRole);
  };

  const isAllowedRole = (role) => {
    const normalizedRole = normalizeRole(role);
    return [2, 3, 5, 6].includes(normalizedRole);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (pwd) => {
    return pwd.length >= 6;
  };

  const isFormValid = isValidEmail(username) && isValidPassword(password);

  useEffect(() => {
    try {
      if (isAuthenticated) {
        const token =
          localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('accessToken');

        if (!token) {
          console.warn('Authenticated state true but token missing.');
          return;
        }

        const decoded = decodeJWT(token);

        console.log('Already authenticated token decoded:', decoded);

        if (!decoded) {
          console.warn('Invalid saved token. Clearing storage.');
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refresh_token');
          return;
        }

        redirectByRole(decoded.role);
      }
    } catch (error) {
      console.error('Redirect effect failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refresh_token');
    }
  }, [isAuthenticated, navigate]);

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
      setEmailAlert({
        isVisible: false,
        message: '',
      });
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid Email Address');
      setEmailAlert({
        isVisible: true,
        message: 'Please enter a valid Email Address',
      });
      return;
    }

    setEmailError('');
    setEmailAlert({
      isVisible: false,
      message: '',
    });
  };

  const handleEmailChange = (value) => {
    setUsername(value.toLowerCase());

    if (emailError) {
      setEmailError('');
      setEmailAlert({
        isVisible: false,
        message: '',
      });
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

    const cleanEmail = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      showError('Validation Error', 'Email and password are required');
      setLoading(false);
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      showError('Validation Error', 'Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', {
        email: cleanEmail,
      });

      const data = await apiService.login({
        username: cleanEmail,
        password: cleanPassword,
      });

      console.log('Login API returned:', data);

      if (!data?.access_token || !data?.refresh_token) {
        throw new Error('Both access token and refresh token are required');
      }

      const decodedToken = decodeJWT(data.access_token);

      console.log('Decoded login token:', decodedToken);

      if (!decodedToken) {
        throw new Error('Invalid token received');
      }

      const normalizedRole = normalizeRole(decodedToken.role);

      console.log('Login role check:', {
        backendRole: decodedToken.role,
        normalizedRole,
      });

      if (!isAllowedRole(normalizedRole)) {
        throw new Error(
          `Access denied. Your role (${decodedToken.role}) is not allowed for this system.`
        );
      }

      const normalizedUser = {
        ...(data.user || {}),
        id: data.user?.id || decodedToken.id || decodedToken.user_id || decodedToken.sub,
        email: data.user?.email || decodedToken.sub || cleanEmail,
        username: data.user?.username || decodedToken.sub || cleanEmail,
        name: data.user?.name || decodedToken.name || '',
        role: normalizedRole,
        RoleId: normalizedRole,
        scope: decodedToken.scope,
        region_id: decodedToken.region_id,
      };

      login(data.access_token, data.refresh_token, normalizedUser);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', cleanEmail);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

      console.log('Login successful. Navigating...', {
        role: normalizedRole,
      });

      if (normalizedRole === 2 || normalizedRole === 5) {
        navigate('/maker', { replace: true });
      } else if (normalizedRole === 3 || normalizedRole === 6) {
        navigate('/checker', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);

      showError(
        'Login Failed',
        err?.message || 'Incorrect Email Address or Password'
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
        onClose={() =>
          setEmailAlert({
            isVisible: false,
            message: '',
          })
        }
        autoClose
        autoCloseDelay={5000}
      />

      <div className="login-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <img
            src="/ismaililogo.png"
            alt="Logo"
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
            }}
          />
        </div>

        <h1 className="login-title">Welcome</h1>

        <p className="login-subtitle">
          Enter the credentials shared by your respective Council
        </p>

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

            <button
              type="button"
              className="login-forgot-btn"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={!isFormValid || loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-api-status">
          <span
            className={`status-indicator ${
              apiConnected === true
                ? 'connected'
                : apiConnected === false
                  ? 'disconnected'
                  : ''
            }`}
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