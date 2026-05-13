import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Map, Clock, Navigation } from 'lucide-react';

export function AdminRides() {
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRides(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'trips'));
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-primary-dark">سجل الرحلات</h2>
        <div className="text-gray-500 font-bold bg-gray-50 px-4 py-2 rounded-xl">الإجمالي: {rides.length} رحلة</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm">
                <th className="p-4 font-bold border-b border-gray-100">رقم الرحلة</th>
                <th className="p-4 font-bold border-b border-gray-100 min-w-[200px]">المسار</th>
                <th className="p-4 font-bold border-b border-gray-100">السعر والتفاصيل</th>
                <th className="p-4 font-bold border-b border-gray-100 text-center">تاريخ الرحلة</th>
                <th className="p-4 font-bold border-b border-gray-100 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Map className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">لا يوجد رحلات في السجل</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rides.map(ride => (
                  <tr key={ride.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                    <td className="p-4">
                      <div className="text-xs font-mono text-gray-400 select-all mb-1">{ride.id.substring(0,8)}...</div>
                    </td>
                    <td className="p-4 space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                        <span className="text-gray-700">{ride.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                        <span className="text-gray-700">{ride.destinationAddress}</span>
                      </div>
                    </td>
                    <td className="p-4 space-y-2">
                       <div className="font-bold text-gray-800">{ride.estimatedPrice} د.ع</div>
                       <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={12} /> {Math.round(ride.estimatedDuration / 60)} دقيقة</span>
                          <span className="flex items-center gap-1"><Navigation size={12} /> {(ride.estimatedDistance / 1000).toFixed(1)} كم</span>
                       </div>
                    </td>
                    <td className="p-4 text-center text-sm text-gray-500 dir-ltr font-mono">
                      {new Date(ride.createdAt).toLocaleString('ar-IQ')}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block min-w-[80px] ${
                        ride.status === 'completed' ? 'bg-green-50 text-green-600' :
                        ride.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                        ride.status === 'searching_for_driver' ? 'bg-blue-50 text-blue-600' :
                        'bg-accent-yellow/20 text-primary-dark'
                      }`}>
                        {ride.status === 'completed' ? 'مكتملة' : 
                         ride.status === 'cancelled' ? 'ملغية' : 
                         ride.status === 'searching_for_driver' ? 'تبحث عن سائق' : 
                         'في الطريق'
                        }
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
