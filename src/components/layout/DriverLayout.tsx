import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Home, Car, History, User } from 'lucide-react';

export function DriverLayout() {
  const { userData } = useAuthStore();

  return (
    <div className="h-screen w-full bg-bg-light flex flex-col">
      <header className="h-16 border-b border-gray-200 bg-white px-4 md:px-8 flex items-center justify-between z-10 top-0 sticky">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium bg-accent-yellow/10 px-3 py-1 rounded-full text-primary-dark border border-accent-yellow/30">
            تكسي الطارمية (كابتن)
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-gray-200 pr-4">
            <div className="hidden md:block text-right">
              <div className="text-sm font-bold">{userData?.name}</div>
              <div className="text-[10px] text-gray-500 uppercase">كابتن</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-dark border-2 border-accent-gold flex items-center justify-center text-accent-gold font-bold">
              {userData?.name?.substring(0, 1) || 'س'}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden pb-16 md:pb-0 relative">
        <Outlet />
      </main>
      
      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50 rounded-t-2xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <NavLink to="/driver" end className={({isActive}) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-accent-gold translate-y-[-2px]' : 'text-gray-400 hover:text-gray-600'}`}>
          {({isActive}) => (
            <>
              <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-bold">الرئيسية</span>
            </>
          )}
        </NavLink>
        <NavLink to="/driver/active" className={({isActive}) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-accent-gold translate-y-[-2px]' : 'text-gray-400 hover:text-gray-600'}`}>
          {({isActive}) => (
            <>
              <Car size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-bold">رحلة</span>
            </>
          )}
        </NavLink>
        <NavLink to="/driver/history" className={({isActive}) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-accent-gold translate-y-[-2px]' : 'text-gray-400 hover:text-gray-600'}`}>
          {({isActive}) => (
            <>
              <History size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-bold">الرحلات</span>
            </>
          )}
        </NavLink>
        <NavLink to="/driver/profile" className={({isActive}) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-accent-gold translate-y-[-2px]' : 'text-gray-400 hover:text-gray-600'}`}>
          {({isActive}) => (
            <>
              <User size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-bold">حسابي</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
