import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { MapComponent } from '../../components/MapComponent';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { MapPin, Navigation, Map } from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [33.6744, 44.3800];

export function DriverDashboard() {
  const { userData, logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [myActiveTrip, setMyActiveTrip] = useState<any>(null);

  useEffect(() => {
    // If we have an active trip, don't show available
    if (myActiveTrip) return;
    
    if (isOnline) {
      const q = query(collection(db, 'trips'), where('status', '==', 'searching_for_driver'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableTrips(trips);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'trips'));
      
      return () => unsubscribe();
    } else {
      setAvailableTrips([]);
    }
  }, [isOnline, myActiveTrip]);

  useEffect(() => {
    if (!userData?.id) return;
    const q = query(
      collection(db, 'trips'), 
      where('driverId', '==', userData.id),
      where('status', 'in', ['driver_assigned', 'driver_on_way', 'driver_arrived', 'trip_started'])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setMyActiveTrip({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setMyActiveTrip(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'trips'));
    
    return () => unsubscribe();
  }, [userData]);

  const toggleOnline = () => {
    // In a real app we would update the driver doc, but we can just use local state for the demo
    setIsOnline(!isOnline);
  };

  const acceptTrip = async (tripId: string) => {
    if (!userData) return;
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        driverId: userData.id,
        status: 'driver_assigned',
        acceptedAt: Date.now()
      });
    } catch (error) {
      console.error(error);
      alert("تعذر قبول الرحلة - قد تكون قبلت من سائق آخر");
    }
  };

  const updateTripStatus = async (status: string) => {
    if (!myActiveTrip) return;
    try {
      await updateDoc(doc(db, 'trips', myActiveTrip.id), {
        status,
        ...(status === 'trip_started' ? { startedAt: Date.now() } : {}),
        ...(status === 'completed' ? { completedAt: Date.now() } : {})
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-light relative">
      <div className="absolute inset-0 z-0 bg-gray-light">
        <div className="absolute inset-0 babylonian-pattern z-0 opacity-50"></div>
        <MapComponent center={DEFAULT_CENTER} />
      </div>

      {myActiveTrip ? (
        <div className="absolute bottom-4 inset-x-4 md:w-96 md:bottom-auto md:top-8 md:left-auto md:right-8 z-10">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-accent-gold border-x border-b border-gray-100 p-6">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-primary-dark">الرحلة الحالية</h3>
                <span className="px-3 py-1 bg-accent-gold/10 text-accent-gold font-bold rounded-full text-xs">
                  {myActiveTrip.status === 'driver_assigned' && 'تم القبول'}
                  {myActiveTrip.status === 'driver_on_way' && 'متجه للعميل'}
                  {myActiveTrip.status === 'driver_arrived' && 'بانتظار العميل'}
                  {myActiveTrip.status === 'trip_started' && 'الرحلة مستمرة'}
                </span>
             </div>
             
             <div className="space-y-4 mb-6 relative">
               <div className="absolute right-[9px] top-6 bottom-6 w-0.5 bg-gray-200 z-0"></div>
               <div className="flex gap-4 items-start relative z-10">
                 <div className="bg-white p-0.5 rounded-full z-10 mt-1">
                   <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                 </div>
                 <div>
                   <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">من</p>
                   <p className="font-bold font-sans text-sm">{myActiveTrip.pickupAddress}</p>
                 </div>
               </div>
               <div className="flex gap-4 items-start relative z-10">
                 <div className="bg-white p-0.5 rounded-full z-10 mt-1">
                   <div className="w-4 h-4 rounded-full bg-red-500"></div>
                 </div>
                 <div>
                   <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">إلى</p>
                   <p className="font-bold font-sans text-sm">{myActiveTrip.destinationAddress}</p>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3 mb-6">
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50 text-center">
                 <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">السعر</p>
                 <p className="font-bold text-lg text-primary-dark">{myActiveTrip.estimatedPrice} <span className="text-xs">د.ع</span></p>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50 text-center">
                 <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">المسافة</p>
                 <p className="font-bold text-lg text-primary-dark">~ <span className="text-xs">كم</span></p>
               </div>
             </div>
             
             {myActiveTrip.status === 'driver_assigned' && (
               <button onClick={() => updateTripStatus('driver_on_way')} className="w-full bg-accent-yellow hover:bg-[#F2BD23] text-primary-dark font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">التحرك نحو العميل</button>
             )}
             {myActiveTrip.status === 'driver_on_way' && (
               <button onClick={() => updateTripStatus('driver_arrived')} className="w-full bg-primary-dark hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">الوصول لموقع العميل</button>
             )}
             {myActiveTrip.status === 'driver_arrived' && (
               <button onClick={() => updateTripStatus('trip_started')} className="w-full bg-accent-yellow hover:bg-[#F2BD23] text-primary-dark font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">بدء الرحلة</button>
             )}
             {myActiveTrip.status === 'trip_started' && (
               <button onClick={() => updateTripStatus('completed')} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">إنهاء الرحلة</button>
             )}
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
              onClick={toggleOnline}
              className={`px-5 py-3 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center gap-3 ${isOnline ? 'bg-green-500 text-white' : 'bg-white text-primary-dark border border-gray-200'}`}
            >
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-gray-400'}`}></div>
              {isOnline ? 'متاح للعمل (Online)' : 'غير متاح (Offline)'}
            </button>
          </div>

          <div className="absolute bottom-4 inset-x-4 md:w-96 md:bottom-auto md:top-20 md:left-4 md:right-auto z-10 flex flex-col gap-4 max-h-[70vh] overflow-y-auto pb-8">
            {!isOnline ? (
              <div className="bg-white rounded-2xl shadow-2xl border-t-4 border-gray-300 p-8 text-center">
                <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="font-bold text-2xl text-primary-dark mb-2">مرحباً كابتن {userData?.name}</h2>
                <p className="text-gray-500 text-sm mb-2">قم بتفعيل حالتك متصل لاستقبال الطلبات</p>
              </div>
            ) : availableTrips.length === 0 ? (
               <div className="bg-white rounded-2xl shadow-2xl border-t-4 border-blue-500 p-8 text-center overflow-hidden relative">
                <div className="absolute inset-0 bg-blue-50/50 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white border border-blue-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-20"></div>
                    <Map className="w-10 h-10 text-blue-500" />
                  </div>
                  <h2 className="font-bold text-2xl text-primary-dark mb-2">جاري البحث</h2>
                  <p className="text-gray-500 text-sm">أنت الآن في وضع الاتصال، بانتظار رحلات قريبة...</p>
                </div>
              </div>
            ) : (
              availableTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border-t-4 border-accent-gold p-6 cursor-pointer transform hover:-translate-y-1 duration-200">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="font-bold text-primary-dark text-lg">طلب جديد</h3>
                    <span className="font-bold text-accent-gold text-lg bg-accent-yellow/10 px-3 py-1 rounded-full">{trip.estimatedPrice} د.ع</span>
                  </div>
                  <div className="space-y-4 mb-6 relative">
                    <div className="absolute right-[7px] top-4 bottom-4 w-0.5 bg-gray-200 z-0"></div>
                    <div className="flex gap-4 items-start relative z-10">
                       <div className="bg-white p-0.5 rounded-full z-10 mt-1">
                         <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                       </div>
                      <p className="text-sm font-sans text-gray-700">{trip.pickupAddress}</p>
                    </div>
                    <div className="flex gap-4 items-start relative z-10">
                       <div className="bg-white p-0.5 rounded-full z-10 mt-1">
                         <div className="w-3 h-3 rounded-full bg-red-500"></div>
                       </div>
                      <p className="text-sm font-sans text-gray-700">{trip.destinationAddress}</p>
                    </div>
                  </div>
                  <button onClick={() => acceptTrip(trip.id)} className="w-full bg-accent-yellow hover:bg-[#F2BD23] text-primary-dark font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">قبول الرحلة</button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
