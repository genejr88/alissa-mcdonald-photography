import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './lib/auth';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          {/* Phase 2+: /galleries, /galleries/:slug, /about, /experience,
              /kind-words, /book, /contact, /sign/:token, /booking/:token */}
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          {/* Phase 2+: galleries, services, availability, bookings,
              contracts, testimonials, inquiries, settings */}
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
