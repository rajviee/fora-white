import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskCreate from './pages/TaskCreate';
import TaskDetail from './pages/TaskDetail';
import Chat from './pages/Chat';
import Attendance from './pages/Attendance';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/EmployeeProfile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="tasks/create" element={<TaskCreate />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="chat" element={<Chat />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/:id" element={<EmployeeProfile />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
