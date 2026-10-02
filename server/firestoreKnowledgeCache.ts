import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load Firebase configuration
let db: any = null;
let isFirestoreAvailable = false;

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    const firebaseConfig = JSON.parse(configRaw);
    
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    isFirestoreAvailable = true;
    console.log('[Firestore Knowledge Cache] Initialized with database ID:', firebaseConfig.firestoreDatabaseId);
  }
} catch (err) {
  console.warn('[Firestore Knowledge Cache] Firebase init warning (using in-memory fallback):', err);
}

// Universal fast in-memory tier
const memoryCache = new Map<string, { data: any; timestamp: number }>();

export class FirestoreKnowledgeCache {
  /**
   * Normalize topic/query key for exact global matching
   */
  public static normalizeKey(rawKey: string): string {
    return (rawKey || '')
      .toLowerCase()
      .trim()
      .replace(/[\s\-_]+/g, '_')
      .replace(/[^a-z0-9_а-яё]/gi, '')
      .slice(0, 80);
  }

  /**
   * Generate robust hash for large document contents or prompts
   */
  public static hashContent(content: string, prefix = 'doc'): string {
    const hash = crypto.createHash('sha256').update(content.trim()).digest('hex').slice(0, 32);
    return `${prefix}_${hash}`;
  }

  /**
   * Get cached distilled lesson block from Firestore (or in-memory cache)
   */
  public static async getCachedLesson(topic: string, domain?: string): Promise<any | null> {
    const key = this.normalizeKey(topic);
    if (!key) return null;

    // 1. Fast in-memory check
    if (memoryCache.has(key)) {
      const entry = memoryCache.get(key);
      if (entry && Date.now() - entry.timestamp < 1000 * 60 * 60 * 24 * 7) {
        return entry.data;
      }
    }

    // 2. Shared Firestore database
    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'grounded_knowledge_cache', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          if (remoteData?.content) {
            memoryCache.set(key, { data: remoteData.content, timestamp: Date.now() });
            return remoteData.content;
          }
        }
      } catch (err: any) {
        console.warn(`[Firestore Knowledge Cache] Fetch failed for "${key}":`, err?.message || err);
      }
    }

    return null;
  }

  /**
   * Save distilled lesson block to Firestore for ALL users and AI agents
   */
  public static async saveCachedLesson(topic: string, content: any, domain?: string): Promise<void> {
    const key = this.normalizeKey(topic);
    if (!key || !content) return;

    // 1. Save in memory
    memoryCache.set(key, { data: content, timestamp: Date.now() });

    // 2. Save in Firestore
    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'grounded_knowledge_cache', key);
        await setDoc(docRef, {
          topicKey: key,
          originalTopic: topic,
          domain: domain || 'General Engineering',
          content,
          cachedAt: new Date().toISOString(),
          version: 2,
        }, { merge: true });
        console.log(`[Firestore Knowledge Cache] Persisted distilled lesson for "${key}"`);
      } catch (err: any) {
        console.warn(`[Firestore Knowledge Cache] Save failed for "${key}":`, err?.message || err);
      }
    }
  }

  /**
   * Get cached parsed document / PDF distillation
   */
  public static async getCachedDocumentEssence(contentOrKey: string): Promise<any | null> {
    const key = contentOrKey.startsWith('doc_') ? contentOrKey : this.hashContent(contentOrKey);
    
    // 1. Memory check
    if (memoryCache.has(key)) {
      const entry = memoryCache.get(key);
      if (entry && Date.now() - entry.timestamp < 1000 * 60 * 60 * 24 * 14) {
        return entry.data;
      }
    }

    // 2. Firestore check
    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'document_essence_cache', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.distilledEssence) {
            memoryCache.set(key, { data: data.distilledEssence, timestamp: Date.now() });
            return data.distilledEssence;
          }
        }
      } catch (err: any) {
        console.warn(`[Firestore Knowledge Cache] Doc fetch failed for "${key}":`, err?.message || err);
      }
    }
    return null;
  }

  /**
   * Save parsed document / PDF distillation to Firestore
   */
  public static async saveCachedDocumentEssence(
    contentOrKey: string, 
    distilledEssence: any, 
    metadata?: { filename?: string; title?: string; domain?: string }
  ): Promise<void> {
    const key = contentOrKey.startsWith('doc_') ? contentOrKey : this.hashContent(contentOrKey);
    if (!distilledEssence) return;

    memoryCache.set(key, { data: distilledEssence, timestamp: Date.now() });

    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'document_essence_cache', key);
        await setDoc(docRef, {
          key,
          filename: metadata?.filename || 'document',
          title: metadata?.title || 'Parsed Material',
          domain: metadata?.domain || 'General',
          distilledEssence,
          cachedAt: new Date().toISOString(),
          version: 2,
        }, { merge: true });
        console.log(`[Firestore Knowledge Cache] Persisted document essence for "${key}" (${metadata?.title || 'doc'})`);
      } catch (err: any) {
        console.warn(`[Firestore Knowledge Cache] Doc save failed for "${key}":`, err?.message || err);
      }
    }
  }

  /**
   * Check if Firestore is reachable
   */
  public static isConnected(): boolean {
    return isFirestoreAvailable && db !== null;
  }
}

/**
 * Shared Persistent Firestore Store for Community Rooms, Dedicated Whiteboards & Chat
 */
export class FirestoreCommunityStore {
  public static async getRooms(): Promise<any[]> {
    if (isFirestoreAvailable && db) {
      try {
        const colRef = collection(db, 'community_rooms');
        const q = query(colRef, limit(100));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data());
        }
      } catch (err: any) {
        console.warn('[Firestore Community] getRooms failed:', err?.message || err);
      }
    }
    return [];
  }

  public static async getRoom(roomId: string): Promise<any | null> {
    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'community_rooms', roomId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data();
        }
      } catch (err: any) {
        console.warn(`[Firestore Community] getRoom(${roomId}) failed:`, err?.message || err);
      }
    }
    return null;
  }

  public static async saveRoom(room: any): Promise<void> {
    if (isFirestoreAvailable && db && room?.id) {
      try {
        const docRef = doc(db, 'community_rooms', room.id);
        await setDoc(docRef, { ...room, lastSyncedAt: new Date().toISOString() }, { merge: true });
        console.log(`[Firestore Community] Room "${room.name}" saved to Firestore (${room.id})`);
      } catch (err: any) {
        console.warn(`[Firestore Community] saveRoom(${room.id}) failed:`, err?.message || err);
      }
    }
  }

  public static async deleteRoom(roomId: string): Promise<void> {
    if (isFirestoreAvailable && db && roomId) {
      try {
        const docRef = doc(db, 'community_rooms', roomId);
        await setDoc(docRef, { isDeleted: true, deletedAt: new Date().toISOString() }, { merge: true });
        console.log(`[Firestore Community] Room ${roomId} marked deleted in Firestore`);
      } catch (err: any) {
        console.warn(`[Firestore Community] deleteRoom(${roomId}) failed:`, err?.message || err);
      }
    }
  }

  public static async getWhiteboard(roomId: string): Promise<any | null> {
    if (isFirestoreAvailable && db && roomId) {
      try {
        const docRef = doc(db, 'community_whiteboards', roomId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          return {
            shapes: data.shapes || [],
            stickies: data.stickies || [],
            lastModified: data.lastModified || new Date().toISOString(),
          };
        }
      } catch (err: any) {
        console.warn(`[Firestore Community] getWhiteboard(${roomId}) failed:`, err?.message || err);
      }
    }
    return null;
  }

  public static async saveWhiteboard(roomId: string, whiteboardData: { shapes: any[]; stickies: any[]; lastModified?: string }): Promise<void> {
    if (isFirestoreAvailable && db && roomId) {
      try {
        const docRef = doc(db, 'community_whiteboards', roomId);
        await setDoc(docRef, {
          roomId,
          shapes: whiteboardData.shapes || [],
          stickies: whiteboardData.stickies || [],
          lastModified: whiteboardData.lastModified || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log(`[Firestore Community] Whiteboard for "${roomId}" (${whiteboardData.shapes?.length || 0} shapes) saved to Firestore`);
      } catch (err: any) {
        console.warn(`[Firestore Community] saveWhiteboard(${roomId}) failed:`, err?.message || err);
      }
    }
  }

  public static async getChatMessages(roomId: string): Promise<any[]> {
    if (isFirestoreAvailable && db && roomId) {
      try {
        const docRef = doc(db, 'community_chat', roomId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          return data.messages || [];
        }
      } catch (err: any) {
        console.warn(`[Firestore Community] getChatMessages(${roomId}) failed:`, err?.message || err);
      }
    }
    return [];
  }

  public static async saveChatMessage(roomId: string, message: any): Promise<void> {
    if (isFirestoreAvailable && db && roomId && message) {
      try {
        const docRef = doc(db, 'community_chat', roomId);
        const snap = await getDoc(docRef);
        let existingMessages: any[] = [];
        if (snap.exists()) {
          existingMessages = snap.data()?.messages || [];
        }
        if (!existingMessages.some((m: any) => m.id === message.id)) {
          existingMessages.push(message);
        }
        await setDoc(docRef, {
          roomId,
          messages: existingMessages.slice(-200),
          lastMessageAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[Firestore Community] saveChatMessage(${roomId}) failed:`, err?.message || err);
      }
    }
  }
}
