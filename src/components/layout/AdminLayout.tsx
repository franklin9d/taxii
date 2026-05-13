import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, Users, Car, Settings, LogOut, Menu, X, Map, Bell } from 'lucide-react';

export function AdminLayout() {
  const { userData, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="h-[100dvh] w-full bg-bg-light flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-primary-dark text-white hidden md:flex flex-col shadow-2xl z-20 relative">
        <div className="absolute inset-0 babylonian-pattern opacity-10 pointer-events-none"></div>
        <div className="p-6 relative z-10">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-accent-gold to-accent-yellow mb-2">تكسي الطارمية</h1>
          <p className="text-gray-400 text-sm tracking-wider uppercase">لوحة الإدارة</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 relative z-10 overflow-y-auto w-full scrollbar-hide">
          <NavLink to="/admin" end onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <LayoutDashboard size={20} />
            <span className="font-medium">الرئيسية</span>
          </NavLink>
          <NavLink to="/admin/drivers" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <Car size={20} />
            <span className="font-medium">إدارة السائقين</span>
          </NavLink>
          <NavLink to="/admin/customers" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <Users size={20} />
            <span className="font-medium">إدارة العملاء</span>
          </NavLink>
          <NavLink to="/admin/rides" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <Map size={20} />
            <span className="font-medium">إدارة الرحلات</span>
          </NavLink>
          <NavLink to="/admin/settings" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <Settings size={20} />
            <span className="font-medium">التسعيرة والمناطق</span>
          </NavLink>
          <NavLink to="/admin/notifications" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <Bell size={20} />
            <span className="font-medium">الإشعارات</span>
          </NavLink>
        </nav>
        
        <div className="p-4 border-t border-white/10 relative z-10 w-full">
          <div className="flex items-center gap-3 mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-primary-dark border-2 border-accent-gold flex items-center justify-center text-accent-gold font-bold">
              {userData?.name?.substring(0, 1)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userData?.name}</p>
              <p className="text-[10px] text-accent-gold uppercase tracking-wider">مدير النظام</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors font-medium border border-transparent hover:border-red-500/20">
            <LogOut size={18} />
            تسجيل خروج
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeDrawer}></div>
          <aside className="w-64 bg-primary-dark text-white flex flex-col shadow-2xl relative">
            <button onClick={closeDrawer} className="absolute left-4 top-4 p-2 bg-white/10 rounded-full hover:bg-white/20 z-20">
               <X size={20} />
            </button>
            <div className="absolute inset-0 babylonian-pattern opacity-10 pointer-events-none"></div>
            <div className="p-6 relative z-10">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-accent-gold to-accent-yellow mb-2 mt-2">تكسي الطارمية</h1>
              <p className="text-gray-400 text-xs tracking-wider uppercase">لوحة الإدارة</p>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-2 relative z-10 overflow-y-auto w-full scrollbar-hide">
              <NavLink to="/admin" end onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5'}`}>
                <LayoutDashboard size={20} />
                <span className="font-medium text-sm">الرئيسية</span>
              </NavLink>
              <NavLink to="/admin/drivers" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5'}`}>
                <Car size={20} />
                <span className="font-medium text-sm">إدارة السائقين</span>
              </NavLink>
              <NavLink to="/admin/customers" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5'}`}>
                <Users size={20} />
                <span className="font-medium text-sm">إدارة العملاء</span>
              </NavLink>
              <NavLink to="/admin/rides" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5'}`}>
                <Map size={20} />
                <span className="font-medium text-sm">إدارة الرحلات</span>
              </NavLink>
              <NavLink to="/admin/settings" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5'}`}>
                <Settings size={20} />
                <span className="font-medium text-sm">التسعيرة والمناطق</span>
              </NavLink>
              <NavLink to="/admin/notifications" onClick={closeDrawer} className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner' : 'hover:bg-white/5'}`}>
                <Bell size={20} />
                <span className="font-medium text-sm">الإشعارات</span>
              </NavLink>
            </nav>
            <div className="p-4 border-t border-white/10 relative z-10 w-full mb-4">
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium border border-red-500/20">
                <LogOut size={18} />
                تسجيل خروج
              </button>
            </div>
          </aside>
        </div>
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <header className="bg-white p-4 shadow-sm flex md:hidden items-center justify-between border-b border-gray-200 sticky top-0 z-10">
          <button onClick={toggleDrawer} className="p-2 bg-gray-50 text-gray-700 rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform"><Menu size={20} /></button>
          <h1 className="font-bold text-primary-dark text-lg">لوحة الإدارة</h1>
          <div className="w-10 h-10 rounded-full bg-primary-dark flex items-center justify-center text-accent-gold font-bold">
            {userData?.name?.substring(0, 1) || 'أ'}
          </div>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full pb-8">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
