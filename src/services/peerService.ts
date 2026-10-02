import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase.ts';
import { PeerPartner, WhiteboardStroke } from '../types.ts';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer.ts';

export interface RealPeerSessionData {
  id: string; // Session room code, e.g. "ROOM-8821" or uuid
  userA: {
    id: string;
    name: string;
    role: 'Driver' | 'Navigator';
    onlineStatus: string;
    lastPing: number;
    avatar?: string;
  };
  userB?: {
    id: string;
    name: string;
    role: 'Driver' | 'Navigator';
    onlineStatus: string;
    lastPing: number;
    avatar?: string;
  } | null;
  activeUnitId: string;
  dailyRoomUrl: string;
  sharedCode: string;
  lastCodeEditorId?: string;
  whiteboardStrokes: WhiteboardStroke[];
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    time: string;
  }>;
  consensusTestOption?: string | null;
  userAReady?: boolean;
  userBReady?: boolean;
  createdAt: number;
  updatedAt: number;
  isOpenToLobby?: boolean;
}

const LOCAL_STORAGE_PEER_SESSIONS = 'learning_os_peer_sessions';

export class PeerCollaborationService {
  private localSubscribers: Map<string, Set<(session: RealPeerSessionData | null) => void>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('learning_os_peer_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'session_update' && event.data.session) {
            const session = event.data.session as RealPeerSessionData;
            this.notifyLocalSubscribers(session.id, session);
          } else if (event.data && event.data.type === 'session_deleted' && event.data.sessionId) {
            this.notifyLocalSubscribers(event.data.sessionId, null);
          }
        };
      } catch (err) {
        console.debug('[PeerService] BroadcastChannel init note:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === LOCAL_STORAGE_PEER_SESSIONS && e.newValue) {
          try {
            const sessions: Record<string, RealPeerSessionData> = JSON.parse(e.newValue);
            for (const [sId, sData] of Object.entries(sessions)) {
              this.notifyLocalSubscribers(sId, sData);
            }
          } catch {}
        }
      });
    }
  }

  private hasValidFirestore(): boolean {
    return Boolean(isFirebaseConfigured && db && (db as any).type);
  }

  private getLocalSessions(): Record<string, RealPeerSessionData> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PEER_SESSIONS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveLocalSession(session: RealPeerSessionData) {
    try {
      const all = this.getLocalSessions();
      all[session.id] = session;
      localStorage.setItem(LOCAL_STORAGE_PEER_SESSIONS, JSON.stringify(all));
      this.broadcastChannel?.postMessage({ type: 'session_update', session });
      this.notifyLocalSubscribers(session.id, session);
    } catch (e) {
      console.warn('[PeerService] Local session save notice:', e);
    }
  }

  private removeLocalSession(sessionId: string) {
    try {
      const all = this.getLocalSessions();
      delete all[sessionId];
      localStorage.setItem(LOCAL_STORAGE_PEER_SESSIONS, JSON.stringify(all));
      this.broadcastChannel?.postMessage({ type: 'session_deleted', sessionId });
      this.notifyLocalSubscribers(sessionId, null);
    } catch {}
  }

  private notifyLocalSubscribers(sessionId: string, session: RealPeerSessionData | null) {
    const subs = this.localSubscribers.get(sessionId);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(session);
        } catch (err) {
          console.error('[PeerService] Subscriber callback error:', err);
        }
      });
    }
  }

  /**
   * Create a new collaborative room in Firestore with local fallback
   */
  public async createSession(
    user: { id: string; name: string; avatar?: string },
    unitId: string = 'unit-1',
    customCode?: string
  ): Promise<RealPeerSessionData> {
    const sessionCode = customCode ? customCode.trim().toUpperCase() : `OS-${Math.floor(1000 + Math.random() * 9000)}`;
    const roomName = `peer-${sessionCode.toLowerCase()}`;
    const dailyRoomUrl = `https://meet.jit.si/learning-os-${roomName}#config.prejoinPageEnabled=false`;

    const userAData: any = {
      id: user.id,
      name: user.name,
      role: 'Driver',
      onlineStatus: 'online',
      lastPing: Date.now(),
    };
    if (user.avatar) {
      userAData.avatar = user.avatar;
    }

    const sessionData: RealPeerSessionData = {
      id: sessionCode,
      userA: userAData,
      userB: null,
      activeUnitId: unitId,
      dailyRoomUrl,
      sharedCode: `// Реальная совместная сессия P2P: ${sessionCode}\n// Изменения кода синхронизируются в реальном времени!\n\nexport function solveCollaborativeTask() {\n  console.log("Напарник подключен к комнате ${sessionCode}");\n  return true;\n}`,
      whiteboardStrokes: [],
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'Система',
          text: `Комната ${sessionCode} создана. Поделитесь кодом комнаты или ссылкой со вторым студентом!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isOpenToLobby: true,
    };

    // Save locally first
    this.saveLocalSession(sessionData);

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionCode);
        if (customCode) {
          const snap = await getDoc(sessionRef);
          if (snap.exists()) {
            const existing = snap.data() as RealPeerSessionData;
            if (existing.userA?.id === user.id || existing.userB?.id === user.id) {
              return existing;
            }
          }
        }
        await setDoc(sessionRef, sanitizeFirestoreData(sessionData));
      } catch (err) {
        console.warn('[PeerService] Firestore sync error, running locally:', err);
      }
    }

    return sessionData;
  }

  /**
   * Join an existing real session by room code
   */
  public async joinSession(
    sessionCode: string,
    user: { id: string; name: string; avatar?: string }
  ): Promise<RealPeerSessionData | null> {
    const cleanCode = sessionCode.trim().toUpperCase();

    // Check local store first
    let data: RealPeerSessionData | null = this.getLocalSessions()[cleanCode] || null;

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', cleanCode);
        const snap = await getDoc(sessionRef);
        if (snap.exists()) {
          data = snap.data() as RealPeerSessionData;
        }
      } catch (err) {
        console.warn('[PeerService] Firestore joinSession fetch failed:', err);
      }
    }

    if (!data) {
      return null;
    }

    // If joining as User B (or re-joining)
    if (data.userA.id !== user.id) {
      const userBData: any = {
        id: user.id,
        name: user.name,
        role: data.userA.role === 'Driver' ? 'Navigator' : 'Driver',
        onlineStatus: 'online',
        lastPing: Date.now(),
      };
      if (user.avatar) {
        userBData.avatar = user.avatar;
      }

      data.userB = userBData;
      data.isOpenToLobby = false; // Room is full
      data.updatedAt = Date.now();

      // System message
      data.messages.push({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Система',
        text: `Студент ${user.name} успешно подключился! Совместный редактор и доска синхронизированы.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      this.saveLocalSession(data);

      if (this.hasValidFirestore()) {
        try {
          const sessionRef = doc(db, 'peer_sessions', cleanCode);
          await setDoc(sessionRef, sanitizeFirestoreData(data), { merge: true });
        } catch (err) {
          console.warn('[PeerService] Firestore join update notice:', err);
        }
      }
    }

    return data;
  }

  /**
   * Matchmaking: Find any open session in lobby or create one
   */
  public async findOrCreateLobbyMatch(
    user: { id: string; name: string; avatar?: string },
    unitId: string = 'unit-1'
  ): Promise<{ session: RealPeerSessionData; isNew: boolean }> {
    // 1. Try Firestore lobby
    if (this.hasValidFirestore()) {
      try {
        const peerCol = collection(db, 'peer_sessions');
        const q = query(peerCol, where('isOpenToLobby', '==', true));
        const snap = await getDocs(q);

        for (const docSnap of snap.docs) {
          const s = docSnap.data() as RealPeerSessionData;
          if (s.userA && s.userA.id !== user.id && (!s.userB || s.userB.id === user.id)) {
            const joined = await this.joinSession(s.id, user);
            if (joined) {
              return { session: joined, isNew: false };
            }
          }
        }
      } catch (err) {
        console.warn('Lobby matchmaking query failed, checking local:', err);
      }
    }

    // 2. Check local sessions open to lobby
    const local = this.getLocalSessions();
    for (const [id, s] of Object.entries(local)) {
      if (s.isOpenToLobby && s.userA && s.userA.id !== user.id && (!s.userB || s.userB.id === user.id)) {
        const joined = await this.joinSession(id, user);
        if (joined) {
          return { session: joined, isNew: false };
        }
      }
    }

    // 3. No open session found, create a new one waiting for partner
    const newSession = await this.createSession(user, unitId);
    return { session: newSession, isNew: true };
  }

  /**
   * Send live message to session
   */
  public async sendMessage(
    sessionId: string,
    message: { senderId: string; senderName: string; text: string }
  ) {
    if (!sessionId || !message.text.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const localSessions = this.getLocalSessions();
    const curr = localSessions[sessionId];
    if (curr) {
      curr.messages = [...(curr.messages || []), newMsg];
      curr.updatedAt = Date.now();
      this.saveLocalSession(curr);
    }

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        await updateDoc(sessionRef, {
          messages: arrayUnion(newMsg),
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn('Failed to send real-time peer message to Firestore:', err);
      }
    }
  }

  /**
   * Update shared code in real-time
   */
  public async updateCode(sessionId: string, code: string, senderId: string) {
    if (!sessionId) return;

    const localSessions = this.getLocalSessions();
    const curr = localSessions[sessionId];
    if (curr) {
      curr.sharedCode = code;
      curr.lastCodeEditorId = senderId;
      curr.updatedAt = Date.now();
      this.saveLocalSession(curr);
    }

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        await updateDoc(sessionRef, {
          sharedCode: code,
          lastCodeEditorId: senderId,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn('Failed to update shared code in Firestore:', err);
      }
    }
  }

  /**
   * Update real-time whiteboard strokes
   */
  public async updateWhiteboard(sessionId: string, strokes: WhiteboardStroke[]) {
    if (!sessionId) return;

    const localSessions = this.getLocalSessions();
    const curr = localSessions[sessionId];
    if (curr) {
      curr.whiteboardStrokes = strokes;
      curr.updatedAt = Date.now();
      this.saveLocalSession(curr);
    }

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        await updateDoc(sessionRef, {
          whiteboardStrokes: strokes,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn('Failed to update whiteboard strokes in Firestore:', err);
      }
    }
  }

  /**
   * Append a single stroke in real-time
   */
  public async addWhiteboardStroke(sessionId: string, stroke: WhiteboardStroke) {
    if (!sessionId) return;

    const localSessions = this.getLocalSessions();
    const curr = localSessions[sessionId];
    if (curr) {
      curr.whiteboardStrokes = [...(curr.whiteboardStrokes || []), stroke];
      curr.updatedAt = Date.now();
      this.saveLocalSession(curr);
    }

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        await updateDoc(sessionRef, {
          whiteboardStrokes: arrayUnion(stroke),
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn('Failed to add whiteboard stroke in Firestore:', err);
      }
    }
  }

  /**
   * Synchronize active learning unit across peer session
   */
  public async updateActiveUnit(sessionId: string, unitId: string) {
    if (!sessionId || !unitId) return;

    const localSessions = this.getLocalSessions();
    const curr = localSessions[sessionId];
    if (curr) {
      curr.activeUnitId = unitId;
      curr.updatedAt = Date.now();
      this.saveLocalSession(curr);
    }

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        await updateDoc(sessionRef, {
          activeUnitId: unitId,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn('Failed to update active unit in Firestore:', err);
      }
    }
  }

  /**
   * Switch roles (Driver <-> Navigator) between paired partners
   */
  public async swapRoles(sessionId: string, targetRole?: 'Driver' | 'Navigator') {
    if (!sessionId) return;

    const localSessions = this.getLocalSessions();
    const curr = localSessions[sessionId];
    if (curr) {
      if (targetRole) {
        if (curr.userA) curr.userA.role = targetRole;
        if (curr.userB) curr.userB.role = targetRole === 'Driver' ? 'Navigator' : 'Driver';
      } else {
        if (curr.userA && curr.userB) {
          const tempRole = curr.userA.role;
          curr.userA.role = curr.userB.role;
          curr.userB.role = tempRole;
        } else if (curr.userA) {
          curr.userA.role = curr.userA.role === 'Driver' ? 'Navigator' : 'Driver';
        }
      }
      curr.updatedAt = Date.now();
      this.saveLocalSession(curr);
    }

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        const snap = await getDoc(sessionRef);
        if (snap.exists()) {
          const data = snap.data() as RealPeerSessionData;
          const userARole = targetRole || (data.userA?.role === 'Driver' ? 'Navigator' : 'Driver');
          const userBRole = data.userB ? (userARole === 'Driver' ? 'Navigator' : 'Driver') : 'Navigator';
          await updateDoc(sessionRef, {
            'userA.role': userARole,
            'userB.role': userBRole,
            updatedAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn('Failed to swap peer roles in Firestore:', err);
      }
    }
  }

  /**
   * Dual-key consensus test selection
   */
  public async setTestConsensus(
    sessionId: string,
    optionId: string | null,
    userReadyKey: 'userAReady' | 'userBReady',
    isReady: boolean
  ) {
    if (!sessionId) return;

    const localSessions = this.getLocalSessions();
    const curr = localSessions[sessionId];
    if (curr) {
      const isOptionChanged = curr.consensusTestOption !== optionId;
      curr.consensusTestOption = optionId;
      curr[userReadyKey] = isReady;
      if (isOptionChanged) {
        const otherKey = userReadyKey === 'userAReady' ? 'userBReady' : 'userAReady';
        curr[otherKey] = false;
      }
      curr.updatedAt = Date.now();
      this.saveLocalSession(curr);
    }

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        const snap = await getDoc(sessionRef);
        const existingData = snap.exists() ? (snap.data() as RealPeerSessionData) : null;

        const isOptionChanged = existingData && existingData.consensusTestOption !== optionId;
        const payload: any = {
          consensusTestOption: optionId,
          [userReadyKey]: isReady,
          updatedAt: Date.now(),
        };

        if (isOptionChanged) {
          const otherKey = userReadyKey === 'userAReady' ? 'userBReady' : 'userAReady';
          payload[otherKey] = false;
        }

        await updateDoc(sessionRef, sanitizeFirestoreData(payload));
      } catch (err) {
        console.warn('Failed to update consensus in Firestore:', err);
      }
    }
  }

  /**
   * Subscribe to live updates of the session (Local + Cloud)
   */
  public subscribeToSession(
    sessionId: string,
    onUpdate: (session: RealPeerSessionData | null) => void
  ): () => void {
    if (!sessionId) return () => {};

    // Register local subscriber
    if (!this.localSubscribers.has(sessionId)) {
      this.localSubscribers.set(sessionId, new Set());
    }
    const subs = this.localSubscribers.get(sessionId)!;
    subs.add(onUpdate);

    // Initial state from local storage
    const initialLocal = this.getLocalSessions()[sessionId] || null;
    if (initialLocal) {
      onUpdate(initialLocal);
    }

    let unsubFirestore: (() => void) | null = null;
    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        unsubFirestore = onSnapshot(
          sessionRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as RealPeerSessionData;
              this.saveLocalSession(data);
              onUpdate(data);
            } else {
              onUpdate(null);
            }
          },
          (err) => {
            console.warn('Peer session snapshot listener notice:', err);
          }
        );
      } catch (err) {
        console.warn('Firestore subscription unavailable:', err);
      }
    }

    return () => {
      subs.delete(onUpdate);
      if (subs.size === 0) {
        this.localSubscribers.delete(sessionId);
      }
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  }

  /**
   * Disconnect from session
   */
  public async leaveSession(sessionId: string, userId: string) {
    if (!sessionId) return;

    const localSessions = this.getLocalSessions();
    const curr = localSessions[sessionId];
    if (curr) {
      if (curr.userB && curr.userB.id === userId) {
        curr.userB = null;
        curr.isOpenToLobby = true;
        curr.updatedAt = Date.now();
        this.saveLocalSession(curr);
      } else if (curr.userA && curr.userA.id === userId) {
        if (curr.userB) {
          curr.userA = curr.userB;
          curr.userB = null;
          curr.isOpenToLobby = true;
          curr.updatedAt = Date.now();
          this.saveLocalSession(curr);
        } else {
          this.removeLocalSession(sessionId);
        }
      }
    }

    if (this.hasValidFirestore()) {
      try {
        const sessionRef = doc(db, 'peer_sessions', sessionId);
        const snap = await getDoc(sessionRef);
        if (!snap.exists()) return;
        const data = snap.data() as RealPeerSessionData;

        if (data.userB && data.userB.id === userId) {
          await updateDoc(sessionRef, {
            userB: null,
            isOpenToLobby: true,
            updatedAt: Date.now(),
          });
        } else if (data.userA && data.userA.id === userId) {
          if (data.userB) {
            await updateDoc(sessionRef, {
              userA: data.userB,
              userB: null,
              isOpenToLobby: true,
              updatedAt: Date.now(),
            });
          } else {
            await deleteDoc(sessionRef);
          }
        }
      } catch (err) {
        console.warn('Failed to leave peer session in Firestore:', err);
      }
    }
  }
}

export const peerService = new PeerCollaborationService();
