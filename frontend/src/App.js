import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProjectsPage from "./pages/ProjectsPage";
import UploadPage from "./pages/UploadPage";
import LiteratureSearchPage from "./pages/LiteratureSearchPage";
import ManuscriptPage from "./pages/ManuscriptPage";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (user) return <Navigate to="/projects" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route path="/project/:projectId/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="/project/:projectId/search" element={<ProtectedRoute><LiteratureSearchPage /></ProtectedRoute>} />
      <Route path="/project/:projectId/manuscript" element={<ProtectedRoute><ManuscriptPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}
