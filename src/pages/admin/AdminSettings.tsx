import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, Tag, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminSettings() {
  const [settings, setSettings] = useState({
    baseFare: 2000,
    pricePerKm: 500,
    minimumFare: 2500,
    rushHourMultiplier: 1.5,
    rushHourEnabled: false,
    supportPhone: '+964',
    supportWhatsapp: '+964'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">جاري تحميل الإعدادات...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl max-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary-dark">إعدادات النظام والتسعيرة</h2>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-lg text-primary-dark flex items-center gap-2">
            <Tag className="text-accent-gold" size={20} /> تسعيرة الرحلات
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">الأجرة الأساسية (عند بدء الرحلة)</label>
            <div className="relative">
              <input 
                type="number" 
                value={settings.baseFare}
                onChange={e => setSettings({...settings, baseFare: Number(e.target.value)})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-16 focus:ring-2 focus:ring-accent-gold focus:border-transparent outline-none dir-ltr font-bold text-gray-800"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">د.ع</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">سعر الكيلومتر الواحد</label>
            <div className="relative">
              <input 
                type="number" 
                value={settings.pricePerKm}
                onChange={e => setSettings({...settings, pricePerKm: Number(e.target.value)})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-16 focus:ring-2 focus:ring-accent-gold focus:border-transparent outline-none dir-ltr font-bold text-gray-800"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">د.ع</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">الحد الأدنى للأجرة</label>
            <div className="relative">
              <input 
                type="number" 
                value={settings.minimumFare}
                onChange={e => setSettings({...settings, minimumFare: Number(e.target.value)})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-16 focus:ring-2 focus:ring-accent-gold focus:border-transparent outline-none dir-ltr font-bold text-gray-800"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">د.ع</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">مضاعف أوقات الذروة (الازدحام)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                value={settings.rushHourMultiplier}
                onChange={e => setSettings({...settings, rushHourMultiplier: Number(e.target.value)})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-accent-gold focus:border-transparent outline-none dir-ltr font-bold text-gray-800"
                required
              />
            </div>
          </div>

          <div className="space-y-2 flex items-center gap-3 pt-6 md:col-span-2">
            <input 
              type="checkbox" 
              id="rushHour"
              checked={settings.rushHourEnabled}
              onChange={e => setSettings({...settings, rushHourEnabled: e.target.checked})}
              className="w-5 h-5 accent-accent-gold rounded cursor-pointer"
            />
            <label htmlFor="rushHour" className="text-sm font-bold text-red-600 cursor-pointer">
              تفعيل أوقات الذروة (تطبيق المضاعف على الرحلات)
            </label>
          </div>
        </div>
        
        <div className="p-6 border-y border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-lg text-primary-dark flex items-center gap-2">
            <Phone className="text-accent-gold" size={20} /> معلومات التواصل والدعم
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">رقم الهاتف (للاتصال)</label>
            <input 
              type="text" 
              value={settings.supportPhone}
              onChange={e => setSettings({...settings, supportPhone: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-accent-gold focus:border-transparent outline-none dir-ltr text-right"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">رقم الواتساب</label>
            <input 
              type="text" 
              value={settings.supportWhatsapp}
              onChange={e => setSettings({...settings, supportWhatsapp: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-accent-gold focus:border-transparent outline-none dir-ltr text-right"
              required
            />
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 flex justify-end gap-4 border-t border-gray-100">
           <button 
             type="submit"
             disabled={saving}
             className="bg-accent-gold hover:bg-accent-yellow text-primary-dark font-bold py-3 px-8 rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
           >
             <Save size={20} />
             {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
           </button>
        </div>
      </form>
    </div>
  );
}
