import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { MapPin, Clock, Navigation } from 'lucide-react';

export function CustomerHistory() {
  const { userData } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!userData?.id) return;
      try {
        const q = query(
          collection(db, 'trips'),
          where('customerId', '==', userData.id)
        );
        const snapshot = await getDocs(q).catch((e) => {
          handleFirestoreError(e, OperationType.LIST, 'trips');
          throw e;
        });
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort locally to avoid Firebase Composite Index requirement
        docs.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        setTrips(docs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [userData]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-gold"></div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 p-4 md:p-8 max-w-3xl mx-auto overflow-y-auto pb-24">
      <h2 className="text-2xl font-bold text-primary-dark mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-accent-gold rounded-full inline-block"></span>
        رحلاتي السابقة
      </h2>
      
      {trips.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-xl mt-8 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد رحلات سابقة</h3>
          <p className="text-gray-500 font-medium max-w-[200px] leading-relaxed">رحلاتك السابقة ستظهر هنا عند قيامك بأول رحلة لك.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {trips.map(trip => (
            <div key={trip.id} className="bg-white rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 p-6 hover:shadow-xl hover:border-accent-gold/40 transition-all">
              <div className="flex justify-between items-start mb-5 border-b border-gray-100 pb-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800 mb-1.5">
                    {new Date(trip.createdAt).toLocaleString('ar-IQ', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full w-max ${
                    trip.status === 'completed' ? 'bg-green-50 text-green-600' : 
                    trip.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {trip.status === 'completed' ? 'مكتملة' : trip.status === 'cancelled' ? 'ملغية' : 'قيد التنفيذ'}
                  </span>
                </div>
                <div className="text-xl font-black text-gray-800 bg-gray-50 px-3 py-1 rounded-xl">
                  {trip.estimatedPrice?.toLocaleString('ar-IQ') || 3000} <span className="text-xs text-gray-500">د.ع</span>
                </div>
              </div>
              
              <div className="relative pl-6 space-y-5">
                <div className="absolute right-[11px] top-3 bottom-3 w-[2px] bg-gray-200"></div>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm ring-4 ring-white">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">من</p>
                    <p className="text-sm text-gray-800 font-medium leading-normal">{trip.pickupAddress || 'موقع الانطلاق'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-[#F6C21A]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm ring-4 ring-white">
                    <MapPin size={14} className="text-[#F6C21A]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">إلى</p>
                    <p className="text-sm text-gray-800 font-medium leading-normal">{trip.destinationAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
