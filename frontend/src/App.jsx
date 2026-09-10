import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Loading from './components/common/Loading';
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
import Analytics from './pages/analytics/Analytics';
import AdminDashboard from './pages/admin/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen message="Verifying authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

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

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
