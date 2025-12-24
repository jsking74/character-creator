import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CharactersPage } from './pages/CharactersPage';
import { ViewCharacterPage } from './pages/ViewCharacterPage';
import { EditCharacterPage } from './pages/EditCharacterPage';
import { BrowseCharactersPage } from './pages/BrowseCharactersPage';
import { SharedCharacterPage } from './pages/SharedCharacterPage';
import { PartiesPage } from './pages/PartiesPage';
import { ViewPartyPage } from './pages/ViewPartyPage';
import { EditPartyPage } from './pages/EditPartyPage';
import { SystemsManagementPage } from './pages/SystemsManagementPage';
import { CreateSystemPage } from './pages/CreateSystemPage';
import { EditSystemPage } from './pages/EditSystemPage';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />
        <Route path="/browse" element={<BrowseCharactersPage />} />
        <Route path="/browse/characters/:id" element={<BrowseCharactersPage />} />
        <Route path="/shared/:token" element={<SharedCharacterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/characters"
          element={
            <ProtectedRoute>
              <CharactersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/characters/:id"
          element={
            <ProtectedRoute>
              <ViewCharacterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/characters/:id/edit"
          element={
            <ProtectedRoute>
              <EditCharacterPage />
            </ProtectedRoute>
          }
        />

        {/* Party routes */}
        <Route
          path="/parties"
          element={
            <ProtectedRoute>
              <PartiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parties/:id"
          element={
            <ProtectedRoute>
              <ViewPartyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parties/:id/edit"
          element={
            <ProtectedRoute>
              <EditPartyPage />
            </ProtectedRoute>
          }
        />

        {/* System management routes */}
        <Route
          path="/systems"
          element={
            <ProtectedRoute>
              <SystemsManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/systems/new"
          element={
            <ProtectedRoute>
              <CreateSystemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/systems/:id/edit"
          element={
            <ProtectedRoute>
              <EditSystemPage />
            </ProtectedRoute>
          }
        />

        {/* Default route */}
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
