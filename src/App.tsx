import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import { LandingPage } from './pages/LandingPage';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { DriverLayout } from './components/layout/DriverLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerHistory } from './pages/customer/CustomerHistory';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Driver Pages
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DriverRegister } from './pages/driver/DriverRegister';
import { DriverProfile } from './pages/driver/DriverProfile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDrivers } from './pages/admin/AdminDrivers';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminRides } from './pages/admin/AdminRides';
import { AdminSettings } from './pages/admin/AdminSettings';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-gray-50 flex-col text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">عذراً، حدث خطأ ما!</h2>
      <p className="text-gray-600 mb-6 max-w-md">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="px-6 py-3 bg-primary-dark text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) {
  const { user, userData, initialized } = useAuthStore();
  
  if (!initialized) {
    return <div className="h-screen w-full flex items-center justify-center bg-bg-light">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-gold"></div>
    </div>;
  }
  
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'inherit' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* Customer Routes */}
          <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout /></ProtectedRoute>}>
            <Route index element={<CustomerDashboard />} />
            <Route path="book" element={<CustomerDashboard />} />
            <Route path="history" element={<CustomerHistory />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>
          
          {/* Driver Routes */}
          <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><DriverLayout /></ProtectedRoute>}>
            <Route index element={<DriverDashboard />} />
            <Route path="active" element={<DriverDashboard />} />
            <Route path="register" element={<DriverRegister />} />
            <Route path="history" element={<div className="p-4 text-center mt-10">رحلاتي السابقة - قريباً</div>} />
            <Route path="earnings" element={<div className="p-4 text-center mt-10">الأرباح - قريباً</div>} />
            <Route path="profile" element={<DriverProfile />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="rides" element={<AdminRides />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="notifications" element={<div className="p-16 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center"><div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">🔔</span></div><p className="font-bold text-lg mb-2">نظام الإشعارات قيد التطوير</p><p>سيتم إضافة ميزة إرسال الإشعارات المباشرة للسائقين والعملاء قريباً</p></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
