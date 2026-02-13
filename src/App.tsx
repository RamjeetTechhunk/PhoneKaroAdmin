import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Rides from './pages/Rides';
import Ambulances from './pages/Ambulances';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/patients" /> : <Login />}
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <PatientDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <ProtectedRoute>
            <Layout>
              <Drivers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers/:id"
        element={
          <ProtectedRoute>
            <DriverDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rides"
        element={
          <ProtectedRoute>
            <Layout>
              <Rides />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ambulances"
        element={
          <ProtectedRoute>
            <Layout>
              <Ambulances />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/patients" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
