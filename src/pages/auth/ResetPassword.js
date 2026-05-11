import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomInput from '../../components/CustomInput/CustomInput';
import Alert from '../../components/Alert/Alert';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import volunteerApiService from '../../services/volunteerApi';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => {
    return searchParams.get('token') || '';
  }, [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    isVisible: false,
    type: '',
    message: '',
  });

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

  const validateForm = () => {
    if (!token) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Reset token is missing. Please use the link from your email.',
      });
      return false;
    }

    if (!password.trim()) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'New password is required.',
      });
      return false;
    }

    if (password.length < 8) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Password must be at least 8 characters long.',
      });
      return false;
    }

    if (!confirmPassword.trim()) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Please confirm your password.',
      });
      return false;
    }

    if (password !== confirmPassword) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Passwords do not match.',
      });
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setAlert({
      isVisible: false,
      type: '',
      message: '',
    });

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = await volunteerApiService.resetPassword(token, password);

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
      setAlert({
        isVisible: true,
        type: 'error',
        message: error?.message || 'Network error. Please check your server connection.',
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
            onChange={(val) => setPassword(val)}
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
            onChange={(val) => setConfirmPassword(val)}
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
            onClick={() => navigate('/')}
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;