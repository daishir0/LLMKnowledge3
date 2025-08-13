import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Prompts from './pages/Prompts';
import Records from './pages/Records';
import Knowledge from './pages/Knowledge';
import Tasks from './pages/Tasks';
import Matrix from './pages/Matrix';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/home" replace />} />
                      <Route path="/home" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/groups" element={<Groups />} />
                      <Route path="/prompts" element={<Prompts />} />
                      <Route path="/records" element={<Records />} />
                      <Route path="/knowledge" element={<Knowledge />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/matrix" element={<Matrix />} />
                      <Route path="/admin" element={<Admin />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
