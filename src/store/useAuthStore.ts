import { create } from 'zustand';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

export type Role = 'customer' | 'driver' | 'admin';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'suspended' | 'pending_approval';
  avatar?: string;
  createdAt: number;
  driverInfo?: {
    carType: string;
    carModel: string;
    carColor: string;
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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userData: null,
  loading: false,
  initialized: false,
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
      if (error.code === 'auth/unauthorized-domain') {
        alert("عليك إضافة رابط Vercel (taxii-nine.vercel.app) في Firebase Console -> Authentication -> Settings -> Authorized Domains");
      } else {
        alert("حدث خطأ أثناء تسجيل الدخول: " + error.message);
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
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        useAuthStore.setState({ user, userData: userSnap.data() as UserData, initialized: true });
      } else {
        // give it a second in case it was just created
        setTimeout(async () => {
            const retrySnap = await getDoc(userRef);
            if (retrySnap.exists()) {
              useAuthStore.setState({ user, userData: retrySnap.data() as UserData, initialized: true });
            } else {
              useAuthStore.setState({ user: null, userData: null, initialized: true });
            }
        }, 1500);
      }
    } catch (e) {
      useAuthStore.setState({ user, userData: null, initialized: true });
    }
  } else {
    useAuthStore.setState({ user: null, userData: null, initialized: true });
  }
});
