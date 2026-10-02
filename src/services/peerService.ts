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
import { db } from '../firebase.ts';
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

class PeerCollaborationService {
  /**
   * Create a new real collaborative room in Firestore
   */
  public async createSession(
    user: { id: string; name: string; avatar?: string },
    unitId: string = 'unit-1',
    customCode?: string
  ): Promise<RealPeerSessionData> {
    const sessionCode = customCode ? customCode.trim().toUpperCase() : `OS-${Math.floor(1000 + Math.random() * 9000)}`;
    const sessionRef = doc(db, 'peer_sessions', sessionCode);

    // If custom code is provided, check if room already exists to prevent destructive overwriting
    if (customCode) {
      try {
        const existingSnap = await getDoc(sessionRef);
        if (existingSnap.exists()) {
          const existingData = existingSnap.data() as RealPeerSessionData;
          // If the caller is already userA or userB, return existing session intact
          if (existingData.userA?.id === user.id || existingData.userB?.id === user.id) {
            return existingData;
          }
          // If room is open for userB, join it cleanly
          if (!existingData.userB) {
            const joined = await this.joinSession(sessionCode, user);
            if (joined) return joined;
          }
        }
      } catch (err) {
        console.debug('Session existence check notice:', err);
      }
    }

    const roomName = `peer-${sessionCode.toLowerCase()}`;
    // Use instant Jitsi WebRTC room (never fails with "meeting does not exist" like expired Daily.co rooms)
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
      sharedCode: `// Реальная совместная сессия P2P: ${sessionCode}\n// Изменения кода синхронизируются в реальном времени через Firestore!\n\nexport function solveCollaborativeTask() {\n  console.log("Напарник подключен к комнате ${sessionCode}");\n  return true;\n}`,
      whiteboardStrokes: [],
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'Система',
          text: `Комната ${sessionCode} создана в облаке Firestore. Поделитесь кодом комнаты или ссылкой со вторым студентом!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isOpenToLobby: true,
    };

    await setDoc(sessionRef, sanitizeFirestoreData(sessionData));
    return sessionData;
  }

  /**
   * Join an existing real session in Firestore by room code
   */
  public async joinSession(
    sessionCode: string,
    user: { id: string; name: string; avatar?: string }
  ): Promise<RealPeerSessionData | null> {
    const cleanCode = sessionCode.trim().toUpperCase();
    const sessionRef = doc(db, 'peer_sessions', cleanCode);
    const snap = await getDoc(sessionRef);

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data() as RealPeerSessionData;

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

      await setDoc(sessionRef, sanitizeFirestoreData(data), { merge: true });
    }

    return data;
  }

  /**
   * Matchmaking: Find any open session in Firestore lobby or create one
   */
  public async findOrCreateLobbyMatch(
    user: { id: string; name: string; avatar?: string },
    unitId: string = 'unit-1'
  ): Promise<{ session: RealPeerSessionData; isNew: boolean }> {
    try {
      const peerCol = collection(db, 'peer_sessions');
      const q = query(peerCol, where('isOpenToLobby', '==', true));
      const snap = await getDocs(q);

      // Find first open session where userA is not current user
      for (const docSnap of snap.docs) {
        const s = docSnap.data() as RealPeerSessionData;
        if (s.userA && s.userA.id !== user.id && (!s.userB || s.userB.id === user.id)) {
          // Join this real open session!
          const joined = await this.joinSession(s.id, user);
          if (joined) {
            return { session: joined, isNew: false };
          }
        }
      }
    } catch (err) {
      console.warn('Lobby matchmaking query failed, creating new room:', err);
    }

    // No open session found, create a new one waiting for partner
    const newSession = await this.createSession(user, unitId);
    return { session: newSession, isNew: true };
  }

  /**
   * Send live message to session in Firestore
   */
  public async sendMessage(
    sessionId: string,
    message: { senderId: string; senderName: string; text: string }
  ) {
    if (!sessionId || !message.text.trim()) return;
    const sessionRef = doc(db, 'peer_sessions', sessionId);
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      await updateDoc(sessionRef, {
        messages: arrayUnion(newMsg),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to send real-time peer message:', err);
    }
  }

  /**
   * Update shared code in real-time
   */
  public async updateCode(sessionId: string, code: string, senderId: string) {
    if (!sessionId) return;
    const sessionRef = doc(db, 'peer_sessions', sessionId);
    try {
      await updateDoc(sessionRef, {
        sharedCode: code,
        lastCodeEditorId: senderId,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to update shared code:', err);
    }
  }

  /**
   * Update real-time whiteboard strokes
   */
  public async updateWhiteboard(sessionId: string, strokes: WhiteboardStroke[]) {
    if (!sessionId) return;
    const sessionRef = doc(db, 'peer_sessions', sessionId);
    try {
      await updateDoc(sessionRef, {
        whiteboardStrokes: strokes,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to update whiteboard strokes:', err);
    }
  }

  /**
   * Append a single stroke in real-time
   */
  public async addWhiteboardStroke(sessionId: string, stroke: WhiteboardStroke) {
    if (!sessionId) return;
    const sessionRef = doc(db, 'peer_sessions', sessionId);
    try {
      await updateDoc(sessionRef, {
        whiteboardStrokes: arrayUnion(stroke),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to add whiteboard stroke:', err);
    }
  }

  /**
   * Synchronize active learning unit across peer session
   */
  public async updateActiveUnit(sessionId: string, unitId: string) {
    if (!sessionId || !unitId) return;
    const sessionRef = doc(db, 'peer_sessions', sessionId);
    try {
      await updateDoc(sessionRef, {
        activeUnitId: unitId,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to update active unit in session:', err);
    }
  }

  /**
   * Switch roles (Driver <-> Navigator) between paired partners
   */
  public async swapRoles(sessionId: string, targetRole?: 'Driver' | 'Navigator') {
    if (!sessionId) return;
    const sessionRef = doc(db, 'peer_sessions', sessionId);
    try {
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) return;
      const data = snap.data() as RealPeerSessionData;

      if (targetRole) {
        if (data.userA) data.userA.role = targetRole;
        if (data.userB) data.userB.role = targetRole === 'Driver' ? 'Navigator' : 'Driver';
      } else {
        if (data.userA && data.userB) {
          const tempRole = data.userA.role;
          data.userA.role = data.userB.role;
          data.userB.role = tempRole;
        } else if (data.userA) {
          data.userA.role = data.userA.role === 'Driver' ? 'Navigator' : 'Driver';
        }
      }

      await updateDoc(sessionRef, {
        'userA.role': data.userA?.role || 'Driver',
        'userB.role': data.userB ? data.userB.role : 'Navigator',
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to swap peer roles:', err);
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
    const sessionRef = doc(db, 'peer_sessions', sessionId);
    try {
      const snap = await getDoc(sessionRef);
      const existingData = snap.exists() ? (snap.data() as RealPeerSessionData) : null;
      const isOptionChanged = existingData && existingData.consensusTestOption !== optionId;

      const payload: any = {
        consensusTestOption: optionId ?? null,
        [userReadyKey]: isReady,
        updatedAt: Date.now(),
      };

      // If option changed, reset other user's ready flag to ensure real 2-person consensus
      if (isOptionChanged) {
        const otherKey = userReadyKey === 'userAReady' ? 'userBReady' : 'userAReady';
        payload[otherKey] = false;
      }

      await updateDoc(sessionRef, sanitizeFirestoreData(payload));
    } catch (err) {
      console.warn('Failed to update consensus:', err);
    }
  }

  /**
   * Subscribe to live updates of the session
   */
  public subscribeToSession(
    sessionId: string,
    onUpdate: (session: RealPeerSessionData | null) => void
  ) {
    if (!sessionId) return () => {};
    const sessionRef = doc(db, 'peer_sessions', sessionId);
    return onSnapshot(
      sessionRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as RealPeerSessionData);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn('Peer session snapshot listener error:', err);
      }
    );
  }

  /**
   * Disconnect from session
   */
  public async leaveSession(sessionId: string, userId: string) {
    if (!sessionId) return;
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
          // Promote User B to User A
          await updateDoc(sessionRef, {
            userA: data.userB,
            userB: null,
            isOpenToLobby: true,
            updatedAt: Date.now(),
          });
        } else {
          // Empty session, delete
          await deleteDoc(sessionRef);
        }
      }
    } catch (err) {
      console.warn('Failed to leave peer session:', err);
    }
  }
}

export const peerService = new PeerCollaborationService();
