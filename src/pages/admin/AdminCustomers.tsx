import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { User, Phone, Mail, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    // Only get customers (not drivers or admins, but actually some drivers might have role='driver', so just getting role='customer')
    const q = query(collection(db, 'users'), where('role', '==', 'customer'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, 'users', id), {
        status: newStatus
      });
      toast.success(`تم ${newStatus === 'suspended' ? 'إيقاف' : 'تفعيل'} الحساب بنجاح`);
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء تحديث حالة الحساب');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-primary-dark">إدارة العملاء</h2>
        <div className="text-gray-500 font-bold bg-gray-50 px-4 py-2 rounded-xl">الإجمالي: {customers.length} عميل</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm">
                <th className="p-4 font-bold border-b border-gray-100 min-w-[200px]">العميل</th>
                <th className="p-4 font-bold border-b border-gray-100">معلومات الاتصال</th>
                <th className="p-4 font-bold border-b border-gray-100">تاريخ التسجيل</th>
                <th className="p-4 font-bold border-b border-gray-100 text-center">الحالة</th>
                <th className="p-4 font-bold border-b border-gray-100 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">لا يوجد عملاء حالياً</td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                          <User size={18} />
                        </div>
                        <span className="font-bold text-gray-800">{customer.name || 'بدون اسم'}</span>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dir-ltr justify-end">
                        {customer.phone || '-'} <Phone size={14} className="text-gray-400" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Mail size={14} className="text-gray-400" /> <span className="truncate max-w-[150px]">{customer.email || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500 dir-ltr text-right">
                       {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ar-IQ') : '-'}
                    </td>
                    <td className="p-4 text-center">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 justify-center ${customer.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                         {customer.status === 'suspended' ? 'موقوف' : 'نشط'}
                       </span>
                    </td>
                    <td className="p-4 text-center">
                       <button 
                         onClick={() => toggleStatus(customer.id, customer.status)}
                         className={`p-2 rounded-xl transition-colors ${customer.status === 'suspended' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                         title={customer.status === 'suspended' ? 'تفعيل الحساب' : 'إيقاف الحساب'}
                       >
                         {customer.status === 'suspended' ? <CheckCircle size={20} /> : <Ban size={20} />}
                       </button>
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
