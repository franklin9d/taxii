import { create } from 'zustand';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

export type Role = 'customer' | 'driver' | 'admin';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'suspended' | 'pending_approval' | 'rejected';
  driverStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  avatar?: string;
  createdAt: number;
  driverInfo?: {
    carType: string;
    carModel: string;
    carColor: string;
    carNumber?: string;
    governorate?: string;
  };
  documents?: {
    nationalIdUrl?: string;
    drivingLicenseUrl?: string;
    carRegistrationUrl?: string;
    carFrontPhotoUrl?: string;
    carBackPhotoUrl?: string;
    personalPhotoUrl?: string;
  };
  driverApproved?: boolean;
}

interface AuthState {
  user: any;
  userData: UserData | null;
  loading: boolean;
  initialized: boolean;
  signInWithGoogle: (role?: Role) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userData: null,
  loading: false,
  initialized: false,
  updateUserData: (data: Partial<UserData>) => {
    set(state => ({
      userData: state.userData ? { ...state.userData, ...data } : null
    }));
  },
  signInWithGoogle: async (role: Role = 'customer') => {
    try {
      set({ loading: true });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let newUserData: UserData;
      if (!userSnap.exists()) {
        newUserData = {
          id: user.uid,
          name: user.displayName || 'مستخدم جديد',
          email: user.email || '',
          phone: user.phoneNumber || '',
          role: role,
          status: 'active',
          avatar: user.photoURL || '',
          createdAt: Date.now()
        };
        await setDoc(userRef, newUserData).catch(e => {
          handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`);
          throw e;
        });
        set({ userData: newUserData });
      } else {
        set({ userData: userSnap.data() as UserData });
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('تم إلغاء العملية. إذا لم تفتح نافذة الدخول، يرجى السماح بالنوافذ المنبثقة (Popups) في متصفحك.', { duration: 5000 });
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('تم حظر نافذة تسجيل الدخول! يرجى السماح بالنوافذ المنبثقة لهذا الموقع.', { duration: 5000 });
      } else if (error.code === 'auth/unauthorized-domain') {
        console.error('Unauthorized domain. Please add this domain to Firebase Auth Settings.');
        toast.error('حدث خطأ بالاتصال، يرجى تحديث الصفحة والمحاولة أُخرى.');
      } else {
        toast.error('حدث خطأ أثناء الاتصال، يرجى المحاولة لاحقاً.');
      }
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    await signOut(auth);
    set({ user: null, userData: null });
  }
}));

// Initialize auth state listener
let userUnsubscribe: (() => void) | null = null;

onAuthStateChanged(auth, async (user) => {
  if (userUnsubscribe) {
    userUnsubscribe();
    userUnsubscribe = null;
  }

  if (user) {
    const userRef = doc(db, 'users', user.uid);
    // Use real-time listener for user data
    userUnsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        useAuthStore.setState({ user, userData: snapshot.data() as UserData, initialized: true });
      } else {
        useAuthStore.setState({ user, userData: null, initialized: true });
      }
    }, (error) => {
      console.error("User data sync error:", error);
      useAuthStore.setState({ user, userData: null, initialized: true });
    });
  } else {
    useAuthStore.setState({ user: null, userData: null, initialized: true });
  }
});
