{/* Updated App.tsx with new routes */}
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OrganizationDashboard from './pages/organization/Dashboard';
import OrganizationCalendar from './pages/organization/CalendarManagement';
import OrganizationAppointments from './pages/organization/AppointmentManagement';
import OrganizationSettings from './pages/organization/Settings';
import OrganizationAnalytics from './pages/organization/Analytics';
import IndividualDashboard from './pages/individual/Dashboard';
import IndividualProfile from './pages/individual/Profile';
import BookAppointment from './pages/individual/BookAppointment';
import AppointmentDetails from './pages/individual/AppointmentDetails';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route element={<Layout />}>
            <Route path="/organization" element={
              <ProtectedRoute role="organization">
                <OrganizationDashboard />
              </ProtectedRoute>
            } />
            <Route path="/organization/calendar" element={
              <ProtectedRoute role="organization">
                <OrganizationCalendar />
              </ProtectedRoute>
            } />
            <Route path="/organization/appointments" element={
              <ProtectedRoute role="organization">
                <OrganizationAppointments />
              </ProtectedRoute>
            } />
            <Route path="/organization/settings" element={
              <ProtectedRoute role="organization">
                <OrganizationSettings />
              </ProtectedRoute>
            } />
            <Route path="/organization/analytics" element={
              <ProtectedRoute role="organization">
                <OrganizationAnalytics />
              </ProtectedRoute>
            } />
            
            <Route path="/individual" element={
              <ProtectedRoute role="individual">
                <IndividualDashboard />
              </ProtectedRoute>
            } />
            <Route path="/individual/profile" element={
              <ProtectedRoute role="individual">
                <IndividualProfile />
              </ProtectedRoute>
            } />
            <Route path="/individual/book" element={
              <ProtectedRoute role="individual">
                <BookAppointment />
              </ProtectedRoute>
            } />
            <Route path="/individual/appointments/:id" element={
              <ProtectedRoute role="individual">
                <AppointmentDetails />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;