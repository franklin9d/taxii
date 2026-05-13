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
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'driver'), limit(1)));
        if (snap.empty) {
          await addDoc(collection(db, 'users'), {
            name: 'علي أحمد',
            phone: '07701234567',
            role: 'driver',
            status: 'active',
            driverApproved: true,
            isOnline: true,
            driverInfo: {
              carType: 'صالون',
              carModel: 'تويوتا كامري 2020',
              carColor: 'أبيض',
              carNumber: 'بغداد 12345 ق'
            }
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
        collection(db, 'users'), 
        where('role', '==', 'driver'),
        where('isOnline', '==', true)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const driversData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableDrivers(driversData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
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

  const [assignedDriverInfo, setAssignedDriverInfo] = useState<any>(null);

  // Listen to assigned driver location + info
  useEffect(() => {
    if (activeTrip && activeTrip.driverId) {
      const unsubscribe = onSnapshot(doc(db, 'users', activeTrip.driverId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setAssignedDriverInfo(data);
          if (typeof data.currentLat === 'number' && typeof data.currentLng === 'number') {
            setDriverLocation([data.currentLat, data.currentLng]);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${activeTrip.driverId}`);
      });
      return () => unsubscribe();
    } else {
      setDriverLocation(null);
      setAssignedDriverInfo(null);
    }
  }, [activeTrip?.driverId]);

  const cancelTrip = async () => {
    if (!activeTrip) return;
    if (confirm("هل أنت متأكد من إلغاء الطلب؟")) {
      try {
        await updateDoc(doc(db, 'trips', activeTrip.id), {
          status: 'cancelled',
          cancelledBy: 'rider',
          cancelledAt: Date.now()
        });
        toast.success("تم إلغاء الطلب بنجاح");
        setActiveTrip(null);
      } catch (err) {
        console.error(err);
        toast.error("حدث خطأ أثناء إلغاء الرحلة.");
      }
    }
  };

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

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(userData?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);

  const handleSavePhone = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      toast.error("يرجى إدخال رقم هاتف صحيح");
      return;
    }
    if (!userData?.id) return;
    setSavingPhone(true);
    try {
      await updateDoc(doc(db, 'users', userData.id), {
        phone: customerPhone
      });
      setShowPhoneModal(false);
      requestTrip(); // proceed with trip
    } catch (e) {
      toast.error("فشل حفظ الرقم، حاول مرة أخرى");
    } finally {
      setSavingPhone(false);
    }
  };

  const requestTrip = async () => {
    if (!userData) return;
    if (!pickupAddress || !destinationAddress) {
      toast.error("الرجاء تحديد موقع الانطلاق والوجهة أولاً");
      return;
    }
    if (!userData.phone && !customerPhone) {
      setShowPhoneModal(true);
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
    <div className="absolute inset-0 flex flex-col bg-bg-light outline-none overflow-hidden max-w-full">
      <div className="absolute inset-0 z-0 bg-gray-light">
        <div className="absolute inset-0 babylonian-pattern z-0 opacity-50 pointer-events-none"></div>
        <MapComponent 
          center={currentLocation} 
          markers={mapMarkers} 
          onClick={activeTrip ? undefined : handleMapClick}
        />
      </div>

      <div className="absolute inset-x-0 bottom-4 z-10 flex flex-col justify-end pointer-events-none pb-2 px-4 md:items-end md:justify-start md:top-8 md:bottom-auto">
        
        {activeTrip ? (
           <div className="bg-white p-6 rounded-3xl shadow-2xl border-t-4 border-accent-gold border w-full md:w-96 pointer-events-auto flex-shrink-0 max-h-[75vh] overflow-y-auto">
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

                 <button onClick={cancelTrip} className="mt-6 text-red-500 text-sm hover:text-red-700 font-bold underline transition-colors self-center">إلغاء الطلب</button>
               </div>
             )}

             {activeTrip.status !== 'searching_for_driver' && assignedDriverInfo && (
               <div className="flex flex-col gap-4 mt-4 border-t border-gray-100 pt-4">
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border-2 border-accent-gold shadow-sm">
                     {assignedDriverInfo.documents?.personalPhotoUrl ? (
                        <img src={assignedDriverInfo.documents.personalPhotoUrl} alt="الكابتن" className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-2xl text-gray-400">{assignedDriverInfo.name?.substring(0, 1) || 'ك'}</span>
                     )}
                   </div>
                   <div className="flex flex-col">
                     <p className="font-bold text-primary-dark text-lg">{assignedDriverInfo.name || 'سائق غير معروف'}</p>
                     <p className="text-xs text-gray-500 font-bold mt-1 dir-ltr text-right">{assignedDriverInfo.phone}</p>
                     {assignedDriverInfo.driverInfo?.carModel && (
                       <p className="text-xs text-gray-500 mt-1">السيارة: {assignedDriverInfo.driverInfo.carModel} - {assignedDriverInfo.driverInfo.carColor || ''}</p>
                     )}
                     {assignedDriverInfo.driverInfo?.carNumber && (
                       <div className="inline-flex mt-2 items-center gap-2 text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 w-fit">
                         <span className="w-3 h-3 bg-gray-300 rounded-sm text-[8px] flex items-center justify-center">ق</span>
                         <span className="dir-ltr">{assignedDriverInfo.driverInfo.carNumber}</span>
                       </div>
                     )}
                   </div>
                 </div>
                 
                 <div className="flex gap-2 mt-2">
                   <a href={`tel:${assignedDriverInfo.phone}`} className="flex-1 bg-green-50 text-green-600 font-bold py-3 rounded-xl hover:bg-green-100 transition-colors text-center text-sm">
                     اتصال بالكابتن
                   </a>
                   {['driver_assigned', 'driver_on_way'].includes(activeTrip.status) && (
                     <button onClick={cancelTrip} className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors text-center text-sm">
                       إلغاء الطلب
                     </button>
                   )}
                 </div>
               </div>
             )}
           </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col pointer-events-auto shrink-0 w-full md:w-96">
            <div className="p-3 flex justify-center border-b border-gray-50 flex-none shrink-0 touch-none cursor-grab active:cursor-grabbing">
               <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
            </div>
            
            <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
              {locationError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 shrink-0">
                  {locationError}
                </div>
              )}
              
              <div className="relative shrink-0">
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full mt-0 ${focusedField === 'pickup' ? 'bg-blue-500 shadow-md ring-2 ring-blue-200' : 'bg-gray-400'}`}></div>
                <input 
                  type="text" 
                  value={pickupAddress}
                  onFocus={() => setFocusedField('pickup')}
                  onChange={e => handleAddressChange('pickup', e.target.value)}
                  placeholder={gettingLocation ? "جاري التحديد..." : "موقع الانطلاق..."}
                  className={`w-full bg-gray-50 border rounded-2xl py-3.5 pr-10 pl-4 focus:outline-none transition-all text-sm font-bold ${focusedField === 'pickup' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}
                />
                <button 
                  onClick={handleGetLocation}
                  className="absolute top-2.5 left-2.5 p-1.5 bg-white shadow-sm border border-gray-100 rounded-xl text-blue-500 hover:text-blue-600 transition-colors"
                  title="تحديث موقعي"
                >
                  <Navigation size={18} />
                </button>
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white mt-1 border border-gray-100 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {pickupSuggestions.map((place, i) => (
                      <div 
                        key={i} 
                        onClick={() => selectSuggestion('pickup', place)}
                        className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-sm truncate font-bold text-gray-700"
                      >
                        {place.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative shrink-0">
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full mt-0 ${focusedField === 'destination' ? 'bg-red-500 shadow-md ring-2 ring-red-200' : 'bg-gray-400'}`}></div>
                <input 
                  type="text" 
                  value={destinationAddress}
                  onFocus={() => setFocusedField('destination')}
                  onChange={e => handleAddressChange('destination', e.target.value)}
                  placeholder="وين تريد تروح؟" 
                  className={`w-full bg-gray-50 border rounded-2xl py-3.5 pr-10 pl-4 focus:outline-none transition-all text-sm font-bold ${focusedField === 'destination' ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}`}
                />
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white mt-1 border border-gray-100 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {destinationSuggestions.map((place, i) => (
                      <div 
                        key={i} 
                        onClick={() => selectSuggestion('destination', place)}
                        className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-sm truncate font-bold text-gray-700"
                      >
                        {place.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {estimatedPrice && (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary-dark">
                      <span className="font-bold text-xs mt-1">IQD</span>
                    </div>
                    <span className="text-gray-500 font-bold text-xs">السعر التقديري</span>
                  </div>
                  <div className="text-xl font-black text-primary-dark tracking-tight">
                    {estimatedPrice.toLocaleString('en-US')} <span className="text-xs text-gray-500 font-bold">د.ع</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 pt-0 shrink-0 mt-auto bg-white rounded-b-3xl">
              <button 
                onClick={requestTrip}
                disabled={requestingTrip || !pickupAddress || !destinationAddress}
                className="w-full bg-primary-dark hover:bg-black text-white disabled:opacity-50 disabled:hover:bg-primary-dark font-bold py-4 rounded-xl shadow-xl transition-all transform active:scale-95 text-lg"
              >
                {requestingTrip ? 'جاري الطلب...' : 'احجز رحلتك الآن'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h3 className="font-bold text-xl text-primary-dark mb-2">رقم الهاتف مطلوب</h3>
            <p className="text-sm text-gray-500 mb-6">يرجى إضافة رقم هاتفك ليتمكن الكابتن من التواصل معك عند الوصول.</p>
            <input 
              type="tel" 
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="07X XXXX XXXX" 
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-accent-gold outline-none text-left dir-ltr mb-6"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSavePhone}
                disabled={savingPhone}
                className="flex-1 bg-accent-yellow text-primary-dark font-bold py-3.5 rounded-xl hover:bg-[#F2BD23] transition-colors"
              >
                {savingPhone ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
