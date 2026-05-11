import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomInput from '../../components/CustomInput/CustomInput';
import Alert from '../../components/Alert/Alert';
import IsmailiLoader from '../../components/shared/IsmailiLoader';
import volunteerApiService from '../../services/volunteerApi';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    isVisible: false,
    type: '',
    message: '',
  });

  const isValidEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setAlert({
      isVisible: false,
      type: '',
      message: '',
    });

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Email address is required',
      });
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setAlert({
        isVisible: true,
        type: 'error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    setLoading(true);

    try {
      const data = await volunteerApiService.forgotPassword(cleanEmail);

      setAlert({
        isVisible: true,
        type: 'success',
        message:
          data?.message ||
          'Password reset instructions have been sent to your email.',
      });

      setEmail('');
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
    <div className="forgot-container">
      <IsmailiLoader visible={loading} message="Sending Request..." />

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

      <div className="forgot-card">
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

        <h1 className="forgot-title">Forgot Password</h1>

        <p className="forgot-subtitle">
          Enter your registered email address and we'll send you instructions to
          reset your password.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <CustomInput
            type="email"
            label="Email Address"
            placeholder="Enter your Email Address"
            value={email}
            onChange={(val) => setEmail(val.toLowerCase())}
          />

          <button
            type="submit"
            className="forgot-submit-btn"
            disabled={!email.trim() || loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="back-to-login">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;