import { Users, Car, Map, CheckCircle } from 'lucide-react';

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary-dark tracking-tight">نظرة عامة على النظام</h2>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-blue-500 flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">العملاء النشطون</p>
            <h3 className="text-4xl font-black text-primary-dark">0</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-500 border border-blue-100">
            <Users size={28} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-green-500 flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">السائقين المتاحين</p>
            <h3 className="text-4xl font-black text-primary-dark">0</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-green-50/50 flex items-center justify-center text-green-500 border border-green-100">
            <Car size={28} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-accent-gold flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">الرحلات النشطة</p>
            <h3 className="text-4xl font-black text-primary-dark">0</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-accent-yellow/10 flex items-center justify-center text-accent-gold border border-accent-yellow/20">
            <Map size={28} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-orange-500 flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">بانتظار الموافقة</p>
            <h3 className="text-4xl font-black text-primary-dark">0</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-orange-50/50 flex items-center justify-center text-orange-500 border border-orange-100">
            <CheckCircle size={28} />
          </div>
        </div>
      </div>
      
      {/* Empty States for details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-lg text-primary-dark flex items-center gap-2">
              <span className="w-2 h-6 bg-accent-gold rounded-full inline-block"></span>
              أحدث الرحلات
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Map className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد رحلات حالياً</p>
              <p className="text-gray-400 text-sm mt-2">ستظهر الرحلات الجديدة هنا فور بدئها</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-lg text-primary-dark flex items-center gap-2">
              <span className="w-2 h-6 bg-accent-gold rounded-full inline-block"></span>
              السائقين المسجلين حديثاً
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">لم يتم تسجيل أي سائق بعد</p>
              <p className="text-gray-400 text-sm mt-2">السائقون الجدد الجاهزون للتفعيل سيظهرون هنا</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
