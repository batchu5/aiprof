import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/dashboard/Home';
import SpacesList from './pages/spaces/SpacesList';
import SpaceDetail from './pages/spaces/SpaceDetail';
import ProjectDashboard from './pages/projects/ProjectDashboard';
import TutorChat from './pages/tutor/TutorChat';
import QuizView from './pages/quiz/QuizView';
import Growth from './pages/projects/Growth';
import ProjectAnalytics from './pages/projects/ProjectAnalytics';
import Analytics from './pages/analytics/Analytics';
import AdminDashboard from './pages/admin/AdminDashboard';

export const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected App Routes wrapped in Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="spaces" element={<SpacesList />} />
              <Route path="spaces/:id" element={<SpaceDetail />} />
              <Route path="projects/:id" element={<ProjectDashboard />} />
              <Route path="projects/:id/tutor" element={<TutorChat />} />
              <Route path="projects/:id/quiz" element={<QuizView />} />
              <Route path="projects/:id/growth" element={<Growth />} />
              <Route path="projects/:id/analytics" element={<ProjectAnalytics />} />
              <Route path="analytics" element={<Analytics />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
