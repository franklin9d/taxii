import { useState, useEffect } from 'react';
import { useAuthStore, Role } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { CarFront, Loader2 } from 'lucide-react';

export function LandingPage() {
  const { signInWithGoogle, user, userData } = useAuthStore();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);

  const handleLogin = async (role: Role) => {
    setLoadingRole(role);
    await signInWithGoogle(role);
    setLoadingRole(null);
  };

  useEffect(() => {
    if (user && userData) {
      if (userData.role === 'customer') navigate('/customer');
      if (userData.role === 'driver') navigate('/driver');
      if (userData.role === 'admin') navigate('/admin');
    }
  }, [user, userData, navigate]);

  return (
    <div className="min-h-screen bg-[#071426] text-[#F8FAFC] flex flex-col justify-center relative overflow-hidden px-6">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F6C21A]/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F6C21A]/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

      <main className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-[#F6C21A] text-[#071426] rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(246,194,26,0.3)] transform -rotate-6">
          <svg className="w-12 h-12 rotate-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-white">
          تكسي الطارمية
        </h1>
        <p className="text-[#E5E7EB] text-lg mb-12 max-w-xs leading-relaxed opacity-90">
          احجز رحلتك داخل الطارمية والمناطق القريبة بسرعة وأمان.
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={() => handleLogin('customer')}
            disabled={!!loadingRole}
            className="w-full bg-[#F6C21A] hover:bg-[#E5B20E] text-[#111827] font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            {loadingRole === 'customer' ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.36,22 12.2,22C17.53,22 22,18.33 22,12C22,11.36 21.35,11.1 21.35,11.1Z" />
                </svg>
                تسجيل الدخول كراكب
              </>
            )}
          </button>
          
          <button 
            onClick={() => handleLogin('driver')}
            disabled={!!loadingRole}
            className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg backdrop-blur-sm"
          >
            {loadingRole === 'driver' ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <CarFront className="w-6 h-6" />
                انضم ككابتن
              </>
            )}
          </button>
        </div>

        <button 
          onClick={() => handleLogin('admin')}
          disabled={!!loadingRole}
          className="mt-12 text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          دخول الإدارة
        </button>
      </main>
    </div>
  );
}
