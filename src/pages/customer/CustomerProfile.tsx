import { useAuthStore } from '../../store/useAuthStore';
import { User, Phone, Mail, LogOut, Shield, FileText, HelpCircle, ChevronLeft } from 'lucide-react';

export function CustomerProfile() {
  const { userData, logout } = useAuthStore();

  return (
    <div className="absolute inset-0 p-4 md:p-8 max-w-xl mx-auto pb-[100px] overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-6">
        <div className="bg-[#071426] p-8 text-center relative">
          <div className="absolute inset-0 babylonian-pattern opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-[#F6C21A] rounded-3xl flex items-center justify-center text-4xl font-bold text-[#071426] mb-4 shadow-lg rotate-3">
              <span className="-rotate-3">{userData?.name ? userData.name.substring(0, 1) : 'ع'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{userData?.name}</h2>
            <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-xs font-bold flex items-center gap-1 mt-2">
              <Shield size={12} className="text-[#F6C21A]" />
               عميل موثق
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-0.5">رقم الهاتف</p>
                  <p className="font-medium text-gray-800 dir-ltr text-right">{userData?.phone || 'غير محدد'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-0.5">البريد الإلكتروني</p>
                  <p className="font-medium text-gray-800 text-sm truncate max-w-[200px]">{userData?.email || 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 text-gray-700 font-bold">
                <FileText size={20} className="text-gray-400" />
                سياسة الخصوصية
              </div>
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 text-gray-700 font-bold">
                <HelpCircle size={20} className="text-gray-400" />
                تواصل معنا
              </div>
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-4 rounded-2xl transition-colors mt-8"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
