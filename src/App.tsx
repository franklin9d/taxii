import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { LandingPage } from './pages/LandingPage';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { DriverLayout } from './components/layout/DriverLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';

// Driver Pages
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DriverRegister } from './pages/driver/DriverRegister';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Customer Routes */}
        <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout /></ProtectedRoute>}>
          <Route index element={<CustomerDashboard />} />
        </Route>
        
        {/* Driver Routes */}
        <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><DriverLayout /></ProtectedRoute>}>
          <Route index element={<DriverDashboard />} />
          <Route path="register" element={<DriverRegister />} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
