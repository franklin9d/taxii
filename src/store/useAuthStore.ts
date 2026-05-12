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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: false,
  initialized: false,
  signInWithGoogle: async (role: Role = 'customer') => {
    try {
      set({ loading: true });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef).catch(e => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));
      
      if (!userSnap.exists()) {
        const newUserData: UserData = {
          id: user.uid,
          name: user.displayName || 'مستخدم جديد',
          email: user.email || '',
          phone: user.phoneNumber || '',
          role: role,
          status: 'active',
          avatar: user.photoURL || '',
          createdAt: Date.now()
        };
        await setDoc(userRef, newUserData).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`));
        set({ userData: newUserData });
      } else {
        set({ userData: userSnap.data() as UserData });
      }
    } catch (error) {
      console.error(error);
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
      useAuthStore.setState({ user, userData: userSnap.data() as UserData, initialized: true });
    } catch (e) {
      useAuthStore.setState({ user, userData: null, initialized: true });
    }
  } else {
    useAuthStore.setState({ user: null, userData: null, initialized: true });
  }
});
