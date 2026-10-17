import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppShell } from './components/common/AppShell';
import { Loader2 } from 'lucide-react';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { AdvisoryPage } from './pages/AdvisoryPage';
import { PestDiagnosisPage } from './pages/PestDiagnosisPage';
import { CropSuitabilityPage } from './pages/CropSuitabilityPage';
import { AdvisoryHistoryPage } from './pages/AdvisoryHistoryPage';
import { DocumentsListPage } from './pages/DocumentsListPage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { DocumentReviewPage } from './pages/DocumentReviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Route Guard protecting authenticated routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs font-medium tracking-wide">Validating session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppShell>{children}</AppShell>;
};

// Route Guard redirecting already logged-in users away from auth pages
const PublicAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicAuthRoute>
                    <LoginPage />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicAuthRoute>
                    <SignUpPage />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicAuthRoute>
                    <ForgotPasswordPage />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicAuthRoute>
                    <ResetPasswordPage />
                  </PublicAuthRoute>
                }
              />

              {/* Protected Agricultural Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farms"
                element={
                  <ProtectedRoute>
                    <FarmsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advisory"
                element={
                  <ProtectedRoute>
                    <AdvisoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pest-diagnosis"
                element={
                  <ProtectedRoute>
                    <PestDiagnosisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crop-suitability"
                element={
                  <ProtectedRoute>
                    <CropSuitabilityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <AdvisoryHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Intelligent Document Processing Routes */}
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <DocumentsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents/new"
                element={
                  <ProtectedRoute>
                    <DocumentUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents/:id"
                element={
                  <ProtectedRoute>
                    <DocumentDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents/:id/review"
                element={
                  <ProtectedRoute>
                    <DocumentReviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Settings Route */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All Route */}
              <Route
                path="*"
                element={
                  <AppShell>
                    <NotFoundPage />
                  </AppShell>
                }
              />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};
