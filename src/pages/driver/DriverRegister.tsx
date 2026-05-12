import { useAuthStore } from '../../store/useAuthStore';
import { FileText, Upload } from 'lucide-react';

export function DriverRegister() {
  const { userData } = useAuthStore();
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-accent-gold" />
          </div>
          <h2 className="text-2xl font-bold text-primary-dark">إكمال التسجيل ككابتن</h2>
          <p className="text-gray-500 mt-2">يرجى رفع المستمسكات المطلوبة للموافقة على حسابك</p>
        </div>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع السيارة</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-gold focus:border-transparent outline-none">
                <option>صالون</option>
                <option>عالية</option>
                <option>VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">موديل السيارة</label>
              <input type="text" placeholder="مثال: 2021" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-gold outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">لون السيارة</label>
            <input type="text" placeholder="أبيض، أسود..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-gold outline-none" />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-bold text-primary-dark mb-4">المستمسكات المطلوبة</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">البطاقة الوطنية / هوية الأحوال</p>
                <p className="text-xs text-gray-500 mt-1">اضغط للرفع أو اسحب الملف هنا</p>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">إجازة السوق</p>
                <p className="text-xs text-gray-500 mt-1">اضغط للرفع أو اسحب الملف هنا</p>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">سنوية السيارة</p>
                <p className="text-xs text-gray-500 mt-1">اضغط للرفع أو اسحب الملف هنا</p>
              </div>
            </div>
          </div>
          
          <button type="button" className="w-full bg-primary-dark hover:bg-opacity-90 text-white font-bold py-4 rounded-xl shadow-md transition-all">
            إرسال الطلب للمراجعة
          </button>
        </form>
      </div>
    </div>
  );
}
