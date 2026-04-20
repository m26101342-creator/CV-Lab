import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { useState, useEffect } from 'react';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
        if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/user-cancelled' || e.code === 'auth/cancelled-popup-request') {
            return; // Ignore user cancellation quietly
        }
        console.error("Login failed:", e);
    }
};

export const logOut = async () => {
    try {
        await signOut(auth);
    } catch (e) {
        console.error("Logout failed:", e);
    }
};

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Check if admin
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        setIsAdmin(userDoc.data().role === 'admin' || currentUser.email === 'suportecvlab@gmail.com');
                    } else {
                        // Create basic user profile if not exists
                        await setDoc(userDocRef, {
                            email: currentUser.email || 'anonymous',
                            role: currentUser.email === 'suportecvlab@gmail.com' ? 'admin' : 'user',
                            createdAt: new Date().toISOString()
                        }, { merge: true });
                        setIsAdmin(currentUser.email === 'suportecvlab@gmail.com');
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setIsAdmin(false);
                }
            } else {
                // Auto sign in anonymously for guests
                try {
                    await signInAnonymously(auth);
                } catch (err: any) {
                    if (err?.code === 'auth/admin-restricted-operation') {
                        console.warn('⚠️ AVISO: A autenticação "Anônima" está desativada no seu Firebase Console. Para que usuários possam fazer pedidos sem criar conta, vá ao Firebase > Authentication > Sign-in method e ative "Anonymous".');
                    } else {
                        console.error("Failed anonymous sign-in: ", err);
                    }
                }
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, isAdmin, loading };
};
