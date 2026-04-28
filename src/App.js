import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VolunteerProvider } from './context/VolunteerContext';
import LoadingProvider from './context/LoadingProvider';

// Pages
import LoginPage from './pages/auth/LoginPage';
import MakerHomePage from './pages/volunteer/MakerHomePage';
import MakerReviewPage from './pages/volunteer/MakerReviewPage';
import CheckerHomePage from './pages/volunteer/CheckerHomePage';
import CheckerImportReviewPage from './pages/volunteer/CheckerImportReviewPage';
import VolunteerUploadPage from './pages/volunteer/VolunteerUploadPage';
import DashboardPage from './pages/volunteer/DashboardPage';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();

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
    // Redirect based on role
    if (userRole === 1) {
      return <Navigate to="/maker" replace />;
    } else if (userRole === 2 || userRole === 3) {
      return <Navigate to="/checker" replace />;
    } else if (userRole === 4) {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

// Public Route Component (redirect if authenticated)
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
    // Redirect based on role
    if (userRole === 1) {
      return <Navigate to="/maker" replace />;
    } else if (userRole === 2 || userRole === 3) {
      return <Navigate to="/checker" replace />;
    } else if (userRole === 4) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/maker" replace />;
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

      {/* Maker Routes */}
      <Route
        path="/maker"
        element={
          <ProtectedRoute allowedRoles={[1, 3]}>
            <MakerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maker/upload"
        element={
          <ProtectedRoute allowedRoles={[1, 3]}>
            <VolunteerUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maker/review"
        element={
          <ProtectedRoute allowedRoles={[1, 3]}>
            <MakerReviewPage />
          </ProtectedRoute>
        }
      />

      {/* Checker Routes */}
      <Route
        path="/checker"
        element={
          <ProtectedRoute allowedRoles={[2, 3]}>
            <CheckerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checker/review"
        element={
          <ProtectedRoute allowedRoles={[2, 3]}>
            <CheckerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checker/print"
        element={
          <ProtectedRoute allowedRoles={[2, 3]}>
            <CheckerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checker/dispatch"
        element={
          <ProtectedRoute allowedRoles={[2, 3]}>
            <CheckerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checker/import/:importId"
        element={
          <ProtectedRoute allowedRoles={[2, 3]}>
            <CheckerImportReviewPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[3]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
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
