import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomInput from '../../components/CustomInput/CustomInput';
import Alert from '../../components/Alert/Alert';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => {
    return searchParams.get('token') || '';
  }, [searchParams]);

  const API_BASE_URL =
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    'http://127.0.0.1:8001';

  const RESET_PASSWORD_URL = `${API_BASE_URL}/api/volunteers/auth/reset-password`;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    isVisible: false,
    type: '',
    message: '',
  });

  const [debugLogs, setDebugLogs] = useState([]);

  const addDebugLog = (label, data = null) => {
    const timestamp = new Date().toISOString();

    const logItem = {
      timestamp,
      label,
      data,
    };

    setDebugLogs((prev) => [...prev, logItem]);

    if (data !== null && data !== undefined) {
      console.log(`[RESET PASSWORD DEBUG] ${timestamp} - ${label}:`, data);
    } else {
      console.log(`[RESET PASSWORD DEBUG] ${timestamp} - ${label}`);
    }
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
    console.clear();
    console.log('[RESET PASSWORD DEBUG] Debug logs cleared');
  };

  const getPasswordStrength = (value) => {
    let score = 0;

    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (!value) {
      return {
        label: '',
        className: '',
        score,
      };
    }

    if (score <= 2) {
      return {
        label: 'Weak',
        className: 'weak',
        score,
      };
    }

    if (score <= 4) {
      return {
        label: 'Medium',
        className: 'medium',
        score,
      };
    }

    return {
      label: 'Strong',
      className: 'strong',
      score,
    };
  };

  const passwordStrength = getPasswordStrength(password);

  const readResponseBodySafely = async (response) => {
    const contentType = response.headers.get('content-type');

    addDebugLog('Response content-type', contentType);

    try {
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        addDebugLog('Response JSON body', jsonData);
        return jsonData;
      }

      const textData = await response.text();
      addDebugLog('Response TEXT body', textData);

      return {
        message: textData,
      };
    } catch (error) {
      addDebugLog('Failed to parse response body', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });

      return {
        message: 'Unable to parse response body',
      };
    }
  };

  const validateForm = () => {
    if (!token) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Reset token is missing. Please use the link from your email.',
      });

      addDebugLog('Validation failed: token missing');
      return false;
    }

    if (!password.trim()) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'New password is required.',
      });

      addDebugLog('Validation failed: password missing');
      return false;
    }

    if (password.length < 8) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Password must be at least 8 characters long.',
      });

      addDebugLog('Validation failed: password too short');
      return false;
    }

    if (!confirmPassword.trim()) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Please confirm your password.',
      });

      addDebugLog('Validation failed: confirm password missing');
      return false;
    }

    if (password !== confirmPassword) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Passwords do not match.',
      });

      addDebugLog('Validation failed: passwords do not match');
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    clearDebugLogs();

    setAlert({
      isVisible: false,
      type: '',
      message: '',
    });

    addDebugLog('Reset password submit clicked');
    addDebugLog('Window location', window.location.href);
    addDebugLog('API_BASE_URL', API_BASE_URL);
    addDebugLog('RESET_PASSWORD_URL', RESET_PASSWORD_URL);
    addDebugLog('Token exists', Boolean(token));
    addDebugLog('Token preview', token ? `${token.slice(0, 8)}...` : '(missing)');
    addDebugLog('Password length', password.length);
    addDebugLog('Confirm password length', confirmPassword.length);

    if (!validateForm()) {
      return;
    }

    const payload = {
      token,
      new_password: password,
    };

    addDebugLog('Request payload', {
      token: `${token.slice(0, 8)}...`,
      new_password_length: password.length,
    });

    setLoading(true);

    const startedAt = performance.now();

    try {
      addDebugLog('Fetch request starting');

      const response = await fetch(RESET_PASSWORD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const endedAt = performance.now();
      const durationMs = Math.round(endedAt - startedAt);

      addDebugLog('Fetch request completed', {
        durationMs,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        redirected: response.redirected,
        type: response.type,
      });

      const responseHeaders = {};

      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      addDebugLog('Response headers', responseHeaders);

      const data = await readResponseBodySafely(response);

      if (!response.ok) {
        const errorMessage =
          data?.detail?.message ||
          data?.detail?.error ||
          data?.detail ||
          data?.message ||
          `Request failed with status ${response.status}`;

        addDebugLog('Backend returned error response', {
          status: response.status,
          statusText: response.statusText,
          data,
        });

        setAlert({
          isVisible: true,
          type: 'error',
          message: errorMessage,
        });

        return;
      }

      addDebugLog('Reset password API success', data);

      setAlert({
        isVisible: true,
        type: 'success',
        message: data?.message || 'Password reset successfully.',
      });

      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/');
      }, 1800);
    } catch (error) {
      addDebugLog('Fetch/network exception caught', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });

      let message = 'Network error. Backend server check karo.';

      if (error?.message?.includes('Failed to fetch')) {
        message =
          'Failed to fetch: Backend URL wrong hai, backend band hai, ya CORS issue hai.';
      }

      setAlert({
        isVisible: true,
        type: 'error',
        message,
      });
    } finally {
      addDebugLog('Request finished, loading false');
      setLoading(false);
    }
  };

  const testBackendHealth = async () => {
    clearDebugLogs();

    const healthUrl = `${API_BASE_URL}/health`;

    addDebugLog('Testing backend health endpoint', healthUrl);

    setLoading(true);

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      addDebugLog('Health response meta', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      const data = await readResponseBodySafely(response);

      if (!response.ok) {
        setAlert({
          isVisible: true,
          type: 'error',
          message: `Health check failed: ${response.status}`,
        });

        return;
      }

      setAlert({
        isVisible: true,
        type: 'success',
        message: 'Backend health check success.',
      });

      addDebugLog('Backend health success', data);
    } catch (error) {
      addDebugLog('Backend health network error', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });

      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Backend health check failed. Backend server may be off.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <IsmailiLoader visible={loading} message="Resetting Password..." />

      <Alert
        type={alert.type}
        message={alert.message}
        isVisible={alert.isVisible}
        onClose={() =>
          setAlert({
            ...alert,
            isVisible: false,
          })
        }
        autoClose
        autoCloseDelay={8000}
      />

      <div className="reset-card">
        <div className="reset-logo-wrapper">
          <img
            src="/ismaililogo.png"
            alt="Logo"
            className="reset-logo"
          />
        </div>

        <h1 className="reset-title">Reset Password</h1>

        <p className="reset-subtitle">
          Enter your new password below. After reset, you can login with your new password.
        </p>

        {!token && (
          <div className="reset-token-warning">
            Reset token missing. Please open the reset link from your email.
          </div>
        )}

        <form className="reset-form" onSubmit={handleResetPassword}>
          <CustomInput
            type="password"
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChange={(val) => {
              addDebugLog('Password input changed', {
                length: val.length,
              });
              setPassword(val);
            }}
          />

          {password && (
            <div className="password-strength-wrapper">
              <div className="password-strength-row">
                <span>Password strength:</span>
                <strong className={`password-strength-text ${passwordStrength.className}`}>
                  {passwordStrength.label}
                </strong>
              </div>

              <div className="password-strength-track">
                <div
                  className={`password-strength-bar ${passwordStrength.className}`}
                  style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <CustomInput
            type="password"
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(val) => {
              addDebugLog('Confirm password input changed', {
                length: val.length,
              });
              setConfirmPassword(val);
            }}
          />

          {confirmPassword && password !== confirmPassword && (
            <div className="password-mismatch">
              Passwords do not match.
            </div>
          )}

          {confirmPassword && password === confirmPassword && (
            <div className="password-match">
              Passwords match.
            </div>
          )}

          <button
            type="submit"
            className="reset-submit-btn"
            disabled={!token || !password.trim() || !confirmPassword.trim() || loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="reset-back-to-login">
          <button
            type="button"
            className="reset-back-btn"
            onClick={() => {
              addDebugLog('Back to login clicked');
              navigate('/');
            }}
          >
            Back to Login
          </button>
        </div>

        <div className="reset-debug-panel">
          <h3>Debug Panel</h3>

          <p>
            <strong>API URL:</strong> {RESET_PASSWORD_URL}
          </p>

          <p>
            <strong>Token:</strong> {token ? `${token.slice(0, 10)}...` : '(missing)'}
          </p>

          <div className="reset-debug-actions">
            <button
              type="button"
              onClick={testBackendHealth}
              disabled={loading}
            >
              Test Backend /health
            </button>

            <button
              type="button"
              onClick={clearDebugLogs}
              disabled={loading}
            >
              Clear Debug
            </button>
          </div>

          <div className="reset-debug-logs">
            {debugLogs.length === 0 ? (
              <div>No debug logs yet.</div>
            ) : (
              debugLogs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="reset-debug-log-item"
                >
                  <div>
                    [{index + 1}] {log.timestamp}
                  </div>

                  <div>{log.label}</div>

                  {log.data !== null && log.data !== undefined && (
                    <pre>
                      {typeof log.data === 'string'
                        ? log.data
                        : JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;