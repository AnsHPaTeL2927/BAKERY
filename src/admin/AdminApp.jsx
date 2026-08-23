import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ToastProvider } from './components/ToastProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './pages/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminVerify from './pages/AdminVerify';
import AdminForgotPassword from './pages/AdminForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminCategories from './pages/AdminCategories';
import AdminProducts from './pages/AdminProducts';
import AdminGallery from './pages/AdminGallery';
import AdminBanners from './pages/AdminBanners';
import AdminOffers from './pages/AdminOffers';
import AdminTestimonials from './pages/AdminTestimonials';
import AdminMessages from './pages/AdminMessages';
import AdminAbout from './pages/AdminAbout';
import AdminSettings from './pages/AdminSettings';

function protectedPage(Page) {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Page />
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/verify" element={<AdminVerify />} />
          <Route path="/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/dashboard" element={protectedPage(AdminDashboard)} />
          <Route path="/orders" element={protectedPage(AdminOrders)} />
          <Route path="/categories" element={protectedPage(AdminCategories)} />
          <Route path="/products" element={protectedPage(AdminProducts)} />
          <Route path="/gallery" element={protectedPage(AdminGallery)} />
          <Route path="/banners" element={protectedPage(AdminBanners)} />
          <Route path="/offers" element={protectedPage(AdminOffers)} />
          <Route path="/testimonials" element={protectedPage(AdminTestimonials)} />
          <Route path="/messages" element={protectedPage(AdminMessages)} />
          <Route path="/about" element={protectedPage(AdminAbout)} />
          <Route path="/settings" element={protectedPage(AdminSettings)} />
        </Routes>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
