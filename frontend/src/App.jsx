import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './lib/auth';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Galleries from './pages/Galleries';
import GalleryDetail from './pages/GalleryDetail';
import Book from './pages/Book';
import Sign from './pages/Sign';
import BookingToken from './pages/BookingToken';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGalleries from './pages/admin/AdminGalleries';
import AdminGalleryDetail from './pages/admin/AdminGalleryDetail';
import AdminContracts from './pages/admin/AdminContracts';
import AdminBookings from './pages/admin/AdminBookings';
import AdminServices from './pages/admin/AdminServices';
import AdminAvailability from './pages/admin/AdminAvailability';
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
          <Route path="/galleries" element={<Galleries />} />
          <Route path="/galleries/:slug" element={<GalleryDetail />} />
          <Route path="/book" element={<Book />} />
          <Route path="/booking/:token" element={<BookingToken />} />
          <Route path="/sign/:token" element={<Sign />} />
          {/* Phase 5+: /about, /experience, /kind-words, /contact */}
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
          <Route path="galleries" element={<AdminGalleries />} />
          <Route path="galleries/:id" element={<AdminGalleryDetail />} />
          <Route path="contracts" element={<AdminContracts />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="availability" element={<AdminAvailability />} />
          {/* Phase 5+: testimonials, inquiries, settings */}
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
