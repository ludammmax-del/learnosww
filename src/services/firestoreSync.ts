import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase.ts';
import { 
  DAGNode, 
  DAGEdge, 
  UserArtifact, 
  NoteItem, 
  TaskItem, 
  HabitItem, 
  AdminMaterial,
  LearningUnit
} from '../types.ts';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer.ts';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider?.providerId,
        email: provider?.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Context:', JSON.stringify(errInfo));
  return errInfo;
}

class FirestoreSyncService {
  private syncStatusListeners: Set<(status: SyncStatus, lastSyncTime?: Date) => void> = new Set();
  private currentStatus: SyncStatus = 'idle';
  private lastSyncTime: Date | null = null;
  private saveDebounceTimer: any = null;

  public subscribeStatus(listener: (status: SyncStatus, lastSyncTime?: Date) => void) {
    this.syncStatusListeners.add(listener);
    listener(this.currentStatus, this.lastSyncTime || undefined);
    return () => {
      this.syncStatusListeners.delete(listener);
    };
  }

  private notifyStatus(status: SyncStatus) {
    this.currentStatus = status;
    if (status === 'synced') {
      this.lastSyncTime = new Date();
    }
    this.syncStatusListeners.forEach((l) => l(status, this.lastSyncTime || undefined));
  }

  /**
   * Load all user state from Firestore
   */
  public async loadUserData(userId: string): Promise<{
    nodes?: DAGNode[];
    edges?: DAGEdge[];
    activeUnitId?: string;
    karma?: number;
    notes?: NoteItem[];
    tasks?: TaskItem[];
    habits?: HabitItem[];
    artifacts?: UserArtifact[];
    materials?: AdminMaterial[];
    surveyCompleted?: boolean;
    units?: Record<string, LearningUnit>;
  } | null> {
    if (!userId || !isFirebaseConfigured) return null;
    this.notifyStatus('syncing');

    try {
      // 1. Load Learning Path (DAG)
      const pathRef = doc(db, 'user_learning_paths', userId);
      const pathSnap = await getDoc(pathRef);
      const pathData = pathSnap.exists() ? pathSnap.data() : null;

      // 2. Load User Profile (Notes, Tasks, Habits, Karma)
      const profileRef = doc(db, 'user_profiles', userId);
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : null;

      // 3. Load User Artifacts
      const artifactsRef = collection(db, 'user_artifacts');
      const artifactsQuery = query(artifactsRef, where('userId', '==', userId));
      const artifactsSnap = await getDocs(artifactsQuery);
      const artifacts: UserArtifact[] = [];
      artifactsSnap.forEach((d) => {
        const item = d.data() as UserArtifact;
        if (item.id) artifacts.push(item);
      });

      // 4. Load Admin Materials (Global store)
      const materialsRef = collection(db, 'admin_materials');
      const materialsSnap = await getDocs(materialsRef);
      const materials: AdminMaterial[] = [];
      materialsSnap.forEach((d) => {
        const item = d.data() as AdminMaterial;
        if (item.id) materials.push(item);
      });

      // 5. Load this user's custom and adapted learning units
      const unitsRef = collection(db, 'user_learning_units', userId, 'units');
      const unitsSnap = await getDocs(unitsRef);
      const customUnits: Record<string, LearningUnit> = {};
      unitsSnap.forEach((d) => {
        const unit = d.data() as LearningUnit;
        if (unit.id) customUnits[unit.id] = unit;
      });

      this.notifyStatus('synced');

      return {
        nodes: pathData?.dagNodes,
        edges: pathData?.dagEdges,
        activeUnitId: pathData?.activeUnitId,
        karma: profileData?.karma,
        notes: profileData?.notes,
        tasks: profileData?.tasks,
        habits: profileData?.habits,
        surveyCompleted: profileData?.surveyCompleted,
        artifacts: artifacts.length > 0 ? artifacts : undefined,
        materials: materials.length > 0 ? materials : undefined,
        units: Object.keys(customUnits).length > 0 ? customUnits : undefined,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `user_learning_paths/${userId}`);
      this.notifyStatus('error');
      return null;
    }
  }

  /**
   * Debounced sync of learning path to Firestore
   */
  public async syncLearningPath(
    userId: string,
    nodes: DAGNode[],
    edges: DAGEdge[],
    activeUnitId: string
  ) {
    if (!userId || !isFirebaseConfigured) return;
    this.notifyStatus('syncing');

    clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(async () => {
      try {
        const pathRef = doc(db, 'user_learning_paths', userId);
        const payload = sanitizeFirestoreData({
          userId,
          dagNodes: nodes,
          dagEdges: edges,
          activeUnitId,
          updatedAt: new Date().toISOString(),
        });
        await setDoc(pathRef, payload, { merge: true });
        this.notifyStatus('synced');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `user_learning_paths/${userId}`);
        this.notifyStatus('error');
      }
    }, 1200);
  }

  /**
   * Sync user profile (karma, notes, tasks, habits, survey status)
   */
  public async syncUserProfile(
    userId: string,
    data: {
      karma?: number;
      notes?: NoteItem[];
      tasks?: TaskItem[];
      habits?: HabitItem[];
      surveyCompleted?: boolean;
      displayName?: string;
      email?: string;
    }
  ) {
    if (!userId || !isFirebaseConfigured) return;
    this.notifyStatus('syncing');

    try {
      const profileRef = doc(db, 'user_profiles', userId);
      const payload = sanitizeFirestoreData({
        userId,
        ...data,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(profileRef, payload, { merge: true });
      this.notifyStatus('synced');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `user_profiles/${userId}`);
      this.notifyStatus('error');
    }
  }

  /**
   * Save individual practical artifact to Firestore
   */
  public async saveArtifact(userId: string, artifact: UserArtifact) {
    if (!userId || !artifact?.id || !isFirebaseConfigured) return;
    this.notifyStatus('syncing');

    try {
      const artifactRef = doc(db, 'user_artifacts', artifact.id);
      const payload = sanitizeFirestoreData({
        ...artifact,
        userId,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(artifactRef, payload, { merge: true });
      this.notifyStatus('synced');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `user_artifacts/${artifact.id}`);
      this.notifyStatus('error');
    }
  }

  /**
   * Save individual learning unit (quiz, theory, project task) to Firestore
   */
  public async saveLearningUnit(unit: LearningUnit, userId: string) {
    if (!unit?.id || !userId || !isFirebaseConfigured) return;
    try {
      const unitRef = doc(db, 'user_learning_units', userId, 'units', unit.id);
      const payload = sanitizeFirestoreData({ ...unit, updatedAt: new Date().toISOString() });
      await setDoc(unitRef, payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `user_learning_units/${userId}/units/${unit.id}`);
    }
  }

  /**
   * Batch save multiple learning units
   */
  public async saveLearningUnits(units: Record<string, LearningUnit>, userId: string) {
    if (!units || !userId || !isFirebaseConfigured) return;
    const promises = Object.values(units).map((unit) => this.saveLearningUnit(unit, userId));
    await Promise.allSettled(promises);
  }

  /**
   * Save admin material to Firestore
   */
  public async saveAdminMaterial(material: AdminMaterial) {
    if (!material?.id || !isFirebaseConfigured) return;
    try {
      const matRef = doc(db, 'admin_materials', material.id);
      const payload = sanitizeFirestoreData({ ...material, updatedAt: new Date().toISOString() });
      await setDoc(matRef, payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admin_materials/${material.id}`);
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
