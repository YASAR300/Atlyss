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
import AttendanceManagement from './pages/admin/AttendanceManagement';
import Classes from './pages/Classes';
import Workouts from './pages/Workouts';
import ManageWorkouts from './pages/trainer/ManageWorkouts';
import TrainerProfile from './pages/trainer/TrainerProfile';
import TrainerProfileEdit from './pages/trainer/TrainerProfileEdit';
import MemberMeasurements from './pages/trainer/MemberMeasurements';
import MyMeasurements from './pages/member/MyMeasurements';
import MemberProfile from './pages/member/MemberProfile';
import MemberProgress from './pages/member/MemberProgress';
import AdminProfile from './pages/admin/AdminProfile';
import AttendancePage from './pages/AttendancePage';
import DietPlan from './pages/member/DietPlan';
import ManageDiets from './pages/trainer/ManageDiets';
import CalorieCalculatorPage from './pages/member/CalorieCalculatorPage';

const ProfileRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/profile" replace />;
  if (user.role === 'trainer') return <Navigate to="/trainer/profile" replace />;
  return <Navigate to="/member/profile" replace />;
};

import AttendanceKiosk from './pages/AttendanceKiosk';

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
          <Route path="/attendance-kiosk" element={<AttendanceKiosk />} />

          {/* Admin */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute roles={['admin']}>
              <AdminProfile />
            </ProtectedRoute>
          } />
          <Route path="/members" element={
            <ProtectedRoute roles={['admin', 'trainer']}>
              <Members />
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance" element={
            <ProtectedRoute roles={['admin']}>
              <AttendanceManagement />
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
          <Route path="/trainer/profile" element={
            <ProtectedRoute roles={['trainer']}>
              <TrainerProfile />
            </ProtectedRoute>
          } />
          <Route path="/trainer/profile/edit" element={
            <ProtectedRoute roles={['trainer']}>
              <TrainerProfileEdit />
            </ProtectedRoute>
          } />
          <Route path="/trainers/:id/profile" element={
            <ProtectedRoute roles={['admin']}>
              <TrainerProfile />
            </ProtectedRoute>
          } />
          <Route path="/trainer/members/:memberId/measurements" element={
            <ProtectedRoute roles={['trainer']}>
              <MemberMeasurements />
            </ProtectedRoute>
          } />

          {/* Member */}
          <Route path="/dashboard/member" element={
            <ProtectedRoute roles={['member']}>
              <MemberDashboard />
            </ProtectedRoute>
          } />
          <Route path="/member/profile" element={
            <ProtectedRoute roles={['member']}>
              <MemberProfile />
            </ProtectedRoute>
          } />
          <Route path="/my-measurements" element={
            <ProtectedRoute roles={['member']}>
              <MyMeasurements />
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute roles={['member']}>
              <MemberProgress />
            </ProtectedRoute>
          } />
          <Route path="/calorie-calculator" element={
            <ProtectedRoute roles={['member']}>
              <CalorieCalculatorPage />
            </ProtectedRoute>
          } />
          <Route path="/trainer/members/:memberId/progress" element={
            <ProtectedRoute roles={['trainer']}>
              <MemberProgress />
            </ProtectedRoute>
          } />

          {/* Shared */}
          <Route path="/classes" element={
            <ProtectedRoute>
              <Classes />
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          } />
          <Route path="/workouts" element={
            <ProtectedRoute>
              <Workouts />
            </ProtectedRoute>
          } />
          <Route path="/diet-plan" element={
            <ProtectedRoute roles={['member']}>
              <DietPlan />
            </ProtectedRoute>
          } />
          <Route path="/manage-diets" element={
            <ProtectedRoute roles={['trainer', 'admin']}>
              <ManageDiets />
            </ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="/profile" element={<ProfileRedirect />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
