import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { MapComponent } from '../../components/MapComponent';
import { MapPin, Navigation, CarTaxiFront, Clock } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, orderBy, limit, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';

const DEFAULT_CENTER: [number, number] = [33.6744, 44.3800];

export function CustomerDashboard() {
  const { userData, logout } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [requestingTrip, setRequestingTrip] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

  useEffect(() => {
    handleGetLocation();
    
    // Seed some mock drivers for demonstration purposes
    const seedDrivers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'drivers'), limit(1)));
        if (snap.empty) {
          await addDoc(collection(db, 'drivers'), {
            name: 'علي أحمد',
            location: 'حي التأميم',
            carModel: 'تويوتا كامري 2020',
            isOnline: true
          });
          await addDoc(collection(db, 'drivers'), {
            name: 'محمد جاسم',
            location: 'حي السلام',
            carModel: 'هونداي إلنترا 2019',
            isOnline: true
          });
        }
      } catch (e) {
        console.error('Failed to seed drivers', e);
      }
    };
    seedDrivers();
  }, []);

  // Listen to available drivers when searching
  useEffect(() => {
    if (activeTrip?.status === 'searching_for_driver') {
      const q = query(
        collection(db, 'drivers'), 
        where('isOnline', '==', true)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const driversData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableDrivers(driversData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'drivers');
      });

      return () => unsubscribe();
    } else {
      setAvailableDrivers([]);
    }
  }, [activeTrip?.status]);

  const selectDriver = async (driverId: string) => {
    if (!activeTrip) return;
    try {
      await updateDoc(doc(db, 'trips', activeTrip.id), {
        driverId,
        status: 'driver_assigned',
        acceptedAt: Date.now()
      });
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حجز السائق");
    }
  };

  // Listen to active trips
  useEffect(() => {
    if (!userData?.id) return;
    
    const q = query(
      collection(db, 'trips'), 
      where('customerId', '==', userData.id),
      where('status', 'in', ['created', 'searching_for_driver', 'driver_assigned', 'driver_on_way', 'driver_arrived', 'trip_started'])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveTrip({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveTrip(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
    });

    return () => unsubscribe();
  }, [userData]);

  const handleGetLocation = () => {
    setGettingLocation(true);
    setLocationError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.latitude, position.coords.longitude]);
          setGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("يرجى تفعيل الموقع حتى نكدر نحدد مكان الانطلاق.");
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError("المتصفح لا يدعم تحديد الموقع.");
      setGettingLocation(false);
    }
  };

  const requestTrip = async () => {
    if (!userData) return;
    if (!pickupAddress || !destinationAddress) {
      alert("الرجاء تحديد موقع الانطلاق والوجهة");
      return;
    }
    
    setRequestingTrip(true);
    try {
      await addDoc(collection(db, 'trips'), {
        customerId: userData.id,
        pickupAddress,
        pickupLat: currentLocation[0],
        pickupLng: currentLocation[1],
        destinationAddress,
        destinationLat: currentLocation[0] + 0.01, // Mock dest for now
        destinationLng: currentLocation[1] + 0.01,
        status: 'searching_for_driver',
        estimatedPrice: 3000,
        createdAt: Date.now()
      });
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حجز الرحلة");
    } finally {
      setRequestingTrip(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-light relative">
      <div className="absolute inset-0 z-0 bg-gray-light">
        <div className="absolute inset-0 babylonian-pattern z-0 opacity-50"></div>
        <MapComponent 
          center={currentLocation} 
          markers={[{ id: 'me', position: currentLocation }]} 
        />
      </div>

      <div className="absolute bottom-4 inset-x-4 md:w-96 md:bottom-auto md:top-8 md:left-auto md:right-8 z-10 flex flex-col gap-4">
        
        {activeTrip ? (
           <div className="bg-white p-6 rounded-2xl shadow-2xl border-t-4 border-accent-gold border border-gray-100">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-lg text-primary-dark">حالة الرحلة</h3>
               <span className="px-3 py-1 bg-accent-gold/10 text-accent-gold font-bold rounded-full text-xs">
                 {activeTrip.status === 'searching_for_driver' && 'جاري البحث عن كابتن...'}
                 {activeTrip.status === 'driver_assigned' && 'تم قبول الرحلة'}
                 {activeTrip.status === 'driver_on_way' && 'السائق بالطريق لك'}
                 {activeTrip.status === 'driver_arrived' && 'وصلت السيارة'}
                 {activeTrip.status === 'trip_started' && 'بدأت الرحلة'}
               </span>
             </div>
             
             {activeTrip.status === 'searching_for_driver' && (
               <div className="flex flex-col py-2">
                 <div className="flex flex-col items-center justify-center py-4">
                   <div className="animate-pulse mb-3 p-3 bg-accent-yellow/10 rounded-full">
                     <CarTaxiFront className="w-8 h-8 text-accent-gold" />
                   </div>
                   <p className="text-sm text-gray-500 font-medium">يرجى الانتظار، أو اختر كابتن من المتاحين...</p>
                 </div>
                 
                 {availableDrivers.length > 0 && (
                   <div className="mt-2 border-t border-gray-100 pt-4">
                     <p className="text-xs font-bold text-gray-500 mb-3">السائقون المتاحون بالقرب منك:</p>
                     <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                       {availableDrivers.map(driver => (
                         <div key={driver.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:border-accent-gold/50">
                           <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-primary-dark rounded-full flex items-center justify-center text-accent-gold font-bold text-sm shadow-sm">
                                 {driver.name ? driver.name.substring(0, 1) : 'ك'}
                               </div>
                               <div className="flex flex-col">
                                 <p className="font-bold text-primary-dark text-sm">{driver.name || 'سائق غير معروف'}</p>
                                 <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                   <span>{driver.carModel || 'سيارة مجهولة'}</span>
                                   <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                   <span>{driver.location || 'موقع غير معروف'}</span>
                                 </div>
                               </div>
                             </div>
                             <button
                               onClick={() => selectDriver(driver.id)}
                               className="bg-accent-yellow hover:bg-[#F2BD23] text-primary-dark text-xs font-bold py-2 px-4 rounded-lg transition-transform active:scale-95 shadow-sm"
                             >
                               اختيار
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 <button className="mt-6 text-red-500 text-sm hover:text-red-700 font-bold underline transition-colors self-center">إلغاء الطلب</button>
               </div>
             )}
           </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 border-t-4 border-t-accent-gold">
            <div className="p-5 bg-white border-b border-gray-100">
              <h2 className="font-bold text-lg text-primary-dark flex items-center gap-2">
                <span className="w-2 h-6 bg-accent-gold rounded-full inline-block block"></span>
                وين تريد تروح؟
              </h2>
            </div>
            
            <div className="p-6 space-y-5">
              {locationError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
                  {locationError}
                </div>
              )}
              
              <div className="relative">
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                <input 
                  type="text" 
                  value={pickupAddress}
                  onChange={e => setPickupAddress(e.target.value)}
                  placeholder={gettingLocation ? "جاري التحديد..." : "موقع الانطلاق..."}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-accent-gold transition-all text-sm"
                />
                <button 
                  onClick={handleGetLocation}
                  className="absolute top-2 left-2 p-1.5 text-gray-400 hover:text-primary-dark transition-colors"
                  title="تحديث موقعي"
                >
                  <Navigation size={18} />
                </button>
              </div>

              <div className="relative">
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 mt-1"></div>
                <input 
                  type="text" 
                  value={destinationAddress}
                  onChange={e => setDestinationAddress(e.target.value)}
                  placeholder="اكتب الوجهة" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-accent-gold transition-all text-sm"
                />
              </div>
              
              <button 
                onClick={requestTrip}
                disabled={requestingTrip || !pickupAddress || !destinationAddress}
                className="w-full bg-accent-yellow hover:bg-[#F2BD23] disabled:opacity-50 disabled:hover:bg-accent-yellow text-primary-dark font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95"
              >
                {requestingTrip ? 'جاري الطلب...' : 'احجز رحلتك الآن'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
