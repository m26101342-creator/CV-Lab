import { initializeApp } from 'firebase/app';
import { 
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInAnonymously, 
    onAuthStateChanged as fbOnAuthStateChanged, User, signOut as fbSignOut,
    signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
    createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
    updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { 
    getFirestore, doc as fbDoc, setDoc as fbSetDoc, getDoc as fbGetDoc, 
    getDocs as fbGetDocs, addDoc as fbAddDoc, updateDoc as fbUpdateDoc, 
    deleteDoc as fbDeleteDoc, onSnapshot as fbOnSnapshot, query as fbQuery, 
    where as fbWhere, collection as fbCollection, serverTimestamp as fbServerTimestamp,
    getDocFromServer
} from 'firebase/firestore';
import { useState, useEffect } from 'react';

// Recommended: Use environment variables for production/GitHub deployments
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

let app: any = null;
let auth: any = {};
let db: any = null;
let googleProvider: any = null;
const isWebFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

try {
    if (isWebFirebaseConfigured) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

        // Connection test as per critical guidelines
        const testDoc = fbDoc(db, '_connection_test_', 'ping');
        getDocFromServer(testDoc).catch((error: any) => {
            if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
                console.warn("Firestore connection attempt: Client is offline or backend unavailable.");
            }
        });

        googleProvider = new GoogleAuthProvider();
    } else {
        console.warn("Firebase parameters not fully configured. Using a fully featured Local Storage Mock Sandbox on client-side.");
    }
} catch (error) {
    console.error("Firebase initialization failed, failing back to mock database:", error);
}

// -------------------------------------------------------------------------
// LOCAL STORAGE MOCK SYSTEM FOR OFFLINE DEVELOPMENT
// -------------------------------------------------------------------------

const listeners: Set<() => void> = new Set();
const notifyListeners = () => {
    listeners.forEach(cb => cb());
};

const getLocalDb = () => {
    try {
        const stored = localStorage.getItem('cv_lab_mock_db');
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

const saveLocalDb = (data: any) => {
    try {
        localStorage.setItem('cv_lab_mock_db', JSON.stringify(data));
        notifyListeners();
    } catch (e) {
        console.error("Failed to write mock state to localStorage", e);
    }
};

// Initial Default Mock State
const initMockDB = () => {
    const dbState = getLocalDb();
    let updated = false;
    if (!dbState.admin_settings) {
        dbState.admin_settings = {
            metrics: {
                realCVsCount: 9,
                realRevenue: 18000,
                meetingLink: 'https://meet.google.com/abc-defg-hij',
                cvPrice: 2000
            }
        };
        updated = true;
    }
    if (!dbState.admin_notes) {
        dbState.admin_notes = {
            'note_1': {
                text: "Bem-vindo ao painel de administração da CV LAB!",
                createdAt: new Date().toISOString()
            }
        };
        updated = true;
    }
    if (updated) {
        saveLocalDb(dbState);
    }
};
if (!isWebFirebaseConfigured) {
    initMockDB();
}

// Global Auth State Mocking
let mockUser: any = null;
const authListeners: Set<(user: any) => void> = new Set();
const notifyAuthListeners = () => {
    const userToPass = mockUser ? { ...mockUser } : null;
    authListeners.forEach(cb => cb(userToPass));
};

// Default sign-in anonymously inside sandbox if no configuration is found
if (!isWebFirebaseConfigured) {
    const savedUser = localStorage.getItem('cv_lab_mock_user');
    if (savedUser) {
        mockUser = JSON.parse(savedUser);
    } else {
        mockUser = {
            uid: `anon_${Math.random().toString(36).substring(2, 11)}`,
            email: 'anonymous',
            displayName: 'Convidado',
            isAnonymous: true
        };
        localStorage.setItem('cv_lab_mock_user', JSON.stringify(mockUser));
    }
}

// Auth wrappers
export const loginWithGoogle = async () => {
    if (isWebFirebaseConfigured && auth && googleProvider) {
        try {
            const res = await signInWithRedirect(auth, googleProvider);
            return res?.user;
        } catch (e: any) {
            console.error("Login failed:", e);
            if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/user-cancelled' || e.code === 'auth/cancelled-popup-request') {
                return null;
            }
            alert(`Ocorreu um erro no login do Google: ${e.message}`);
            return null;
        }
    } else {
        let email: string | null = null;
        try {
            email = window.prompt("Introduza o seu Email para Login com Google (Simulação):", "m26101342@gmail.com");
        } catch(e) {
            console.warn("window.prompt blocked. Using default admin.");
        }
        
        if (!email) {
            email = "m26101342@gmail.com";
        }
        
        console.log("[Mock Auth] Simulating login with Google for:", email);
        const adminList = [
            'ronalmaferreira04@icloud.com',
            'sumodemanga50@gmail.com',
            'm26101342@gmail.com'
        ];
        const isMockAdmin = adminList.includes(email.toLowerCase());
        mockUser = {
            uid: isMockAdmin ? 'admin_mock_123' : `user_mock_${Math.random().toString(36).substring(2, 11)}`,
            email: email,
            displayName: isMockAdmin ? 'Utilizador Admin' : email.split('@')[0],
            isAnonymous: false
        };
        localStorage.setItem('cv_lab_mock_user', JSON.stringify(mockUser));
        notifyAuthListeners();
        return mockUser;
    }
};

export const logOut = async () => {
    if (isWebFirebaseConfigured && auth) {
        try {
            await fbSignOut(auth);
        } catch (e) {
            console.error("Logout failed:", e);
        }
    } else {
        console.log("[Mock Auth] Logging out.");
        mockUser = {
            uid: `anon_${Math.random().toString(36).substring(2, 11)}`,
            email: 'anonymous',
            displayName: 'Convidado',
            isAnonymous: true
        };
        localStorage.setItem('cv_lab_mock_user', JSON.stringify(mockUser));
        notifyAuthListeners();
    }
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    if (isWebFirebaseConfigured) {
        return await fbCreateUserWithEmailAndPassword(authObj, email, pass);
    } else {
        console.log("[Mock Auth] Creating email password account: ", email);
        mockUser = {
            uid: `user_${Math.random().toString(36).substring(2, 11)}`,
            email: email,
            displayName: email.split('@')[0],
            isAnonymous: false
        };
        localStorage.setItem('cv_lab_mock_user', JSON.stringify(mockUser));
        notifyAuthListeners();
        return { user: mockUser };
    }
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    if (isWebFirebaseConfigured) {
        return await fbSignInWithEmailAndPassword(authObj, email, pass);
    } else {
        console.log("[Mock Auth] Logging in with email: ", email);
        mockUser = {
            uid: `user_${Math.random().toString(36).substring(2, 11)}`,
            email: email,
            displayName: email.split('@')[0],
            isAnonymous: false
        };
        localStorage.setItem('cv_lab_mock_user', JSON.stringify(mockUser));
        notifyAuthListeners();
        return { user: mockUser };
    }
};

export const updateProfile = async (userObj: any, profile: { displayName?: string }) => {
    if (isWebFirebaseConfigured) {
        return await fbUpdateProfile(userObj, profile);
    } else {
        console.log("[Mock Auth] Updating profile: ", profile);
        if (mockUser) {
            mockUser.displayName = profile.displayName || mockUser.displayName;
            localStorage.setItem('cv_lab_mock_user', JSON.stringify(mockUser));
        }
    }
};

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isWebFirebaseConfigured && auth) {
            const unsubscribe = fbOnAuthStateChanged(auth, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                    const adminEmails = [
                        'ronalmaferreira04@icloud.com',
                        'sumodemanga50@gmail.com',
                        'm26101342@gmail.com'
                    ];
                    const isHardcodedAdmin = currentUser.email ? adminEmails.includes(currentUser.email.toLowerCase()) : false;
                    setIsAdmin(isHardcodedAdmin);

                    try {
                        const userDocRef = fbDoc(db, 'users', currentUser.uid);
                        const userDoc = await fbGetDoc(userDocRef);
                        if (userDoc.exists()) {
                            if (userDoc.data().role === 'admin') setIsAdmin(true);
                        } else {
                            await fbSetDoc(userDocRef, {
                                email: currentUser.email || 'anonymous',
                                role: isHardcodedAdmin ? 'admin' : 'user',
                                createdAt: new Date().toISOString()
                            }, { merge: true });
                        }
                    } catch (error: any) {
                        if (!isHardcodedAdmin) setIsAdmin(false);
                    }
                } else {
                    try {
                        await signInAnonymously(auth);
                    } catch (err: any) {
                        console.error("Anonymous error:", err);
                    }
                    setUser(null);
                    setIsAdmin(false);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            // Local Mock Auth Triggering
            const handleMockChanged = (u: any) => {
                setUser(u);
                if (u && u.email) {
                    const admins = ['ronalmaferreira04@icloud.com', 'sumodemanga50@gmail.com', 'm26101342@gmail.com'];
                    setIsAdmin(admins.includes(u.email.toLowerCase()));
                } else {
                    setIsAdmin(false);
                }
                setLoading(false);
            };
            handleMockChanged(mockUser);
            authListeners.add(handleMockChanged);
            return () => {
                authListeners.delete(handleMockChanged);
            };
        }
    }, []);

    return { user, isAdmin, loading };
};

// Firestore wrappers & Mock SDK implementation
export { auth, db, googleProvider };

export const collection = (dbInstance: any, path: string) => {
    if (isWebFirebaseConfigured) return fbCollection(dbInstance, path);
    return { type: 'collection', path };
};

export const doc = (dbInstance: any, path: string, ...segments: string[]) => {
    if (isWebFirebaseConfigured) return fbDoc(dbInstance, path, ...segments);
    const fullPath = [path, ...segments].join('/');
    return { type: 'document', path: fullPath, collection: path, id: segments[segments.length - 1] };
};

export const query = (ref: any, ...constraints: any[]) => {
    if (isWebFirebaseConfigured) return fbQuery(ref, ...constraints);
    return { ...ref, constraints };
};

export const where = (field: string, op: any, val: any) => {
    if (isWebFirebaseConfigured) return fbWhere(field, op, val);
    return { type: 'where', field, op, val };
};

export const serverTimestamp = () => {
    if (isWebFirebaseConfigured) return fbServerTimestamp();
    return new Date().toISOString();
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
    if (isWebFirebaseConfigured) return await fbSetDoc(docRef, data, options);
    
    const dbState = getLocalDb();
    if (!dbState[docRef.collection]) {
        dbState[docRef.collection] = {};
    }
    const current = dbState[docRef.collection][docRef.id] || {};
    const updated = options?.merge ? { ...current, ...data } : data;
    
    dbState[docRef.collection][docRef.id] = updated;
    saveLocalDb(dbState);
    return { id: docRef.id };
};

export const addDoc = async (collRef: any, data: any) => {
    if (isWebFirebaseConfigured) return await fbAddDoc(collRef, data);
    
    const dbState = getLocalDb();
    if (!dbState[collRef.path]) {
        dbState[collRef.path] = {};
    }
    const docId = `doc_${Math.random().toString(36).substring(2, 11)}`;
    dbState[collRef.path][docId] = { id: docId, ...data };
    saveLocalDb(dbState);
    return { id: docId };
};

export const updateDoc = async (docRef: any, data: any) => {
    if (isWebFirebaseConfigured) return await fbUpdateDoc(docRef, data);
    
    const dbState = getLocalDb();
    if (!dbState[docRef.collection]) {
        dbState[docRef.collection] = {};
    }
    const current = dbState[docRef.collection][docRef.id] || {};
    dbState[docRef.collection][docRef.id] = { ...current, ...data };
    saveLocalDb(dbState);
};

export const deleteDoc = async (docRef: any) => {
    if (isWebFirebaseConfigured) return await fbDeleteDoc(docRef);
    
    const dbState = getLocalDb();
    if (dbState[docRef.collection]) {
        delete dbState[docRef.collection][docRef.id];
        saveLocalDb(dbState);
    }
};

export const getDoc = async (docRef: any) => {
    if (isWebFirebaseConfigured) return await fbGetDoc(docRef);
    
    const dbState = getLocalDb();
    const data = dbState[docRef.collection]?.[docRef.id];
    return {
        exists: () => !!data,
        data: () => data || null,
        id: docRef.id
    } as any;
};

export const getDocs = async (queryRef: any) => {
    if (isWebFirebaseConfigured) return await fbGetDocs(queryRef);
    
    const dbState = getLocalDb();
    const collectionName = queryRef.path || queryRef.id || '';
    const rawColl = dbState[collectionName] || {};
    let docs = Object.keys(rawColl).map(key => ({ id: key, ...rawColl[key] }));
    
    // Apply optional where constraints
    if (queryRef.constraints) {
        queryRef.constraints.forEach((c: any) => {
            if (c && c.type === 'where') {
                if (c.op === '==') {
                    docs = docs.filter(d => d[c.field] === c.val);
                }
            }
        });
    }
    
    return {
        docs: docs.map(d => ({
            id: d.id,
            data: () => d
        })),
        size: docs.length
    } as any;
};

export const onSnapshot = (ref: any, callback: (snapshot: any) => void, errorCallback?: (err: any) => void) => {
    if (isWebFirebaseConfigured) return fbOnSnapshot(ref, callback, errorCallback);
    
    const triggerCallback = () => {
        const dbState = getLocalDb();
        if (ref.type === 'document' || ref.id && ref.collection) {
            const data = dbState[ref.collection]?.[ref.id];
            callback({
                exists: () => !!data,
                data: () => data || null,
                id: ref.id
            });
        } else {
            const collectionName = ref.path || ref.id || '';
            const rawColl = dbState[collectionName] || {};
            let docs = Object.keys(rawColl).map(key => ({ id: key, ...rawColl[key] }));
            
            if (ref.constraints) {
                ref.constraints.forEach((c: any) => {
                    if (c && c.type === 'where') {
                        if (c.op === '==') {
                            docs = docs.filter(d => d[c.field] === c.val);
                        }
                    }
                });
            }
            callback({
                docs: docs.map(d => ({
                    id: d.id,
                    data: () => d
                })),
                size: docs.length
            });
        }
    };

    triggerCallback();
    listeners.add(triggerCallback);
    
    return () => {
        listeners.delete(triggerCallback);
    };
};
