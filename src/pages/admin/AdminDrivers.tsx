import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { X, CheckCircle, Car, User, Phone, MapPin, StopCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminDrivers() {
  const [activeTab, setActiveTab] = useState('pending_approval');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    // We only fetch users who have a driverInfo object, meaning they applied or are drivers.
    const q = query(
      collection(db, 'users'),
      where('status', '==', activeTab) // Make sure we properly query by status. 
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setDrivers(data.filter(d => d.role !== 'admin' && d.driverInfo));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    
    return () => unsubscribe();
  }, [activeTab]);

  const updateDriverStatus = async (id: string, status: string, additionalFields = {}) => {
    try {
      await updateDoc(doc(db, 'users', id), {
        status,
        ...additionalFields
      });
      toast.success(`تم التحديث للعملية بنجاح`);
      setSelectedDriver(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء التحديث.');
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      toast.error('الرجاء كتابة سبب الرفض');
      return;
    }
    updateDriverStatus(selectedDriver.id, 'rejected', { 
        rejectionReason: rejectReason, 
        driverApproved: false 
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-0 z-10 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          <button 
            onClick={() => setActiveTab('pending_approval')}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'pending_approval' ? 'bg-[#F6C21A] text-[#071426]' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            بانتظار المراجعة
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'active' ? 'bg-[#F6C21A] text-[#071426]' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            المقبولون (نشط)
          </button>
          <button 
            onClick={() => setActiveTab('suspended')}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'suspended' ? 'bg-[#F6C21A] text-[#071426]' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            الموقوفون
          </button>
          <button 
            onClick={() => setActiveTab('rejected')}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'rejected' ? 'bg-[#F6C21A] text-[#071426]' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            المرفوضون
          </button>
        </div>
      </div>

      {drivers.length === 0 ? (
         <div className="bg-white rounded-3xl border border-gray-100 text-center shadow-lg p-16 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <User size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">لا يوجد كباتن هنا</h3>
            <p className="text-gray-500">سيظهر هنا السائقون حسب الحالة المختارة.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map(driver => (
            <div key={driver.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                   <User size={24} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{driver.name || 'بدون اسم'}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1 dir-ltr justify-end">
                     {driver.phone} <Phone size={12} className="text-gray-400" />
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <Car size={16} className="text-gray-400" />
                  <span>{driver.driverInfo?.carType} - {driver.driverInfo?.carModel} ({driver.driverInfo?.carColor || 'غير محدد اللون'})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <div className="w-4 h-4 bg-gray-200 rounded text-[8px] flex items-center justify-center font-bold">ق</div>
                  <span>{driver.driverInfo?.carNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{driver.driverInfo?.governorate || 'غير محدد'}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedDriver(driver)}
                className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
              >
                عرض الإدارة والتفاصيل
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Driver Detail Modal */}
      {selectedDriver && !showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDriver(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-primary-dark">تفاصيل الكابتن - {selectedDriver.name}</h2>
              <button onClick={() => setSelectedDriver(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 bg-gray-50 space-y-4">
               
               <div className="flex items-center justify-between bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                     <Send className="w-6 h-6 text-blue-500" />
                     <p className="font-bold text-sm">تم إرسال المستمسكات إلى Telegram</p>
                  </div>
                  <CheckCircle className="text-blue-500 w-5 h-5" />
               </div>

               <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 mt-4">
                  <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3">معلومات الكابتن</h3>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500">الاسم</span>
                     <span className="font-bold text-gray-800">{selectedDriver.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500">رقم الهاتف</span>
                     <span className="font-bold text-gray-800 dir-ltr">{selectedDriver.phone}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500">المنطقة</span>
                     <span className="font-bold text-gray-800">{selectedDriver.driverInfo?.governorate || 'غير محدد'}</span>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 mt-4">
                  <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3">معلومات السيارة</h3>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500">النوع</span>
                     <span className="font-bold text-gray-800">{selectedDriver.driverInfo?.carType}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500">الموديل / السنة</span>
                     <span className="font-bold text-gray-800">{selectedDriver.driverInfo?.carModel}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500">اللون</span>
                     <span className="font-bold text-gray-800">{selectedDriver.driverInfo?.carColor}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500">عدد المقاعد</span>
                     <span className="font-bold text-gray-800">{selectedDriver.driverInfo?.seats || '4'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-500">رقم اللوحة</span>
                     <span className="font-bold text-gray-800">{selectedDriver.driverInfo?.carNumber}</span>
                  </div>
               </div>

               {selectedDriver.rejectionReason && selectedDriver.status === 'rejected' && (
                 <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-8">
                   <h4 className="font-bold text-red-800 mb-1">سبب الرفض السابق:</h4>
                   <p className="text-red-600">{selectedDriver.rejectionReason}</p>
                 </div>
               )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeTab === 'pending_approval' && (
                <>
                  <button onClick={() => updateDriverStatus(selectedDriver.id, 'active', { role: 'driver', driverApproved: true })} className="col-span-2 py-4 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 flex items-center justify-center gap-2 transition-colors border border-green-200">
                    <CheckCircle size={20} /> الموافقة على الطلب
                  </button>
                  <button onClick={() => setShowRejectModal(true)} className="col-span-2 py-4 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 transition-colors border border-red-200">
                    <X size={20} /> رفض الطلب
                  </button>
                </>
              )}

              {activeTab === 'active' && (
                <button onClick={() => updateDriverStatus(selectedDriver.id, 'suspended', { role: 'customer' })} className="col-span-4 md:col-span-2 py-4 bg-orange-50 text-orange-700 font-bold rounded-xl hover:bg-orange-100 flex items-center justify-center gap-2 transition-colors border border-orange-200">
                  <StopCircle size={20} /> إيقاف الكابتن
                </button>
              )}

              {activeTab === 'suspended' && (
                <button onClick={() => updateDriverStatus(selectedDriver.id, 'active', { role: 'driver' })} className="col-span-4 md:col-span-2 py-4 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 flex items-center justify-center gap-2 transition-colors border border-green-200">
                  <CheckCircle size={20} /> إعادة التفعيل (رفع الإيقاف)
                </button>
              )}
              
              <button onClick={() => setSelectedDriver(null)} className="col-span-4 md:col-span-2 py-4 border border-gray-200 font-bold rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative z-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">سبب رفض الطلب</h2>
            <textarea 
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا ليتم إشعاره به (مثال: الصورة غير واضحة)..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-red-400 outline-none mb-6"
            ></textarea>
            
            <div className="flex gap-3">
              <button 
                onClick={handleRejectSubmit}
                className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"
              >
                تأكيد الرفض
              </button>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-50 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
