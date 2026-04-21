import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { useState, useEffect } from 'react';

// Recommended: Use environment variables for production/GitHub deployments
// AI Studio automatically generates firebase-applet-config.json, which is now gitignored.
const configs = (import.meta as any).glob('../../firebase-applet-config.json', { eager: true });
const configKey = Object.keys(configs)[0];
const localConfig: any = configKey ? (configs[configKey] as any).default : {};

const firebaseConfig = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
    authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
    projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
    storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
    messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
    appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || localConfig.appId,
    firestoreDatabaseId: (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId
};

let app: any;
let auth: any;
let db: any;
let googleProvider: any;

try {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        
        // Initialize Firestore normally with explicit database ID
        db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

        // Connection test as per critical guidelines
        const testDoc = doc(db, '_connection_test_', 'ping');
        getDocFromServer(testDoc).catch((error: any) => {
            if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
                console.warn("Firestore connection attempt: Client is offline or backend unavailable. Retrying in background...");
            }
        });

        googleProvider = new GoogleAuthProvider();
    } else {
        console.warn("Firebase config is missing or invalid. Firebase services will be disabled.");
        auth = null;
        db = null;
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
    auth = null;
    db = null;
}

export { auth, db, googleProvider };

export const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
        console.error("Firebase Auth is not configured.");
        return;
    }
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
    if (!auth) return;
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
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                // Immediately check hardcoded admins
                const isHardcodedAdmin = currentUser.email === 'suportecvlab@gmail.com' || currentUser.email === 'm26101342@gmail.com';
                setIsAdmin(isHardcodedAdmin);

                // Check if admin in DB (for runtime role assignments)
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        if(userDoc.data().role === 'admin') setIsAdmin(true);
                    } else {
                        // Create basic user profile if not exists
                        await setDoc(userDocRef, {
                            email: currentUser.email || 'anonymous',
                            role: isHardcodedAdmin ? 'admin' : 'user',
                            createdAt: new Date().toISOString()
                        }, { merge: true });
                    }
                } catch (error: any) {
                    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
                        console.error("⚠️ Firestore Database não está acessível no seu projeto. Vá ao Firebase Console > Firestore Database e clique em 'Create database'.", error);
                    } else {
                        console.error("Error fetching user role:", error);
                    }
                    if(!isHardcodedAdmin) setIsAdmin(false);
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
