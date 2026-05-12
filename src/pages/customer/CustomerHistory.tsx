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
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-lg">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Clock size={32} />
          </div>
          <p className="text-gray-500 font-medium">ليس لديك أي رحلات سابقة.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => (
            <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-accent-gold/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary-dark mb-1">
                    {new Date(trip.createdAt).toLocaleString('ar-IQ')}
                  </span>
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg w-max">
                    {trip.status === 'completed' ? 'مكتملة' : trip.status === 'cancelled' ? 'ملغية' : 'قيد التنفيذ'}
                  </span>
                </div>
                <div className="text-lg font-bold text-accent-gold">
                  {trip.estimatedPrice} د.ع
                </div>
              </div>
              
              <div className="relative pl-4 space-y-4">
                <div className="absolute right-[9px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <p className="text-sm text-gray-700">{trip.pickupAddress || 'موقع الانطلاق'}</p>
                </div>
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <MapPin size={12} className="text-red-500" />
                  </div>
                  <p className="text-sm text-gray-700">{trip.destinationAddress}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
