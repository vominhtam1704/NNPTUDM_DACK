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
  LoginPage,
  SignupPage,
  BookingPage,
  TimeSelectionPage,
  BookingDetailsPage,
  PaymentPage,
  BookingCompletePage,
  ReviewBarberPage,
  ProfilePage,
  AdminDashboardPage,
} from './pages';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/barbers/:barberId" element={<BarberProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

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
              <BookingDetailsPage />
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
              <BookingDetailsPage />
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
