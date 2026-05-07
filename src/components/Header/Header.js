import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, LogOut, Key } from 'lucide-react';
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { decodeJWT } from '../../utils/base64';
import './Header.css';

const Header = ({
  title = 'Welcome',
  subtitle,
  showNotifications = false,
  showProfile = true,
  onLogout,
  onChangePassword,
}) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'User',
    email: '',
    initial: 'U',
  });
  const { logout } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUserProfile = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token) {
        const decodedToken = decodeJWT(token);
        
        if (decodedToken) {
          const name =
            decodedToken.name || decodedToken.username || decodedToken.sub || 'User';
          let email = decodedToken.email;

          if (!email) {
            const rememberedEmail = localStorage.getItem('rememberedEmail');
            if (rememberedEmail) {
              email = rememberedEmail;
            }
          }

          if (!email && userData) {
            try {
              const parsedUserData = JSON.parse(userData);
              email = parsedUserData.email || parsedUserData.username || '';
            } catch (parseError) {
              console.error('Error parsing user data:', parseError);
            }
          }

          setUserProfile({
            name,
            email: email || '',
            initial: name.charAt(0).toUpperCase(),
            role: decodedToken.role,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 1:
        return 'Maker';
      case 2:
      case 3:
        return 'Checker';
      case 4:
        return 'Admin';
      default:
        return 'User';
    }
  };

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false);
    await logout();
    if (onLogout) {
      onLogout();
    }
  };

  const renderTitle = () => {
    if (title === 'Welcome') {
      return (
        <>
          <span className="header-title-text">Welcome to</span>
          <span className="header-title-text header-title-bold"> MHIP</span>
        </>
      );
    } else if (title === 'Enrolment Portal') {
      return (
        <>
          <span className="header-title-text">Enrolment Portal</span>
          <span className="header-title-text"> for Pakistan</span>
        </>
      );
    } else {
      return <span className="header-title-text">{title}</span>;
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <img src="/ismaililogo.png" alt="Logo" style={{ width: 48, height: 48, borderRadius: 12 }} />
        </div>
        <div className="header-title-container">
          <h1 className="header-title">{renderTitle()}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      {showProfile && (
        <div className="header-right" ref={dropdownRef}>
          {/* Notification bell removed */}
          
          <div className="header-profile">
            <button
              className="header-profile-btn"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            >
              <div className="header-avatar" style={{ backgroundColor: colors.avatarBg }}>
                {userProfile.initial}
              </div>
              <div className="header-user-info">
                <span className="header-user-name">{userProfile.name}</span>
                {userProfile.role && (
                  <span className="header-user-role">{getRoleName(userProfile.role)}</span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`header-dropdown-icon ${isProfileDropdownOpen ? 'open' : ''}`}
              />
            </button>

            {isProfileDropdownOpen && (
              <div className="header-dropdown">
                <div className="header-dropdown-header">
                  <div className="header-dropdown-avatar" style={{ backgroundColor: colors.avatarBg }}>
                    {userProfile.initial}
                  </div>
                  <div className="header-dropdown-info">
                    <span className="header-dropdown-name">{userProfile.name}</span>
                    <span className="header-dropdown-email">{userProfile.email}</span>
                  </div>
                </div>
                <div className="header-dropdown-divider" />
                <button className="header-dropdown-item" onClick={onChangePassword}>
                  <Key size={16} />
                  <span>Change Password</span>
                </button>
                <button className="header-dropdown-item header-dropdown-logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
