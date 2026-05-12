import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, Users, UserCheck, Car, Settings, LogOut } from 'lucide-react';

export function AdminLayout() {
  const { userData, logout } = useAuthStore();

  return (
    <div className="h-screen w-full bg-bg-light flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-primary-dark text-white hidden md:flex flex-col shadow-2xl z-10 border-l border-white/5 relative">
        <div className="absolute inset-0 babylonian-pattern opacity-10 pointer-events-none"></div>
        <div className="p-6 relative z-10">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-accent-gold to-accent-yellow mb-2">تكسي الطارمية</h1>
          <p className="text-gray-400 text-sm tracking-wider uppercase">لوحة الإدارة</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 relative z-10">
          <NavLink to="/admin" end className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner border border-white/5' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <LayoutDashboard size={20} />
            <span className="font-medium">الرئيسية</span>
          </NavLink>
          <NavLink to="/admin/customers" className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner border border-white/5' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <Users size={20} />
            <span className="font-medium">العملاء</span>
          </NavLink>
          <NavLink to="/admin/drivers" className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner border border-white/5' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <Car size={20} />
            <span className="font-medium">السائقين</span>
          </NavLink>
          <NavLink to="/admin/approvals" className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner border border-white/5' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <UserCheck size={20} />
            <span className="font-medium">طلبات الموافقة</span>
          </NavLink>
          <NavLink to="/admin/settings" className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-accent-gold shadow-inner border border-white/5' : 'hover:bg-white/5 hover:translate-x-[-4px]'}`}>
            <Settings size={20} />
            <span className="font-medium">الإعدادات</span>
          </NavLink>
        </nav>
        
        <div className="p-4 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-3 mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-primary-dark border-2 border-accent-gold flex items-center justify-center text-accent-gold font-bold">
              {userData?.name?.substring(0, 1)}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{userData?.name}</p>
              <p className="text-[10px] text-accent-gold uppercase tracking-wider">مدير النظام</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors font-medium border border-transparent hover:border-red-500/20">
            <LogOut size={18} />
            تسجيل خروج
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
        <header className="bg-white p-4 shadow-sm flex md:hidden items-center justify-between border-b border-gray-200">
          <h1 className="font-bold text-primary-dark text-lg">لوحة الإدارة</h1>
          <button onClick={logout} className="text-red-500 p-2"><LogOut size={20} /></button>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
