import { useState, useEffect } from 'react';
import { useAuthStore, Role } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { CarFront, Loader2, MapPin, Navigation, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* Dynamic Background Patterns */}
      <div className="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-b from-[#071426] to-[#0a1f3b] skew-y-6 origin-top-right transform -translate-y-10 z-0 shadow-2xl"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#F6C21A]/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2 z-0"></div>

      <main className="relative z-10 w-full max-w-md mx-auto flex flex-col px-6 py-12 flex-1 justify-center">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-10 mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#F6C21A] blur-xl opacity-40 rounded-full"></div>
            <div className="w-28 h-28 bg-gradient-to-tr from-[#E5B20E] to-[#F6C21A] text-[#071426] rounded-3xl flex items-center justify-center shadow-lg transform -rotate-3 relative z-10">
              <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md z-20">
              <ShieldCheck className="w-6 h-6 text-green-500" />
            </div>
          </div>
          
          <h1 className="text-4xl font-extrabold mb-3 text-white tracking-tight drop-shadow-md">
            تكسي الطارمية
          </h1>
          <p className="text-blue-100 text-lg max-w-xs leading-relaxed opacity-90 font-medium">
            رحلات آمنة وموثوقة منطقتك أقرب إلك.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-4 mb-10 w-full px-2">
           <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shadow-lg">
             <MapPin className="w-6 h-6 text-[#F6C21A] mx-auto mb-2" />
             <p className="text-white font-bold text-sm">تغطية شاملة</p>
           </div>
           <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shadow-lg">
             <Navigation className="w-6 h-6 text-[#F6C21A] mx-auto mb-2" />
             <p className="text-white font-bold text-sm">وصول سريع</p>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4 px-2">
          <button 
            onClick={() => handleLogin('customer')}
            disabled={!!loadingRole}
            className="group relative w-full bg-white hover:bg-gray-50 text-[#071426] font-bold py-4 px-6 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-between overflow-hidden"
          >
            <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent to-black/5 transform skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.36,22 12.2,22C17.53,22 22,18.33 22,12C22,11.36 21.35,11.1 21.35,11.1Z" />
                </svg>
              </div>
              <span className="text-lg">دخول كـ راكب</span>
            </div>
            {loadingRole === 'customer' ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <span className="text-gray-400 group-hover:text-[#071426] transition-colors">&larr;</span>}
          </button>
          
          <button 
            onClick={() => handleLogin('driver')}
            disabled={!!loadingRole}
            className="group w-full bg-[#071426] hover:bg-[#0a1f3b] border-2 border-[#162a45] text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#162a45] rounded-full flex items-center justify-center text-[#F6C21A]">
                <CarFront className="w-5 h-5" />
              </div>
              <span className="text-lg">دخول كـ كابتن</span>
            </div>
            {loadingRole === 'driver' ? <Loader2 className="w-5 h-5 animate-spin text-[#F6C21A]" /> : <span className="text-[#162a45] group-hover:text-[#F6C21A] transition-colors">&larr;</span>}
          </button>
        </div>

        <button 
          onClick={() => handleLogin('admin')}
          disabled={!!loadingRole}
          className="mt-10 mx-auto w-fit text-sm font-bold text-gray-400 hover:text-gray-600 border-b border-transparent hover:border-gray-400 transition-all flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" /> لوحة الإدارة
        </button>
      </main>
    </div>
  );
}
