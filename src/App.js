import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VolunteerProvider } from './context/VolunteerContext';
import LoadingProvider from './context/LoadingProvider';

// Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Admin from './pages/admin/Admin';

import MakerHomePage from './pages/volunteer/MakerHomePage';
import MakerReviewPage from './pages/volunteer/MakerReviewPage';
import CheckerHomePage from './pages/volunteer/CheckerHomePage';
import CheckerImportReviewPage from './pages/volunteer/CheckerImportReviewPage';
import CheckerNationalAdminCreatePage from './pages/volunteer/CheckerNationalAdminCreatePage';
import CheckerPrintPage from './pages/volunteer/CheckerPrintPage';
import VolunteerUploadPage from './pages/volunteer/VolunteerUploadPage';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles, requirePermission }) => {
  const { isAuthenticated, isLoading, userRole, permissions } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 2 || userRole === 5) {
      return <Navigate to="/maker" replace />;
    } else if (userRole === 3 || userRole === 6) {
      return <Navigate to="/checker" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  if (requirePermission) {
    const hasPermission =
      (requirePermission === 'view' && permissions?.canView) ||
      (requirePermission === 'make' && permissions?.canMake) ||
      (requirePermission === 'check' && permissions?.canCheck);

    if (!hasPermission) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// Public Route Component redirect if authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    if (userRole === 2 || userRole === 5) {
      return <Navigate to="/maker" replace />;
    } else if (userRole === 3 || userRole === 6) {
      return <Navigate to="/checker" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Admin Route - PIN based, no login required */}
      <Route path="/admin" element={<Admin />} />

      {/* Maker Routes */}
      <Route
        path="/maker"
        element={
          <ProtectedRoute allowedRoles={[2, 5]} requirePermission="view">
            <MakerHomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/maker/upload"
        element={
          <ProtectedRoute allowedRoles={[2, 5]} requirePermission="make">
            <VolunteerUploadPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/maker/review"
        element={
          <ProtectedRoute allowedRoles={[2, 5]} requirePermission="view">
            <MakerReviewPage />
          </ProtectedRoute>
        }
      />

      {/* Checker Routes */}
      <Route
        path="/checker"
        element={
          <ProtectedRoute allowedRoles={[3, 6]} requirePermission="view">
            <CheckerHomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checker/review"
        element={
          <ProtectedRoute allowedRoles={[3, 6]} requirePermission="check">
            <CheckerHomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checker/print"
        element={
          <ProtectedRoute allowedRoles={[3, 6]} requirePermission="check">
            <CheckerPrintPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checker/national-admin-create"
        element={
          <ProtectedRoute allowedRoles={[3, 6]} requirePermission="check">
            <CheckerNationalAdminCreatePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checker/dispatch"
        element={
          <ProtectedRoute allowedRoles={[3, 6]} requirePermission="check">
            <CheckerHomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checker/import/:importId"
        element={
          <ProtectedRoute allowedRoles={[3, 6]} requirePermission="check">
            <CheckerImportReviewPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <VolunteerProvider>
          <LoadingProvider>
            <AppRoutes />
          </LoadingProvider>
        </VolunteerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
