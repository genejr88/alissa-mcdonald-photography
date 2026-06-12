import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './lib/auth';
import Splash from './pages/Splash';

// ── Pre-launch splash gate ────────────────────────────────────────────────────
// While true, visitors see the splash page instead of the site. Visiting /loop
// once unlocks the full demo on that browser. Admin, contract-signing, and
// booking-status links always bypass the gate.
// AT LAUNCH: set this to false and the whole gate disappears.
const SPLASH_ENABLED = false;

const PREVIEW_KEY = 'amp_preview';

function UnlockPreview() {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.setItem(PREVIEW_KEY, '1');
    navigate('/', { replace: true });
  }, [navigate]);
  return null;
}
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Galleries from './pages/Galleries';
import GalleryDetail from './pages/GalleryDetail';
import About from './pages/About';
import Experience from './pages/Experience';
import KindWords from './pages/KindWords';
import Contact from './pages/Contact';
import Guestbook from './pages/Guestbook';
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
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminGuestbook from './pages/admin/AdminGuestbook';
import AdminUsers from './pages/admin/AdminUsers';
import NotFound from './pages/NotFound';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();

  // Splash gate — public pages show the splash until /loop unlocks this browser
  const path = location.pathname;
  const bypassesSplash =
    path.startsWith('/admin') ||
    path.startsWith('/sign/') ||
    path.startsWith('/booking/') ||
    path === '/loop';
  const previewUnlocked =
    typeof localStorage !== 'undefined' && localStorage.getItem(PREVIEW_KEY) === '1';
  if (SPLASH_ENABLED && !previewUnlocked && !bypassesSplash) {
    return <Splash />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/loop" element={<UnlockPreview />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/galleries" element={<Galleries />} />
          <Route path="/galleries/:slug" element={<GalleryDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/kind-words" element={<KindWords />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/guest-book" element={<Guestbook />} />
          <Route path="/book" element={<Book />} />
          <Route path="/booking/:token" element={<BookingToken />} />
          <Route path="/sign/:token" element={<Sign />} />
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
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="guestbook" element={<AdminGuestbook />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
