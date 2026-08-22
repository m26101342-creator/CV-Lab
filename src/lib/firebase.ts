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
import { OFFICIAL_HISTORICAL_DOCUMENTS } from '../data/historicalDocuments';
import { StaffAccessLink } from '../types';

// Recommended: Use environment variables for production/GitHub deployments or loaded config
const configs = (import.meta as any).glob('/**/firebase-applet-config.json', { eager: true });
const configsRel = (import.meta as any).glob('/firebase-applet-config.json', { eager: true });
const configKey = Object.keys(configs)[0] || Object.keys(configsRel)[0];
const localConfig: any = configKey ? ((configs[configKey] || configsRel[configKey]) as any).default || (configs[configKey] || configsRel[configKey]) : {};

const hardcodedAppletConfig = {
    apiKey: "AIzaSyCKPeNOpnM-vFq62UDVYqWNiaCtw-p3PeM",
    authDomain: "gen-lang-client-0327616587.firebaseapp.com",
    projectId: "gen-lang-client-0327616587",
    storageBucket: "gen-lang-client-0327616587.firebasestorage.app",
    messagingSenderId: "960055325094",
    appId: "1:960055325094:web:a37c71d8ca91c79f1c5f67",
    firestoreDatabaseId: "ai-studio-cvlab-7d5aa2da-bf15-47f1-a6a4-db530492ac34"
};

const firebaseConfig = {
    apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || localConfig.apiKey || hardcodedAppletConfig.apiKey,
    authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || hardcodedAppletConfig.authDomain,
    projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || hardcodedAppletConfig.projectId,
    storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || hardcodedAppletConfig.storageBucket,
    messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || hardcodedAppletConfig.messagingSenderId,
    appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || localConfig.appId || hardcodedAppletConfig.appId,
    firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId || hardcodedAppletConfig.firestoreDatabaseId
};

let app: any = null;
let auth: any = {};
let db: any = {};
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

export const DEFAULT_AUTHORIZED_EMAILS = [
    'ronalmaferreira04@icloud.com',
    'sumodemanga50@gmail.com',
    'm26101342@gmail.com'
];

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
        dbState.admin_settings = {};
    }
    if (!dbState.admin_settings.metrics) {
        dbState.admin_settings.metrics = {
            realCVsCount: 9,
            totalCVsGenerated: 9,
            totalLettersGenerated: 3,
            totalDocumentsGenerated: 12,
            realRevenue: 18000,
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            cvPrice: 2000,
            lastGeneratedAt: new Date().toISOString()
        };
        updated = true;
    }
    if (!dbState.admin_settings.access_control) {
        dbState.admin_settings.access_control = {
            authorizedEmails: DEFAULT_AUTHORIZED_EMAILS,
            updatedAt: new Date().toISOString()
        };
        updated = true;
    }
    if (!dbState.admin_notes) {
        dbState.admin_notes = {
            'note_1': {
                id: 'note_1',
                text: "Bem-vindo ao novo painel de administração da CV LAB! O arquivo de todos os CVs gerados e métricas automáticas estão em tempo real.",
                category: 'Aviso',
                author: 'Administrador',
                createdAt: new Date().toISOString()
            }
        };
        updated = true;
    }
    if (!dbState.generated_documents) {
        dbState.generated_documents = {};
        OFFICIAL_HISTORICAL_DOCUMENTS.forEach(docItem => {
            dbState.generated_documents[docItem.id] = { ...docItem };
        });
        updated = true;
    } else {
        // Guarantee all official historical records exist in database
        OFFICIAL_HISTORICAL_DOCUMENTS.forEach(docItem => {
            if (!dbState.generated_documents[docItem.id]) {
                dbState.generated_documents[docItem.id] = { ...docItem };
                updated = true;
            }
        });
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
            const res = await signInWithPopup(auth, googleProvider);
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
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authorizedEmails, setAuthorizedEmails] = useState<string[]>(DEFAULT_AUTHORIZED_EMAILS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let currentAuthEmails: string[] = DEFAULT_AUTHORIZED_EMAILS;
        let currentUserObj: any = null;

        const updateAuthStatus = (u: any, emailsList: string[]) => {
            if (!u || u.isAnonymous || !u.email) {
                setIsAdmin(false);
                setIsAuthorized(false);
                return;
            }
            const adminEmails = [
                'ronalmaferreira04@icloud.com',
                'sumodemanga50@gmail.com',
                'm26101342@gmail.com'
            ];
            const emailLower = u.email.toLowerCase();
            const isHardcodedAdmin = adminEmails.includes(emailLower);
            const isAuthEmail = emailsList.some(e => e.toLowerCase() === emailLower);

            setIsAdmin(isHardcodedAdmin);
            setIsAuthorized(isHardcodedAdmin || isAuthEmail);
        };

        // Load authorized emails in real-time
        const accessRef = doc(db, 'admin_settings', 'access_control');
        const unsubAccess = onSnapshot(accessRef, (snap: any) => {
            if (snap && snap.exists()) {
                const data = snap.data();
                if (data.authorizedEmails && Array.isArray(data.authorizedEmails)) {
                    currentAuthEmails = data.authorizedEmails;
                    setAuthorizedEmails(data.authorizedEmails);
                    updateAuthStatus(currentUserObj, data.authorizedEmails);
                }
            }
        }, (err: any) => {
            console.warn("access_control snapshot warning:", err);
        });

        if (isWebFirebaseConfigured && auth) {
            const unsubscribe = fbOnAuthStateChanged(auth, async (currentUser) => {
                currentUserObj = currentUser;
                if (currentUser && !currentUser.isAnonymous) {
                    setUser(currentUser);
                    updateAuthStatus(currentUser, currentAuthEmails);

                    try {
                        const userDocRef = fbDoc(db, 'users', currentUser.uid);
                        const userDoc = await fbGetDoc(userDocRef);
                        if (userDoc.exists()) {
                            if (userDoc.data().role === 'admin') setIsAdmin(true);
                            if (userDoc.data().isAuthorized === true) setIsAuthorized(true);
                        } else {
                            const adminEmails = [
                                'ronalmaferreira04@icloud.com',
                                'sumodemanga50@gmail.com',
                                'm26101342@gmail.com'
                            ];
                            const emailLower = (currentUser.email || '').toLowerCase();
                            const isHardcodedAdmin = adminEmails.includes(emailLower);
                            const isAuthEmail = currentAuthEmails.some(e => e.toLowerCase() === emailLower);

                            await fbSetDoc(userDocRef, {
                                email: currentUser.email || 'anonymous',
                                role: isHardcodedAdmin ? 'admin' : 'user',
                                isAuthorized: isHardcodedAdmin || isAuthEmail,
                                createdAt: new Date().toISOString()
                            }, { merge: true });
                        }
                    } catch (error: any) {
                        console.warn("User doc verification warning:", error);
                    }
                } else {
                    setUser(null);
                    setIsAdmin(false);
                    setIsAuthorized(false);
                }
                setLoading(false);
            });

            return () => {
                unsubscribe();
                unsubAccess();
            };
        } else {
            // Local Mock Auth Triggering
            const handleMockChanged = (u: any) => {
                currentUserObj = u;
                setUser(u);
                updateAuthStatus(u, currentAuthEmails);
                setLoading(false);
            };
            handleMockChanged(mockUser);
            authListeners.add(handleMockChanged);
            return () => {
                authListeners.delete(handleMockChanged);
                unsubAccess();
            };
        }
    }, []);

    return { user, isAdmin, isAuthorized, authorizedEmails, loading };
};

// Automatic Archiver and Counter
export const recordGeneratedDocument = async (docData: {
    type?: 'cv' | 'cover_letter' | 'combo' | string;
    candidateName: string;
    candidateTitle?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    template?: string;
    themeColor?: string;
    resumeData?: any;
    coverLetterText?: string;
    letterSubject?: string;
    generatedBy?: string;
    action?: string;
    price?: number;
    serviceType?: string;
}) => {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const fullDoc = {
        ...docData,
        id: docId,
        candidateName: docData.candidateName || docData.resumeData?.personalInfo?.fullName || 'Sem Nome',
        candidateEmail: docData.candidateEmail || docData.resumeData?.personalInfo?.email || 'sem-email@cvlab.ao',
        candidatePhone: docData.candidatePhone || docData.resumeData?.personalInfo?.phone || '',
        candidateTitle: docData.candidateTitle || docData.resumeData?.personalInfo?.title || 'Profissional',
        type: docData.type || 'cv',
        serviceType: docData.serviceType || (docData.type === 'cover_letter' ? 'cover_letter' : 'cv_normal'),
        price: docData.price || 2000,
        template: docData.template || docData.resumeData?.template || 't1_executive',
        themeColor: docData.themeColor || docData.resumeData?.themeColor || '#1E40AF',
        resumeData: docData.resumeData || null,
        coverLetterText: docData.coverLetterText || null,
        letterSubject: docData.letterSubject || null,
        createdAt: nowIso,
        updatedAt: nowIso,
        action: docData.action || 'Gerado no Sistema'
    };

    // 1. Local backup
    try {
        const rawLocal = localStorage.getItem('saved_client_resumes');
        let localList: any[] = rawLocal ? JSON.parse(rawLocal) : [];
        if (!Array.isArray(localList)) localList = [];
        localList.unshift(fullDoc);
        localStorage.setItem('saved_client_resumes', JSON.stringify(localList));
    } catch (e) {
        console.warn("Local storage save error:", e);
    }

    try {
        if (db) {
            await setDoc(doc(db, 'generated_documents', docId), fullDoc, { merge: true });
            await setDoc(doc(db, 'client_resumes', docId), fullDoc, { merge: true });
            
            // Auto update metrics in real-time
            const metricsRef = doc(db, 'admin_settings', 'metrics');
            const metricsSnap = await getDoc(metricsRef);
            const currentPrice = docData.price || 2000;
            if (metricsSnap && metricsSnap.exists()) {
                const cur = metricsSnap.data();
                const isCV = docData.type === 'cv' || docData.type === 'combo';
                const isLetter = docData.type === 'cover_letter' || docData.type === 'combo';
                const newCVsCount = (cur.realCVsCount || cur.totalCVsGenerated || 0) + (isCV ? 1 : 0);
                const newLettersCount = (cur.totalLettersGenerated || 0) + (isLetter ? 1 : 0);
                const newRevenue = (cur.realRevenue || 0) + (isCV ? currentPrice : 1000);
                
                await updateDoc(metricsRef, {
                    realCVsCount: newCVsCount,
                    totalCVsGenerated: newCVsCount,
                    totalLettersGenerated: newLettersCount,
                    totalDocumentsGenerated: (cur.totalDocumentsGenerated || (newCVsCount + newLettersCount)) + 1,
                    realRevenue: newRevenue,
                    lastGeneratedAt: nowIso
                });
            } else {
                await setDoc(metricsRef, {
                    realCVsCount: 10,
                    totalCVsGenerated: 10,
                    totalLettersGenerated: 4,
                    totalDocumentsGenerated: 14,
                    realRevenue: 20000,
                    meetingLink: 'https://meet.google.com/abc-defg-hij',
                    cvPrice: 2000,
                    lastGeneratedAt: nowIso
                });
            }
        }
    } catch (err) {
        console.error("Erro ao arquivar documento gerado automaticamente:", err);
    }
    return fullDoc;
};

// Save and Persist Full Editable Client CV and Accounting Entry
export const saveClientResume = async (clientData: {
    id?: string;
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    serviceType: string;
    price: number;
    paymentMethod?: string;
    paymentStatus?: 'paid' | 'pending';
    notes?: string;
    template?: string;
    resumeData: any;
    coverLetterText?: string;
    letterSubject?: string;
    themeColor?: string;
}) => {
    const docId = clientData.id || `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const record = {
        id: docId,
        candidateName: clientData.clientName || 'Cliente CV LAB',
        candidateEmail: clientData.clientEmail || '',
        candidatePhone: clientData.clientPhone || '',
        candidateTitle: clientData.resumeData?.personalInfo?.title || 'Profissional',
        type: clientData.serviceType === 'cover_letter' ? 'cover_letter' : 'cv',
        serviceType: clientData.serviceType || 'cv_normal',
        price: Number(clientData.price) || 2000,
        paymentMethod: clientData.paymentMethod || 'express',
        paymentStatus: clientData.paymentStatus || 'paid',
        notes: clientData.notes || '',
        template: clientData.template || clientData.resumeData?.template || 't1_executive',
        themeColor: clientData.themeColor || clientData.resumeData?.themeColor || '#1E40AF',
        resumeData: clientData.resumeData,
        coverLetterText: clientData.coverLetterText,
        letterSubject: clientData.letterSubject,
        createdAt: nowIso,
        updatedAt: nowIso,
        action: 'Salvo no Sistema'
    };

    // 1. Save to localStorage for instant local access
    try {
        const rawLocal = localStorage.getItem('saved_client_resumes');
        let localList: any[] = rawLocal ? JSON.parse(rawLocal) : [];
        if (!Array.isArray(localList)) localList = [];
        
        const existingIdx = localList.findIndex(item => item.id === docId || (item.candidateName && item.candidateName.toLowerCase() === record.candidateName.toLowerCase()));
        if (existingIdx >= 0) {
            localList[existingIdx] = { ...localList[existingIdx], ...record, updatedAt: nowIso };
        } else {
            localList.unshift(record);
        }
        localStorage.setItem('saved_client_resumes', JSON.stringify(localList));
    } catch (e) {
        console.warn("Local storage save error:", e);
    }

    // 2. Persist to Firestore generated_documents and client_resumes
    try {
        if (db) {
            await setDoc(doc(db, 'generated_documents', docId), record, { merge: true });
            await setDoc(doc(db, 'client_resumes', docId), record, { merge: true });

            // Update accounting metrics
            const metricsRef = doc(db, 'admin_settings', 'metrics');
            const metricsSnap = await getDoc(metricsRef);
            if (metricsSnap && metricsSnap.exists()) {
                const cur = metricsSnap.data();
                const isCV = record.type === 'cv';
                const isLetter = record.type === 'cover_letter';
                const newCVsCount = (cur.realCVsCount || cur.totalCVsGenerated || 0) + (isCV ? 1 : 0);
                const newLettersCount = (cur.totalLettersGenerated || 0) + (isLetter ? 1 : 0);
                const newRevenue = (cur.realRevenue || 0) + (record.price || 2000);
                
                await updateDoc(metricsRef, {
                    realCVsCount: newCVsCount,
                    totalCVsGenerated: newCVsCount,
                    totalLettersGenerated: newLettersCount,
                    totalDocumentsGenerated: (cur.totalDocumentsGenerated || (newCVsCount + newLettersCount)) + 1,
                    realRevenue: newRevenue,
                    lastGeneratedAt: nowIso
                });
            }
        }
    } catch (errDb) {
        console.error("Erro ao salvar cliente no Firestore:", errDb);
    }

    return record;
};

export const updateDocumentPaymentStatus = async (docId: string, paymentStatus: 'paid' | 'pending') => {
    const nowIso = new Date().toISOString();
    // 1. Update LocalStorage
    try {
        const rawLocal = localStorage.getItem('saved_client_resumes');
        if (rawLocal) {
            let localList: any[] = JSON.parse(rawLocal);
            if (Array.isArray(localList)) {
                localList = localList.map(item => {
                    if (item.id === docId) {
                        return { ...item, paymentStatus, updatedAt: nowIso };
                    }
                    return item;
                });
                localStorage.setItem('saved_client_resumes', JSON.stringify(localList));
            }
        }
    } catch (e) {
        console.warn("LocalStorage update payment status error:", e);
    }

    // 2. Update Firestore
    try {
        if (db) {
            await setDoc(doc(db, 'generated_documents', docId), { paymentStatus, updatedAt: nowIso }, { merge: true });
            await setDoc(doc(db, 'client_resumes', docId), { paymentStatus, updatedAt: nowIso }, { merge: true });
        }
    } catch (errDb) {
        console.error("Erro ao atualizar estado de pagamento no Firestore:", errDb);
    }
};

// -------------------------------------------------------------------------
// STAFF ACCESS LINKS MANAGER (24H / REVOCABLE LINKS FOR EMPLOYEES)
// -------------------------------------------------------------------------
export const createStaffAccessLink = async (
    name: string = 'Atendimento Funcionário',
    durationHours: number = 24,
    createdBy: string = 'Admin'
): Promise<StaffAccessLink> => {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const token = `stf_${randomSeed}_${Date.now().toString(36)}`;
    const nowMs = Date.now();
    const expiresMs = nowMs + Math.max(1, durationHours) * 3600 * 1000;
    
    const newLink: StaffAccessLink = {
        id: token,
        token: token,
        name: name.trim() || 'Link de Atendimento',
        createdAt: new Date(nowMs).toISOString(),
        expiresAt: new Date(expiresMs).toISOString(),
        durationHours: durationHours,
        isActive: true,
        createdBy: createdBy,
        accessCount: 0,
        lastUsedAt: null
    };

    try {
        if (db) {
            await setDoc(doc(db, 'staff_access_links', token), newLink, { merge: true });
        }
    } catch (err) {
        console.error("Erro ao guardar link de funcionário no Firestore:", err);
    }

    // Save to local storage cache
    try {
        const rawLocal = localStorage.getItem('cvlab_staff_access_links');
        let localList: StaffAccessLink[] = rawLocal ? JSON.parse(rawLocal) : [];
        if (!Array.isArray(localList)) localList = [];
        localList.unshift(newLink);
        localStorage.setItem('cvlab_staff_access_links', JSON.stringify(localList));
    } catch (e) {
        console.warn("LocalStorage error on staff link save:", e);
    }

    return newLink;
};

export const revokeStaffAccessLink = async (linkId: string): Promise<void> => {
    try {
        if (db) {
            await updateDoc(doc(db, 'staff_access_links', linkId), {
                isActive: false,
                revokedAt: new Date().toISOString()
            });
        }
    } catch (err) {
        console.error("Erro ao revogar link no Firestore:", err);
    }

    try {
        const rawLocal = localStorage.getItem('cvlab_staff_access_links');
        if (rawLocal) {
            let localList: StaffAccessLink[] = JSON.parse(rawLocal);
            if (Array.isArray(localList)) {
                localList = localList.map(item => item.id === linkId || item.token === linkId ? { ...item, isActive: false } : item);
                localStorage.setItem('cvlab_staff_access_links', JSON.stringify(localList));
            }
        }
    } catch (e) {
        console.warn("LocalStorage error on staff link revoke:", e);
    }
};

export const extendStaffAccessLink = async (linkId: string, additionalHours: number = 24): Promise<void> => {
    const newExpiresAt = new Date(Date.now() + Math.max(1, additionalHours) * 3600 * 1000).toISOString();
    try {
        if (db) {
            await updateDoc(doc(db, 'staff_access_links', linkId), {
                isActive: true,
                expiresAt: newExpiresAt,
                durationHours: additionalHours
            });
        }
    } catch (err) {
        console.error("Erro ao renovar link no Firestore:", err);
    }

    try {
        const rawLocal = localStorage.getItem('cvlab_staff_access_links');
        if (rawLocal) {
            let localList: StaffAccessLink[] = JSON.parse(rawLocal);
            if (Array.isArray(localList)) {
                localList = localList.map(item => item.id === linkId || item.token === linkId ? { ...item, isActive: true, expiresAt: newExpiresAt } : item);
                localStorage.setItem('cvlab_staff_access_links', JSON.stringify(localList));
            }
        }
    } catch (e) {
        console.warn("LocalStorage error on staff link extend:", e);
    }
};

export const deleteStaffAccessLink = async (linkId: string): Promise<void> => {
    try {
        if (db) {
            await deleteDoc(doc(db, 'staff_access_links', linkId));
        }
    } catch (err) {
        console.error("Erro ao eliminar link no Firestore:", err);
    }

    try {
        const rawLocal = localStorage.getItem('cvlab_staff_access_links');
        if (rawLocal) {
            let localList: StaffAccessLink[] = JSON.parse(rawLocal);
            if (Array.isArray(localList)) {
                localList = localList.filter(item => item.id !== linkId && item.token !== linkId);
                localStorage.setItem('cvlab_staff_access_links', JSON.stringify(localList));
            }
        }
    } catch (e) {
        console.warn("LocalStorage error on staff link delete:", e);
    }
};

export const validateStaffToken = async (token: string): Promise<{ valid: boolean; link?: StaffAccessLink; reason?: string }> => {
    if (!token || typeof token !== 'string') {
        return { valid: false, reason: 'token_invalid' };
    }

    let link: StaffAccessLink | null = null;

    // Check Firestore
    try {
        if (db) {
            const linkSnap = await getDoc(doc(db, 'staff_access_links', token));
            if (linkSnap && linkSnap.exists()) {
                link = { id: linkSnap.id, ...linkSnap.data() } as StaffAccessLink;
            }
        }
    } catch (e) {
        console.warn("Error fetching staff link from db:", e);
    }

    // Fallback to local storage if not found in db
    if (!link) {
        try {
            const rawLocal = localStorage.getItem('cvlab_staff_access_links');
            if (rawLocal) {
                const list: StaffAccessLink[] = JSON.parse(rawLocal);
                if (Array.isArray(list)) {
                    link = list.find(item => item.token === token || item.id === token) || null;
                }
            }
        } catch (e) {
            console.warn("Error reading local staff links:", e);
        }
    }

    if (!link) {
        return { valid: false, reason: 'não_encontrado' };
    }

    if (!link.isActive) {
        return { valid: false, link, reason: 'revogado' };
    }

    const now = Date.now();
    const expiry = new Date(link.expiresAt).getTime();
    if (isNaN(expiry) || expiry <= now) {
        return { valid: false, link, reason: 'expirado' };
    }

    // Increment access count & update last used
    const nowIso = new Date().toISOString();
    try {
        if (db) {
            await updateDoc(doc(db, 'staff_access_links', link.id || token), {
                accessCount: (link.accessCount || 0) + 1,
                lastUsedAt: nowIso
            });
        }
    } catch (e) {
        // silent fallback
    }

    return {
        valid: true,
        link: {
            ...link,
            accessCount: (link.accessCount || 0) + 1,
            lastUsedAt: nowIso
        }
    };
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
