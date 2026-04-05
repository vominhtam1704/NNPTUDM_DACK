// ============================================
// APP.JS - MAIN APP WITH ROUTES
// ============================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.scss';

// Pages
import HomePage from './pages/HomePage';
import {
  AccountProfilePage,
  BarberProfilePage,
  BarberListPage,
  LoginPage,
  SignupPage,
  BookingPage,
  TimeSelectionPage,
  BookingFlowDetailsPage,
  AppointmentDetailsPage,
  PaymentPage,
  BookingCompletePage,
  ReviewBarberPage,
  ProfilePage,
  AdminDashboardPage,
  BarberDashboardPage,
} from './pages';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Helper component for root route redirection
const RootRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div className="loading-screen">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based redirection for authenticated users
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'barber') return <Navigate to="/barber" replace />;
  
  return <Navigate to="/home" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/barbers" element={<BarberListPage />} />
        <Route path="/barbers/:barberId" element={<BarberProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/booking" 
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/booking/time"
          element={
            <ProtectedRoute>
              <TimeSelectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/details"
          element={
            <ProtectedRoute>
              <BookingFlowDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/payment/:appointmentId" 
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/payment/:appointmentId/done"
          element={
            <ProtectedRoute>
              <BookingCompletePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/appointment/:appointmentId"
          element={
            <ProtectedRoute>
              <AppointmentDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review/:appointmentId"
          element={
            <ProtectedRoute>
              <ReviewBarberPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/barber"
          element={
            <ProtectedRoute requiredRole="barber">
              <BarberDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
