import { useState, useEffect } from 'react';
import { useAuthStore, Role } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen bg-primary-dark text-bg-light font-sans relative overflow-hidden">
      <div className="absolute inset-0 babylonian-pattern opacity-10"></div>
      
      {/* Background Decor */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-luxury-black/50 to-transparent pointer-events-none z-0"></div>
      <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-accent-gold/5 to-transparent pointer-events-none z-0"></div>
      
      <main className="relative z-10 container mx-auto px-6 py-12 lg:py-24 flex flex-col items-center text-center">
        <div className="mb-8 p-4 rounded-full bg-accent-gold/10 border border-accent-gold/30">
          <svg className="w-16 h-16 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight text-white">
          تكسي الطارمية
        </h1>
        <p className="text-lg md:text-2xl mb-12 text-gray-light max-w-2xl font-light">
          أسرع وأكثر حلاً أماناً للتنقل داخل الطارمية والمناطق القريبة. تصميم معاصر بروح بابلية.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button 
            onClick={() => handleLogin('customer')}
            disabled={!!loadingRole}
            className="flex-1 bg-accent-yellow hover:bg-[#F2BD23] text-primary-dark font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform active:scale-95"
          >
            {loadingRole === 'customer' ? 'جاري التحميل...' : 'احجز رحلتك الآن'}
          </button>
          
          <button 
            onClick={() => handleLogin('driver')}
            disabled={!!loadingRole}
            className="flex-1 bg-transparent hover:bg-white/5 text-accent-gold border border-accent-gold/50 hover:border-accent-gold font-bold py-4 px-8 rounded-xl transition-all transform active:scale-95"
          >
            {loadingRole === 'driver' ? 'جاري التحميل...' : 'انضم كسائق'}
          </button>
        </div>
        
        <button 
          onClick={() => handleLogin('admin')}
          disabled={!!loadingRole}
          className="mt-12 text-xs text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
        >
          دخول الإدارة
        </button>
      </main>
    </div>
  );
}
