import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { X, CheckCircle, Car, User, Phone, MapPin, StopCircle } from 'lucide-react';
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
    
    // Note: some may not have .status if they are simple customers.
    // However, the rule is any applied driver will have status = 'pending_approval' or 'active' or 'rejected' or 'suspended'.
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
                  {driver.documents?.personalPhotoUrl ? (
                    <img src={driver.documents.personalPhotoUrl} alt="personal" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-gray-400" />
                  )}
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
                  <span>{driver.driverInfo?.carType} - {driver.driverInfo?.carModel}</span>
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
                عرض المستمسكات والإدارة
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Driver Detail Modal */}
      {selectedDriver && !showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDriver(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-primary-dark">تفاصيل الكابتن - {selectedDriver.name}</h2>
              <button onClick={() => setSelectedDriver(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 bg-gray-50">
               {/* Documents Grid */}
               <h3 className="font-bold text-gray-800 mb-4 text-lg">المستمسكات המرفقة</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                 <DocCard label="الصورة الشخصية" url={selectedDriver.documents?.personalPhotoUrl} />
                 <DocCard label="البطاقة الوطنية" url={selectedDriver.documents?.nationalIdUrl} />
                 <DocCard label="إجازة السوق" url={selectedDriver.documents?.drivingLicenseUrl} />
                 <DocCard label="سنوية السيارة" url={selectedDriver.documents?.carRegistrationUrl} />
                 <DocCard label="السيارة من الأمام" url={selectedDriver.documents?.carFrontPhotoUrl} />
                 <DocCard label="السيارة من الخلف" url={selectedDriver.documents?.carBackPhotoUrl} />
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
              placeholder="اكتب سبب الرفض هنا ليتم إشعاره به (مثال: الصورة الشخصية غير واضحة)..."
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

function DocCard({ label, url }: { label: string, url: string | undefined }) {
  if (!url) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center h-48 opacity-50">
        <X className="w-8 h-8 text-gray-300 mb-2" />
        <span className="text-sm font-bold text-gray-400">{label} (غير متوفر)</span>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col items-center">
      <a href={url} target="_blank" rel="noreferrer" className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden mb-3 block group relative">
        <img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
      </a>
      <span className="text-sm font-bold text-gray-700 pb-1">{label}</span>
    </div>
  );
}
