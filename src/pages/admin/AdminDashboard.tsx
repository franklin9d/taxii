import { useState, useEffect } from 'react';
import { Users, Car, Map, CheckCircle } from 'lucide-react';
import { collection, onSnapshot, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    activeCustomers: 0,
    availableDrivers: 0,
    activeTrips: 0,
    pendingApprovals: 0
  });

  const [recentTrips, setRecentTrips] = useState<any[]>([]);

  useEffect(() => {
    // Basic stats gathering
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let activeCustomers = 0;
      let availableDrivers = 0;
      let pendingApprovals = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === 'customer') activeCustomers++;
        if (data.role === 'driver' || data.isOnline) availableDrivers++;
        if (data.status === 'pending_approval') pendingApprovals++;
      });
      
      setStats(prev => ({ ...prev, activeCustomers, availableDrivers, pendingApprovals }));
    });

    const qTrips = query(collection(db, 'trips'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeTrips = onSnapshot(qTrips, (snapshot) => {
      let active = 0;
      const tripsData = snapshot.docs.map(doc => {
        const t = doc.data();
        if (['searching_for_driver', 'driver_assigned', 'driver_on_way', 'driver_arrived', 'trip_started'].includes(t.status)) active++;
        return { id: doc.id, ...t };
      });
      setStats(prev => ({ ...prev, activeTrips: active }));
      setRecentTrips(tripsData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTrips();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary-dark tracking-tight">نظرة عامة على النظام</h2>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs font-bold mb-2">العملاء النشطون</p>
            <h3 className="text-4xl font-black text-primary-dark">{stats.activeCustomers}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
            <Users size={28} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs font-bold mb-2">السائقين المتاحين</p>
            <h3 className="text-4xl font-black text-primary-dark">{stats.availableDrivers}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-500 border border-green-100">
            <Car size={28} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs font-bold mb-2">الرحلات النشطة</p>
            <h3 className="text-4xl font-black text-primary-dark">{stats.activeTrips}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-accent-yellow/10 flex items-center justify-center text-accent-gold border border-accent-yellow/20">
            <Map size={28} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs font-bold mb-2">بانتظار الموافقة</p>
            <h3 className="text-4xl font-black text-primary-dark">{stats.pendingApprovals}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
            <CheckCircle size={28} />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-lg text-primary-dark flex items-center gap-2">
            آخر الطلبات
          </h3>
        </div>
        <div className="p-0">
          {recentTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Map className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد طلبات حالياً</p>
              <p className="text-gray-400 text-sm mt-2">ستظهر الطلبات الجديدة هنا عند وصولها</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="p-4 font-bold border-b border-gray-100">موقع الانطلاق</th>
                    <th className="p-4 font-bold border-b border-gray-100">الوجهة</th>
                    <th className="p-4 font-bold border-b border-gray-100">السعر</th>
                    <th className="p-4 font-bold border-b border-gray-100">الحالة</th>
                    <th className="p-4 font-bold border-b border-gray-100">تاريخ الطلب</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                      <td className="p-4 max-w-[200px] truncate">{trip.pickupAddress}</td>
                      <td className="p-4 max-w-[200px] truncate">{trip.destinationAddress}</td>
                      <td className="p-4 font-bold">{trip.estimatedPrice} د.ع</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          trip.status === 'completed' ? 'bg-green-50 text-green-600' :
                          trip.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                          trip.status === 'searching_for_driver' ? 'bg-blue-50 text-blue-600' :
                          'bg-accent-yellow/20 text-primary-dark'
                        }`}>
                          {trip.status === 'completed' ? 'مكتملة' : 
                           trip.status === 'cancelled' ? 'ملغية' : 
                           trip.status === 'searching_for_driver' ? 'تبحث عن سائق' : 
                           'نشطة'
                          }
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500 dir-ltr text-right">
                        {new Date(trip.createdAt).toLocaleString('ar-IQ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
