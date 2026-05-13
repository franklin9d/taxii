import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { MapComponent, driverIcon, defaultIcon } from '../../components/MapComponent';
import { MapPin, Navigation, CarTaxiFront, Clock } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, orderBy, limit, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';

import toast from 'react-hot-toast';

const DEFAULT_CENTER: [number, number] = [33.6744, 44.3800];

export function CustomerDashboard() {
  const { userData, logout } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [destinationLocation, setDestinationLocation] = useState<[number, number] | null>(null);
  const [focusedField, setFocusedField] = useState<'pickup' | 'destination'>('pickup');
  
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [requestingTrip, setRequestingTrip] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);

  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

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
      toast.error("حدث خطأ أثناء حجز السائق، حاول ثانية.");
    }
  };

  // Listen to active trips
  useEffect(() => {
    if (!userData?.id) return;
    
    const q = query(
      collection(db, 'trips'), 
      where('customerId', '==', userData.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Filter locally
        const activeStatuses = ['created', 'searching_for_driver', 'driver_assigned', 'driver_on_way', 'driver_arrived', 'trip_started'];
        const activeDoc = snapshot.docs.find(doc => activeStatuses.includes(doc.data().status));
        
        if (activeDoc) {
          setActiveTrip({ id: activeDoc.id, ...activeDoc.data() });
          return;
        }
      }
      setActiveTrip(null);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
    });

    return () => unsubscribe();
  }, [userData]);

  // Listen to assigned driver location
  useEffect(() => {
    if (activeTrip && activeTrip.driverId) {
      const unsubscribe = onSnapshot(doc(db, 'drivers', activeTrip.driverId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (typeof data.currentLat === 'number' && typeof data.currentLng === 'number') {
            setDriverLocation([data.currentLat, data.currentLng]);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `drivers/${activeTrip.driverId}`);
      });
      return () => unsubscribe();
    } else {
      setDriverLocation(null);
    }
  }, [activeTrip?.driverId]);

  useEffect(() => {
    if (destinationAddress.length >= 3) {
      // Mock calculation based on length to simulate dynamic price
      const basePrice = 3000;
      const lengthFactor = Math.min(destinationAddress.length, 20) * 150;
      setEstimatedPrice(basePrice + lengthFactor);
    } else {
      setEstimatedPrice(null);
    }
  }, [destinationAddress]);

  const reverseGeocode = async (latlng: [number, number]): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng[0]}&lon=${latlng[1]}`);
      const data = await res.json();
      return data.display_name || `${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`;
    } catch(e) {
      return `${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`;
    }
  };

  const handleMapClick = async (latlng: [number, number]) => {
    if (focusedField === 'pickup') {
      setPickupLocation(latlng);
      setCurrentLocation(latlng);
      setPickupAddress("جاري التحديد...");
      const addr = await reverseGeocode(latlng);
      setPickupAddress(addr);
    } else {
      setDestinationLocation(latlng);
      setDestinationAddress("جاري التحديد...");
      const addr = await reverseGeocode(latlng);
      setDestinationAddress(addr);
    }
  };

  const fetchSuggestions = async (query: string, setter: (val: any[]) => void) => {
    if (query.length < 2) {
      setter([]);
      return;
    }
    
    // Custom static suggestions for Tarmia
    const localPlaces = [
      { display_name: "مركز الطارمية", lat: "33.6744", lon: "44.3800" },
      { display_name: "جسر الطارمية", lat: "33.6650", lon: "44.3750" },
      { display_name: "المشاهدة", lat: "33.7200", lon: "44.3100" },
      { display_name: "التاجي", lat: "33.4300", lon: "44.2900" },
      { display_name: "الكاظمية", lat: "33.3800", lon: "44.3400" },
      { display_name: "الاعظمية", lat: "33.3600", lon: "44.3600" },
      { display_name: "بغداد", lat: "33.3152", lon: "44.3661" }
    ];

    const filtered = localPlaces.filter(p => p.display_name.includes(query));
    if (filtered.length > 0) {
       setter(filtered);
       return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ar&countrycodes=iq&limit=5`);
      const data = await res.json();
      setter(data);
    } catch(e) {
      console.error(e);
    }
  };

  const handleAddressChange = (type: 'pickup' | 'destination', val: string) => {
    if (type === 'pickup') {
      setPickupAddress(val);
      setShowPickupSuggestions(true);
      if (val.length === 0) setPickupSuggestions([]);
      else fetchSuggestions(val, setPickupSuggestions);
    } else {
      setDestinationAddress(val);
      setShowDestinationSuggestions(true);
      if (val.length === 0) setDestinationSuggestions([]);
      else fetchSuggestions(val, setDestinationSuggestions);
    }
  };

  const selectSuggestion = (type: 'pickup' | 'destination', place: any) => {
    const latlng: [number, number] = [parseFloat(place.lat), parseFloat(place.lon)];
    if (type === 'pickup') {
      setPickupAddress(place.display_name);
      setPickupLocation(latlng);
      setCurrentLocation(latlng);
      setShowPickupSuggestions(false);
      setFocusedField('destination');
    } else {
      setDestinationAddress(place.display_name);
      setDestinationLocation(latlng);
      setShowDestinationSuggestions(false);
    }
  };

  const handleGetLocation = () => {
    setGettingLocation(true);
    setLocationError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latlng: [number, number] = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(latlng);
          setPickupLocation(latlng);
          
          setPickupAddress("جاري التحديد...");
          const addr = await reverseGeocode(latlng);
          setPickupAddress(addr);
          
          setGettingLocation(false);
          setFocusedField('destination');
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
      toast.error("الرجاء تحديد موقع الانطلاق والوجهة أولاً");
      return;
    }
    
    setRequestingTrip(true);
    try {
      await addDoc(collection(db, 'trips'), {
        customerId: userData.id,
        pickupAddress,
        pickupLat: pickupLocation[0],
        pickupLng: pickupLocation[1],
        destinationAddress,
        destinationLat: destinationLocation ? destinationLocation[0] : pickupLocation[0] + 0.01,
        destinationLng: destinationLocation ? destinationLocation[1] : pickupLocation[1] + 0.01,
        status: 'searching_for_driver',
        estimatedPrice: estimatedPrice || 3000,
        createdAt: Date.now()
      });
      toast.success("تم إرسال طلبك بنجاح");
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء حجز الرحلة، يرجى المحاولة مرة أُخرى");
    } finally {
      setRequestingTrip(false);
    }
  };

  const mapMarkers = [{ id: 'pickup', position: pickupLocation } as any];
  if (destinationLocation) {
    mapMarkers.push({ id: 'destination', position: destinationLocation, icon: defaultIcon }); // We would customize icon, using default for now
  }
  if (driverLocation) {
    mapMarkers.push({ id: 'driver', position: driverLocation, icon: driverIcon });
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-bg-light">
      <div className="absolute inset-0 z-0 bg-gray-light">
        <div className="absolute inset-0 babylonian-pattern z-0 opacity-50"></div>
        <MapComponent 
          center={currentLocation} 
          markers={mapMarkers} 
          onClick={activeTrip ? undefined : handleMapClick}
        />
      </div>

      <div className="absolute bottom-[88px] inset-x-4 md:w-96 md:bottom-auto md:top-8 md:left-auto md:right-8 z-10 flex flex-col gap-4">
        
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
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full mt-1 ${focusedField === 'pickup' ? 'bg-blue-500 shadow-md ring-2 ring-blue-200' : 'bg-gray-400'}`}></div>
                <input 
                  type="text" 
                  value={pickupAddress}
                  onFocus={() => setFocusedField('pickup')}
                  onChange={e => handleAddressChange('pickup', e.target.value)}
                  placeholder={gettingLocation ? "جاري التحديد..." : "موقع الانطلاق..."}
                  className={`w-full bg-gray-50 border rounded-xl py-3 pr-10 pl-4 focus:outline-none transition-all text-sm ${focusedField === 'pickup' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}
                />
                <button 
                  onClick={handleGetLocation}
                  className="absolute top-2 left-2 p-1.5 text-gray-400 hover:text-primary-dark transition-colors"
                  title="تحديث موقعي"
                >
                  <Navigation size={18} />
                </button>
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white mt-1 border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {pickupSuggestions.map((place, i) => (
                      <div 
                        key={i} 
                        onClick={() => selectSuggestion('pickup', place)}
                        className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-sm truncate"
                      >
                        {place.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full mt-1 ${focusedField === 'destination' ? 'bg-red-500 shadow-md ring-2 ring-red-200' : 'bg-gray-400'}`}></div>
                <input 
                  type="text" 
                  value={destinationAddress}
                  onFocus={() => setFocusedField('destination')}
                  onChange={e => handleAddressChange('destination', e.target.value)}
                  placeholder="اكتب الوجهة..." 
                  className={`w-full bg-gray-50 border rounded-xl py-3 pr-10 pl-4 focus:outline-none transition-all text-sm ${focusedField === 'destination' ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}`}
                />
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white mt-1 border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {destinationSuggestions.map((place, i) => (
                      <div 
                        key={i} 
                        onClick={() => selectSuggestion('destination', place)}
                        className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-sm truncate"
                      >
                        {place.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {estimatedPrice && (
                <div className="mt-4 p-4 bg-accent-yellow/10 border border-accent-gold/30 rounded-xl flex items-center justify-between animate-fade-in transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center text-primary-dark">
                      <span className="font-bold text-sm">IQD</span>
                    </div>
                    <span className="text-gray-700 font-medium text-sm">السعر التقديري</span>
                  </div>
                  <div className="text-2xl font-black text-primary-dark tracking-tight">
                    {estimatedPrice.toLocaleString('en-US')} <span className="text-sm text-gray-500 font-bold">د.ع</span>
                  </div>
                </div>
              )}
              
              <button 
                onClick={requestTrip}
                disabled={requestingTrip || !pickupAddress || !destinationAddress}
                className="w-full bg-accent-yellow hover:bg-[#F2BD23] disabled:opacity-50 disabled:hover:bg-accent-yellow text-primary-dark font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 mt-4"
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
