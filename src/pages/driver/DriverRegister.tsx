import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function DriverRegister() {
  const { userData } = useAuthStore();
  const [carType, setCarType] = useState('صالون');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.id) return;
    
    setLoading(true);
    setErrorStatus(null);
    try {
      await updateDoc(doc(db, 'users', userData.id), {
        driverInfo: {
          carType,
          carModel,
          carColor,
        },
        driverApproved: false, // Wait for admin to approve
        status: 'pending_approval'
      });
      setSubmitted(true);
    } catch (e: any) {
      console.error(e);
      setErrorStatus(e.message || 'حدث خطأ. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted || userData?.status === 'pending_approval') {
    return (
      <div className="absolute inset-0 p-6 max-w-2xl mx-auto text-center flex flex-col justify-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-primary-dark mb-2">تم استلام طلبك بنجاح!</h2>
        <p className="text-gray-500">جاري مراجعة طلبك من قبل الإدارة. سيتم إشعارك فور الموافقة على حسابك لتبدأ باستقبال الطلبات.</p>
      </div>
    );
  }
  
  return (
    <div className="absolute inset-0 p-6 w-full max-w-2xl mx-auto pb-24 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-accent-gold" />
          </div>
          <h2 className="text-2xl font-bold text-primary-dark">إكمال التسجيل ككابتن</h2>
          <p className="text-gray-500 mt-2">يرجى رفع المستمسكات المطلوبة للموافقة على حسابك</p>
        </div>
        
        {errorStatus && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold">
            {errorStatus}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع السيارة</label>
              <select 
                value={carType}
                onChange={e => setCarType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-gold focus:border-transparent outline-none"
              >
                <option>صالون</option>
                <option>عالية</option>
                <option>VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">موديل/سنة الصنع</label>
              <input 
                type="text" 
                required
                value={carModel}
                onChange={e => setCarModel(e.target.value)}
                placeholder="مثال: 2021" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-gold outline-none" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">لون السيارة</label>
            <input 
               type="text" 
               required
               value={carColor}
               onChange={e => setCarColor(e.target.value)}
               placeholder="أبيض، أسود..." 
               className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-gold outline-none" 
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-bold text-primary-dark mb-4">المستمسكات المطلوبة</h3>
            <div className="space-y-4">
              {/* Optional UI for uploading images since we don't have Storage setup properly with rules in this MVP, we will just use placeholders for now */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">البطاقة الوطنية / هوية الأحوال</p>
                <p className="text-xs text-gray-500 mt-1">اضغط للرفع أو اسحب الملف هنا</p>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">إجازة السوق</p>
                <p className="text-xs text-gray-500 mt-1">اضغط للرفع أو اسحب الملف هنا</p>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">سنوية السيارة</p>
                <p className="text-xs text-gray-500 mt-1">اضغط للرفع أو اسحب الملف هنا</p>
              </div>
            </div>
          </div>
          
          <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-primary-dark disabled:opacity-50 hover:bg-opacity-90 text-white font-bold py-4 rounded-xl shadow-md transition-all"
          >
             {loading ? 'جاري الإرسال...' : 'إرسال الطلب للمراجعة'}
          </button>
        </form>
      </div>
    </div>
  );
}
