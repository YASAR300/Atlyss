import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import MemberDashboard from './pages/member/MemberDashboard';
import Members from './pages/admin/Members';
import Trainers from './pages/admin/Trainers';
import Classes from './pages/Classes';
import Workouts from './pages/Workouts';
import ManageWorkouts from './pages/trainer/ManageWorkouts';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #272727',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/members" element={
            <ProtectedRoute roles={['admin', 'trainer']}>
              <Members />
            </ProtectedRoute>
          } />
          <Route path="/trainers" element={
            <ProtectedRoute roles={['admin', 'trainer', 'member']}>
              <Trainers />
            </ProtectedRoute>
          } />

          {/* Trainer */}
          <Route path="/dashboard/trainer" element={
            <ProtectedRoute roles={['trainer']}>
              <TrainerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manage-workouts" element={
            <ProtectedRoute roles={['trainer', 'admin']}>
              <ManageWorkouts />
            </ProtectedRoute>
          } />

          {/* Member */}
          <Route path="/dashboard/member" element={
            <ProtectedRoute roles={['member']}>
              <MemberDashboard />
            </ProtectedRoute>
          } />

          {/* Shared */}
          <Route path="/classes" element={
            <ProtectedRoute>
              <Classes />
            </ProtectedRoute>
          } />
          <Route path="/workouts" element={
            <ProtectedRoute>
              <Workouts />
            </ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
