import { useAuthStore } from '../../store/useAuthStore';
import { User, Phone, Mail, LogOut, Shield, Car, CheckCircle, XCircle } from 'lucide-react';

export function DriverProfile() {
  const { userData, logout } = useAuthStore();

  return (
    <div className="absolute inset-0 p-4 md:p-8 max-w-xl mx-auto pb-[100px] overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-primary-dark p-8 text-center relative">
          <div className="absolute inset-0 babylonian-pattern opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-accent-gold mb-4 border-4 border-accent-gold shadow-lg overflow-hidden">
              {userData?.documents?.personalPhotoUrl ? (
                <img src={userData.documents.personalPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{userData?.name ? userData.name.substring(0, 1) : 'ك'}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{userData?.name}</h2>
            <div className="flex gap-2 justify-center mt-2">
              <div className="px-3 py-1 bg-accent-gold/20 backdrop-blur-sm rounded-full text-accent-gold text-xs font-bold flex items-center gap-1">
                <Shield size={12} />
                كابتن مسجل
              </div>
              <div className={`px-3 py-1 backdrop-blur-sm rounded-full text-xs font-bold flex items-center gap-1 ${
                userData?.status === 'active' ? 'bg-green-500/20 text-green-400' :
                userData?.status === 'pending_approval' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {userData?.status === 'active' && <><CheckCircle size={12} /> مفعل</>}
                {userData?.status === 'pending_approval' && <><CheckCircle size={12} /> قيد المراجعة</>}
                {userData?.status === 'suspended' && <><XCircle size={12} /> محظور</>}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold mb-0.5">الاسم الكامل</p>
                <p className="font-medium text-gray-800">{userData?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold mb-0.5">البريد الإلكتروني</p>
                <p className="font-medium text-gray-800">{userData?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold mb-0.5">رقم الهاتف</p>
                <p className="font-medium text-gray-800">{userData?.phone || 'غير محدد'}</p>
              </div>
            </div>
            
            {userData?.driverInfo && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                  <Car size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-0.5">تفاصيل السيارة</p>
                  <p className="font-medium text-gray-800">
                    {userData.driverInfo.carType} - {userData.driverInfo.carModel} ({userData.driverInfo.carColor})
                  </p>
                  <p className="text-xs text-gray-500 font-bold mt-1">اللوحة: <span className="text-gray-800 text-sm tracking-widest">{userData.driverInfo.carNumber}</span></p>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-4 rounded-xl transition-colors mt-8"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
