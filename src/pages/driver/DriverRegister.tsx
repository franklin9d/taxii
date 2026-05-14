import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { FileText, CheckCircle, ChevronLeft, ChevronRight, User, Car, Image as ImageIcon, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function LocalFileUpload({ label, file, setFile }: { label: string, file: File | null, setFile: (f: File | null) => void }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${file ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
          {file ? <Check className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-bold text-gray-800 text-sm">{label} <span className="text-red-500">*</span></p>
          <p className="text-xs text-gray-400 mt-0.5">{file ? 'تم اختيار الصورة' : 'لم يتم اختيار صورة'}</p>
        </div>
      </div>
      <div>
        <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors inline-block">
          {file ? 'تغيير' : 'اختيار'}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
    </div>
  );
}

export function DriverRegister() {
  const { userData, logout } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Step 1: Personal
  const [phone, setPhone] = useState(userData?.phone || '');
  const [governorate, setGovernorate] = useState('الطارمية');

  // Step 2: Car Info
  const [carType, setCarType] = useState('صالون');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [seats, setSeats] = useState('4');

  // Step 3: Documents
  const [nationalId, setNationalId] = useState<File | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<File | null>(null);
  const [carRegistration, setCarRegistration] = useState<File | null>(null);
  const [personalPhoto, setPersonalPhoto] = useState<File | null>(null);
  const [carFrontPhoto, setCarFrontPhoto] = useState<File | null>(null);
  const [carBackPhoto, setCarBackPhoto] = useState<File | null>(null);

  const nextStep = () => {
    if (step === 1) {
      if (!phone) { toast.error('يرجى إدخال رقم الهاتف'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!carModel) { toast.error('يرجى إدخال موديل السيارة'); return; }
      if (!carColor) { toast.error('يرجى إدخال لون السيارة'); return; }
      if (!carNumber) { toast.error('يرجى إدخال رقم اللوحة'); return; }
      setStep(3);
    } else if (step === 3) {
      if (!nationalId) { toast.error('يرجى رفع صورة الهوية / البطاقة الوطنية'); return; }
      if (!drivingLicense) { toast.error('يرجى رفع صورة إجازة السوق'); return; }
      if (!carRegistration) { toast.error('يرجى رفع صورة السنوية'); return; }
      if (!personalPhoto) { toast.error('يرجى رفع الصورة الشخصية'); return; }
      if (!carFrontPhoto) { toast.error('يرجى رفع صورة السيارة من الأمام'); return; }
      if (!carBackPhoto) { toast.error('يرجى رفع صورة السيارة من الخلف'); return; }
      setStep(4);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!userData?.id || !userData.name) {
      toast.error('حدث خطأ في تحميل بيانات حسابك');
      return;
    }
    console.log("Starting driver application submission for UID:", userData.id);
    setLoading(true);
    const formData = new FormData();
    formData.append('fullName', userData.name);
    formData.append('email', userData.email || '');
    formData.append('phone', phone);
    formData.append('area', governorate);
    formData.append('carType', carType);
    formData.append('carModel', carModel);
    formData.append('carColor', carColor);
    formData.append('plateNumber', carNumber);
    formData.append('seats', seats);
    formData.append('uid', userData.id);

    if (nationalId) formData.append('البطاقة_الوطنية_أو_الهوية', nationalId);
    if (drivingLicense) formData.append('إجازة_السوق', drivingLicense);
    if (carRegistration) formData.append('سنوية_السيارة', carRegistration);
    if (personalPhoto) formData.append('الصورة_الشخصية', personalPhoto);
    if (carFrontPhoto) formData.append('صورة_السيارة_أمام', carFrontPhoto);
    if (carBackPhoto) formData.append('صورة_السيارة_خلف', carBackPhoto);

    // Compress personal photo for Firestore
    let base64Photo = '';
    if (personalPhoto) {
      try {
        const compressedBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(personalPhoto);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 150;
              const MAX_HEIGHT = 150;
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
          };
        });
        base64Photo = compressedBase64;
      } catch (err) {
        console.error("Photo compression failed", err);
      }
    }

    try {
      const res = await fetch('/api/driver/apply', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error response:", text);
        try {
          const json = JSON.parse(text);
          throw new Error(json.error || `Server returned ${res.status}`);
        } catch (e) {
          throw new Error(`خطأ في السيرفر (${res.status}). يرجى المحاولة لاحقاً.`);
        }
      }

      const result = await res.json();
      
      if (!result.success) {
         toast.error(result.error || 'فشل إرسال الطلب، تأكد من الاتصال.');
         setLoading(false);
         return;
      }

      console.log("Saving driver data to Firestore...");
      
      const { setDoc, updateDoc, doc } = await import('firebase/firestore');
      
      await setDoc(doc(db, 'drivers', userData.id), {
        uid: userData.id,
        fullName: userData.name,
        phone,
        email: userData.email || '',
        area: governorate,
        carType,
        carModel,
        carColor,
        plateNumber: carNumber,
        seats,
        photoUrl: base64Photo,
        reviewStatus: "pending",
        telegramSent: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log("Saving user status to Firestore...");
      await updateDoc(doc(db, 'users', userData.id), {
        phone,
        avatar: base64Photo || null,
        driverInfo: {
          carType,
          carModel,
          carColor,
          carNumber,
          governorate,
          seats,
          photoUrl: base64Photo
        },
        driverApproved: false,
        driverStatus: 'pending',
        status: 'pending_approval'
      });
      console.log("Firestore saves completed successfully.");

      setIsSubmitted(true);
      toast.success('تم إرسال طلبك للمراجعة بنجاح!');
    } catch (e: any) {
      console.error("Driver application error:", e);
      toast.error('فشل إرسال الطلب، تأكد من الاتصال وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (userData?.status === 'pending_approval' || isSubmitted) {
    return (
      <div className="absolute inset-0 p-6 md:max-w-2xl mx-auto flex flex-col items-center bg-bg-light pb-24 overflow-y-auto">
        <div className="w-full bg-white rounded-3xl p-8 mb-6 shadow-sm border border-gray-100 flex flex-col items-center mt-8">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <FileText className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-primary-dark mb-2">مرحباً كابتن {userData?.name}</h2>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold text-sm mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            حسابك قيد المراجعة
          </div>

          <p className="text-gray-500 text-center text-sm leading-relaxed mb-8 max-w-sm">
            تم إرسال بياناتك ومستمسكاتك إلى الإدارة. سيتم مراجعة طلبك وإشعارك عند القبول أو الرفض قريباً.
          </p>

          {(userData?.driverInfo || carType) && (
            <div className="w-full bg-gray-50 rounded-2xl p-4 flex flex-col gap-3">
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-2">بيانات المركبة</h3>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">نوع السيارة</span>
                <span className="text-gray-800">{userData?.driverInfo?.carType || carType}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">اللون</span>
                <span className="text-gray-800">{userData?.driverInfo?.carColor || carColor}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">رقم اللوحة</span>
                <span className="text-gray-800 dir-ltr">{userData?.driverInfo?.carNumber || carNumber}</span>
              </div>
            </div>
          )}
        </div>
        
        <button onClick={logout} className="w-full max-w-xs py-4 bg-red-50 border border-red-100 text-red-600 font-bold rounded-2xl shadow-sm hover:bg-red-100 transition-colors">
          تسجيل الخروج
        </button>
      </div>
    );
  }

  if (userData?.status === 'suspended' || userData?.status === 'rejected') {
     return (
      <div className="absolute inset-0 p-6 md:max-w-2xl mx-auto flex flex-col justify-center items-center text-center bg-bg-light pb-24">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-red-600 mb-3">{userData.status === 'rejected' ? 'تم رفض طلبك' : 'الحساب موقوف'}</h2>
        <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">
           {userData.status === 'rejected' ? 'يبدو أن الإدارة قد رفضت طلبك. يمكنك التواصل مع الدعم أو المحاولة لاحقاً.' : 'تم إيقاف حسابك من قبل الإدارة. يرجى التواصل مع الدعم الفني للمزيد من التفاصيل.'}
        </p>
        <button onClick={logout} className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
          تسجيل الخروج
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full md:max-w-xl mx-auto bg-bg-light flex flex-col">
      <div className="flex-none p-6 pb-2">
        <h2 className="text-2xl font-bold text-primary-dark mb-4">إكمال التسجيل</h2>
        <div className="flex items-center justify-between relative mb-6">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10 rounded-full transform -translate-y-1/2"></div>
          <div className="absolute right-0 top-1/2 h-1 bg-accent-gold -z-10 rounded-full transform -translate-y-1/2 transition-all duration-300" style={{ width: `${(step - 1) * 33.33}%` }}></div>
          
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-accent-gold text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
              {step > i ? <CheckCircle size={16} /> : i}
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-sm font-bold">الخطوة {step} من 4</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <User className="text-accent-gold" /> معلومات شخصية
            </h3>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف <span className="text-red-500">*</span></label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="07X XXXX XXXX" 
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-accent-gold outline-none text-left dir-ltr" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المنطقة</label>
              <select 
                 value={governorate}
                 onChange={e => setGovernorate(e.target.value)}
                 className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-accent-gold outline-none"
              >
                 <option>الطارمية</option>
                 <option>المشاهدة</option>
                 <option>التاجي</option>
                 <option>بغداد</option>
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <Car className="text-accent-gold" /> تفاصيل المركبة
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع السيارة <span className="text-red-500">*</span></label>
                <select 
                  value={carType}
                  onChange={e => setCarType(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-accent-gold outline-none"
                >
                  <option>صالون</option>
                  <option>عالية</option>
                  <option>VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عدد المقاعد <span className="text-red-500">*</span></label>
                <select 
                  value={seats}
                  onChange={e => setSeats(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-accent-gold outline-none"
                >
                  <option>4</option>
                  <option>6</option>
                  <option>7</option>
                  <option>11</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">موديل/سنة الصنع <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={carModel}
                onChange={e => setCarModel(e.target.value)}
                placeholder="مثال: سنتفاي 2021" 
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-accent-gold outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">لون السيارة <span className="text-red-500">*</span></label>
              <input 
                 type="text" 
                 value={carColor}
                 onChange={e => setCarColor(e.target.value)}
                 placeholder="أبيض، أسود..." 
                 className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-accent-gold outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم اللوحة <span className="text-red-500">*</span></label>
              <input 
                 type="text" 
                 value={carNumber}
                 onChange={e => setCarNumber(e.target.value)}
                 placeholder="مثال: بغداد 12345 ق" 
                 className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-accent-gold outline-none" 
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FileText className="text-accent-gold" /> المستمسكات
            </h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">سيتم إرسالها إلى الإدارة عبر Telegram مباشرة، لا نحفظ الصور في الموقع.</p>
            
            <LocalFileUpload label="البطاقة الوطنية (الوجهين)" file={nationalId} setFile={setNationalId} />
            <LocalFileUpload label="إجازة السوق" file={drivingLicense} setFile={setDrivingLicense} />
            <LocalFileUpload label="سنوية السيارة" file={carRegistration} setFile={setCarRegistration} />
            <LocalFileUpload label="صورة شخصية (سيلفي)" file={personalPhoto} setFile={setPersonalPhoto} />
            <LocalFileUpload label="صورة السيارة من الأمام" file={carFrontPhoto} setFile={setCarFrontPhoto} />
            <LocalFileUpload label="صورة السيارة من الخلف" file={carBackPhoto} setFile={setCarBackPhoto} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
              <CheckCircle className="text-accent-gold" /> مراجعة الطلب
            </h3>
            <p className="text-sm text-gray-500 mb-6 border-b border-gray-200 pb-4">يرجى التأكد من البيانات قبل إرسال الطلب، لا يمكن تعديلها أثناء المراجعة.</p>
            
            <div className="space-y-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
               <h4 className="font-bold text-primary-dark">معلومات الحساب</h4>
               <div className="flex justify-between text-sm"><span className="text-gray-500">الاسم</span><span className="font-medium text-gray-800">{userData?.name}</span></div>
               <div className="flex justify-between text-sm"><span className="text-gray-500">الهاتف</span><span className="font-medium text-gray-800 dir-ltr">{phone}</span></div>
               <div className="flex justify-between text-sm"><span className="text-gray-500">المنطقة</span><span className="font-medium text-gray-800">{governorate}</span></div>
            </div>

            <div className="space-y-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
               <h4 className="font-bold text-primary-dark">معلومات السيارة</h4>
               <div className="flex justify-between text-sm"><span className="text-gray-500">السيارة</span><span className="font-medium text-gray-800">{carType} - {carModel}</span></div>
               <div className="flex justify-between text-sm"><span className="text-gray-500">اللون</span><span className="font-medium text-gray-800">{carColor}</span></div>
               <div className="flex justify-between text-sm"><span className="text-gray-500">اللوحة</span><span className="font-medium text-gray-800">{carNumber}</span></div>
            </div>
            
            <div className="space-y-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 items-center flex justify-between">
               <h4 className="font-bold text-primary-dark">المستمسكات (العدد: 6)</h4>
               <span className="font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg text-xs">جاهزة للإرسال لـ Telegram</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-none p-4 bg-white border-t border-gray-200 flex gap-4 absolute bottom-0 inset-x-0 z-20 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {step > 1 && (
          <button 
            type="button"
            onClick={prevStep}
            className="px-4 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        )}
        {step < 4 ? (
          <button 
            onClick={nextStep}
            className="flex-1 bg-[#F6C21A] text-[#111827] font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            التالي <ChevronLeft size={20} />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#071426] text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'جاري إرسال الطلب...' : 'إرسال الطلب للمراجعة'}
            {!loading && <CheckCircle size={20} className="text-[#F6C21A]" />}
          </button>
        )}
      </div>
    </div>
  );
}
