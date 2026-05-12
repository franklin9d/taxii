import { create } from 'zustand';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

export type Role = 'customer' | 'driver' | 'admin';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'suspended';
  avatar?: string;
  createdAt: number;
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
      localStorage.setItem('pending_role', role);
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error(error);
      alert("حدث خطأ أثناء الانتقال لتسجيل الدخول: " + error.message);
      set({ loading: false });
    }
  },
  logout: async () => {
    await signOut(auth);
    set({ user: null, userData: null });
  }
}));

// Initialize auth state listener and handle redirect
const initializeAuth = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      const pendingRole = (localStorage.getItem('pending_role') as Role) || 'customer';
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newUserData: UserData = {
          id: user.uid,
          name: user.displayName || 'مستخدم جديد',
          email: user.email || '',
          phone: user.phoneNumber || '',
          role: pendingRole,
          status: 'active',
          avatar: user.photoURL || '',
          createdAt: Date.now()
        };
        await setDoc(userRef, newUserData).catch(e => {
          handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`);
          throw e;
        });
      }
      localStorage.removeItem('pending_role');
    }
  } catch (error: any) {
    console.error("Redirect Error:", error);
    if (error.code === 'auth/unauthorized-domain') {
      alert("عليك إضافة رابط Vercel الخاص بك في Firebase Console -> Authentication -> Settings -> Authorized Domains");
    }
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        const userSnap = await getDoc(userRef);
        // If document doesn't exist yet but user is authenticated, it might be mid-creation
        if (userSnap.exists()) {
          useAuthStore.setState({ user, userData: userSnap.data() as UserData, initialized: true });
        } else {
          // Wait briefly and try again if it's currently being created by getRedirectResult
          setTimeout(async () => {
            const retrySnap = await getDoc(userRef);
            if (retrySnap.exists()) {
              useAuthStore.setState({ user, userData: retrySnap.data() as UserData, initialized: true });
            } else {
              useAuthStore.setState({ user, userData: null, initialized: true });
            }
          }, 2000);
        }
      } catch (e) {
        useAuthStore.setState({ user, userData: null, initialized: true });
      }
    } else {
      useAuthStore.setState({ user: null, userData: null, initialized: true });
    }
  });
};

initializeAuth();
