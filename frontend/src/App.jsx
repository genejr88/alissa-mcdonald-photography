import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './lib/auth';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Galleries from './pages/Galleries';
import GalleryDetail from './pages/GalleryDetail';
import About from './pages/About';
import Experience from './pages/Experience';
import KindWords from './pages/KindWords';
import Contact from './pages/Contact';
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
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/galleries" element={<Galleries />} />
          <Route path="/galleries/:slug" element={<GalleryDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/kind-words" element={<KindWords />} />
          <Route path="/contact" element={<Contact />} />
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
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
