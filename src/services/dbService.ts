/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  Firestore
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SkinProfile, RoutineItem, SkinAnalysis } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const saveUserProfile = async (userId: string, profile: SkinProfile & { name: string }) => {
  const path = `users/${userId}`;
  try {
    const profileData = {
      ...profile,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', userId), profileData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProfile = async (userId: string): Promise<SkinProfile | null> => {
  const path = `users/${userId}`;
  try {
    const profileDoc = await getDoc(doc(db, 'users', userId));
    return profileDoc.exists() ? (profileDoc.data() as SkinProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const subscribeToRoutines = (userId: string, callback: (routines: RoutineItem[]) => void) => {
  const path = 'routines';
  const q = query(
    collection(db, 'routines'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoutineItem));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addRoutineProduct = async (userId: string, name: string, brand: string, type: 'morning' | 'night') => {
  const path = 'routines';
  try {
    await addDoc(collection(db, 'routines'), {
      userId,
      name,
      brand,
      completed: false,
      type,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateRoutineProductStatus = async (id: string, completed: boolean) => {
  const path = `routines/${id}`;
  try {
    await updateDoc(doc(db, 'routines', id), { completed });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const subscribeToAnalyses = (userId: string, callback: (analyses: any[]) => void) => {
  const path = 'analyses';
  const q = query(
    collection(db, 'analyses'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(7)
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveSkinAnalysis = async (userId: string, analysis: SkinAnalysis, photoUrl: string) => {
  const path = 'analyses';
  try {
    const analysisData = {
      ...analysis,
      userId,
      photoUrl,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'analyses'), analysisData);
    return analysisData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const subscribeToLatestAnalysis = (userId: string, callback: (analysis: any) => void) => {
  const path = 'analyses';
  const q = query(
    collection(db, 'analyses'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) callback(snapshot.docs[0].data());
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};
