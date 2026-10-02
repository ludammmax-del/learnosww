/**
 * Real-time Collaborative Peer Cursor & Action Synchronization Service
 * Supports:
 * 1. Multi-tab BroadcastChannel (0ms local latency)
 * 2. Multi-client SSE Stream & HTTP Broadcast (/api/peer/collab/*)
 * 3. Distinct colored cursors (Local User = Neon Emerald, Partner = Royal Violet/Amber)
 * 4. Click ripple wave visualization
 * 5. Full action synchronization (one user clicks/acts -> shared across session)
 */

import { PeerPartner } from '../types.ts';
import { auth, db, doc, setDoc, onSnapshot } from '../firebase.ts';

export interface PeerCursor {
  userId: string;
  userName: string;
  role: 'Driver' | 'Navigator' | 'Peer';
  color: string;
  x: number; // 0 - 100 percentage of window
  y: number; // 0 - 100 percentage of window
  lastActive: number;
}

export interface ClickRipple {
  id: string;
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  timestamp: number;
  label?: string;
  targetSelector?: string;
  targetText?: string;
  targetAriaLabel?: string;
  executeRemoteClick?: boolean;
}

export interface SharedAction {
  actionType:
    | 'tab_change'
    | 'window_open'
    | 'window_close'
    | 'window_minimize'
    | 'window_maximize'
    | 'window_move'
    | 'window_resize'
    | 'window_focus'
    | 'window_tile'
    | 'widget_move'
    | 'widget_add'
    | 'widget_remove'
    | 'widget_collapse'
    | 'widget_arrange'
    | 'quiz_select'
    | 'code_update'
    | 'unit_select'
    | 'step_change'
    | 'task_toggle'
    | 'habit_toggle'
    | 'pomodoro_toggle'
    | 'pomodoro_reset'
    | 'whiteboard_clear'
    | 'whiteboard_element_add'
    | 'whiteboard_sticky_add'
    | 'room_chat_message'
    | 'custom';
  payload: any;
  senderId: string;
  senderName: string;
  timestamp: number;
  eventId?: string;
}

export interface WhiteboardStrokeBroadcast {
  id: string;
  points: number[];
  color: string;
  strokeWidth: number;
  tool: 'pen' | 'highlighter' | 'eraser';
  senderId: string;
  senderName: string;
}

type CursorListener = (cursors: Record<string, PeerCursor>) => void;
type RippleListener = (ripple: ClickRipple) => void;
type ActionListener = (action: SharedAction) => void;
type StrokeListener = (stroke: WhiteboardStrokeBroadcast) => void;
type HideCursorListener = (hideOwnCursor: boolean) => void;

class PeerCollabSyncManager {
  private clientId: string;
  private userName: string;
  private role: 'Driver' | 'Navigator' = 'Driver';
  private userColor: string = '#10b981'; // Neon Emerald for local user
  private roomId: string = 'team_workspace'; // Always connected to collaborative workspace or paired room!
  
  // Local user's cursor is regular and visible without highlight; only partner's cursor is highlighted
  private hideOwnCursor: boolean = false;
  private demoPartnerActive: boolean = false;
  private demoPartnerTimer: any = null;
  private demoPartnerT: number = 0;
  
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private firestoreUnsub: (() => void) | null = null;
  private lastFirestoreWindowMoveTime = 0;
  private lastFirestorePresenceWriteTime = 0;
  
  private cursors: Record<string, PeerCursor> = {};
  private lastActionTimestampBySender = new Map<string, number>();
  private seenSharedActionIds = new Set<string>();
  private cursorListeners: Set<CursorListener> = new Set();
  private rippleListeners: Set<RippleListener> = new Set();
  private actionListeners: Set<ActionListener> = new Set();
  private strokeListeners: Set<StrokeListener> = new Set();
  private hideCursorListeners: Set<HideCursorListener> = new Set();

  private roomListeners: Set<(roomId: string | null) => void> = new Set();
  private partnerJoinedListeners: Set<(partner: PeerPartner) => void> = new Set();

  private lastBroadcastTime = 0;
  private isConnected = false;
  private pruneTimer: any = null;
  private presenceTimeoutRef: any = null;

  constructor() {
    this.clientId = this.getOrCreateClientId();
    this.userName = this.getStoredUserName();
    if (typeof document !== 'undefined') {
      document.body.classList.remove('hide-self-cursor');
    }
    this.startPruneInterval();

    // Auto-restore active paired room from storage or default to team_workspace
    let initialRoom = 'team_workspace';
    try {
      const stored =
        sessionStorage.getItem('learning_os_peer_session_id') ||
        localStorage.getItem('learning_os_collab_room_id');
      if (stored && stored.trim()) {
        initialRoom = stored.trim();
      }
    } catch {}

    this.setRoomId(initialRoom);
  }

  public subscribeRoomId(listener: (roomId: string | null) => void): () => void {
    this.roomListeners.add(listener);
    listener(this.roomId);
    return () => {
      this.roomListeners.delete(listener);
    };
  }

  private notifyRoomListeners() {
    this.roomListeners.forEach((fn) => fn(this.roomId));
  }

  public subscribePartnerJoined(listener: (partner: PeerPartner) => void): () => void {
    this.partnerJoinedListeners.add(listener);
    return () => {
      this.partnerJoinedListeners.delete(listener);
    };
  }

  private notifyPartnerJoinedListeners(partner: PeerPartner) {
    this.partnerJoinedListeners.forEach((fn) => fn(partner));
  }

  public broadcastPresence() {
    if (!this.roomId) return;
    const announcePayload = {
      type: 'peer_announce',
      senderId: this.clientId,
      userId: this.clientId,
      userName: this.userName,
      role: this.role,
      color: this.userColor,
      roomId: this.roomId,
    };
    try {
      this.broadcastChannel?.postMessage(announcePayload);
    } catch {}
    fetch('/api/peer/collab/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: this.roomId, event: announcePayload, clientId: this.clientId }),
    }).catch(() => {});
    this.persistPresenceEvent(announcePayload);
  }

  private getOrCreateClientId(): string {
    try {
      const stored = sessionStorage.getItem('collab_peer_client_id');
      if (stored) return stored;
      const created = `peer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('collab_peer_client_id', created);
      return created;
    } catch {
      return `peer_${Date.now()}`;
    }
  }

  private getStoredUserName(): string {
    try {
      const user = localStorage.getItem('learning_os_user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.displayName || 'Вы';
      }
    } catch {}
    return 'Вы';
  }

  public setUserInfo(userName: string, role: 'Driver' | 'Navigator' = 'Driver', color: string = '#10b981') {
    this.userName = userName;
    this.role = role;
    this.userColor = color;
  }

  public getClientId(): string {
    return this.clientId;
  }

  public getUserColor(): string {
    return this.userColor;
  }

  private persistPresenceEvent(eventPayload: any) {
    if (!this.roomId) return;
    const authenticatedUserId = auth.currentUser?.uid;
    if (!authenticatedUserId) return;
    const now = Date.now();
    if (now - this.lastFirestorePresenceWriteTime < 1500) return;
    this.lastFirestorePresenceWriteTime = now;
    try {
      setDoc(
        doc(db, 'peer_sessions', this.roomId),
        {
          lastEvent: { ...eventPayload, senderUid: authenticatedUserId },
          updatedAt: now,
          senderId: authenticatedUserId,
        },
        { merge: true }
      ).catch(() => {});
    } catch {}
  }

  public setRoomId(newRoomId: string | null) {
    const targetRoom = newRoomId && newRoomId.trim() ? newRoomId.trim() : 'team_workspace';
    if (this.roomId === targetRoom && this.isConnected) return;

    if (this.presenceTimeoutRef) {
      clearTimeout(this.presenceTimeoutRef);
      this.presenceTimeoutRef = null;
    }

    if (this.firestoreUnsub) {
      try { this.firestoreUnsub(); } catch {}
      this.firestoreUnsub = null;
    }
    if (this.eventSource) {
      try { this.eventSource.close(); } catch {}
      this.eventSource = null;
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch {}
      this.broadcastChannel = null;
    }

    this.roomId = targetRoom;
    try {
      if (targetRoom !== 'team_workspace') {
        localStorage.setItem('learning_os_collab_room_id', targetRoom);
        sessionStorage.setItem('learning_os_peer_session_id', targetRoom);
      } else {
        localStorage.removeItem('learning_os_collab_room_id');
        sessionStorage.removeItem('learning_os_peer_session_id');
      }
    } catch {}

    this.cursors = {};
    this.notifyCursorListeners();
    this.notifyRoomListeners();
    this.initBroadcastChannel(targetRoom);
    this.connectStream(targetRoom);
    this.connectFirestoreSnapshot(targetRoom);

    // Announce presence immediately and after 350ms so other peers pair
    this.broadcastPresence();
    this.presenceTimeoutRef = setTimeout(() => {
      this.broadcastPresence();
      this.presenceTimeoutRef = null;
    }, 350);
  }

  public leaveRoom() {
    // When leaving a paired partner room, seamlessly return to the collaborative team workspace!
    this.setRoomId('team_workspace');
  }

  public getRoomId(): string | null {
    return this.roomId;
  }

  private initBroadcastChannel(roomId: string) {
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.close();
      }
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`learning_os_peer_${roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingEvent(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment:', e);
    }
  }

  private connectFirestoreSnapshot(roomId: string) {
    try {
      let hasSeenServerSnapshot = false;
      let lastEventTimestamp = 0;
      let lastEventId: string | null = null;
      this.firestoreUnsub = onSnapshot(doc(db, 'peer_sessions', roomId), { includeMetadataChanges: true }, (snap) => {
        if (snap.metadata.fromCache) return;
        const data = snap.exists() ? snap.data() : null;
        const eventTimestamp = Number(data?.lastEvent?.timestamp);
        const eventId = typeof data?.lastEvent?.eventId === 'string' ? data.lastEvent.eventId : null;
        if (!hasSeenServerSnapshot) {
          hasSeenServerSnapshot = true;
          if (Number.isFinite(eventTimestamp)) {
            lastEventTimestamp = eventTimestamp;
            lastEventId = eventId;
          }
          return;
        }
        if (!data?.lastEvent || !Number.isFinite(eventTimestamp)) return;
        if (eventTimestamp < lastEventTimestamp || (eventTimestamp === lastEventTimestamp && eventId === lastEventId)) return;
        lastEventTimestamp = eventTimestamp;
        lastEventId = eventId;
        if (data.lastEvent.senderUid !== auth.currentUser?.uid) {
          this.handleIncomingEvent(data.lastEvent);
        }
      }, (err) => {
        console.debug('Firestore peer collab snapshot notice:', err.message);
      });
    } catch (e) {
      console.debug('Firestore collab attach notice:', e);
    }
  }

  private sseErrorCount = 0;
  private sseDisabled = false;

  private connectStream(roomId: string) {
    if (this.sseDisabled) return;
    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      const sse = new EventSource(`/api/peer/collab/stream/${encodeURIComponent(roomId)}?userId=${encodeURIComponent(this.clientId)}`);
      this.eventSource = sse;

      sse.onopen = () => {
        this.isConnected = true;
        this.sseErrorCount = 0;
      };

      sse.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          this.handleIncomingEvent(data);
        } catch {}
      };

      sse.onerror = () => {
        this.isConnected = false;
        this.sseErrorCount += 1;
        // If serverless environment drops SSE or returns connection error, disable SSE after 2 attempts
        // and fall back cleanly to Firestore & BroadcastChannel
        if (this.sseErrorCount >= 2) {
          this.sseDisabled = true;
          try {
            sse.close();
          } catch {}
          this.eventSource = null;
        }
      };
    } catch {
      this.sseDisabled = true;
      this.isConnected = false;
    }
  }

  private handleIncomingEvent(data: any) {
    if (!data) return;
    if (data.senderId === this.clientId) return; // Don't echo own events

    if (data.type === 'shared_action' && data.senderId) {
      const timestamp = Number(data.timestamp);
      const eventId = typeof data.eventId === 'string' ? data.eventId : null;
      const previousTimestamp = this.lastActionTimestampBySender.get(data.senderId);
      if (eventId && this.seenSharedActionIds.has(eventId)) return;
      if (Number.isFinite(timestamp) && previousTimestamp !== undefined && timestamp < previousTimestamp) return;
      if (eventId) {
        this.seenSharedActionIds.add(eventId);
        if (this.seenSharedActionIds.size > 256) {
          const oldestEventId = this.seenSharedActionIds.values().next().value;
          if (oldestEventId) this.seenSharedActionIds.delete(oldestEventId);
        }
      }
      if (Number.isFinite(timestamp)) {
        this.lastActionTimestampBySender.set(data.senderId, Math.max(previousTimestamp || 0, timestamp));
        if (this.lastActionTimestampBySender.size > 128) {
          const oldestSender = this.lastActionTimestampBySender.keys().next().value;
          if (oldestSender) this.lastActionTimestampBySender.delete(oldestSender);
        }
      }
    }

    if (data.type === 'peer_announce') {
      // Remote peer joined this paired room!
      const cursor: PeerCursor = {
        userId: data.userId,
        userName: data.userName || 'Напарник',
        role: data.role || 'Navigator',
        color: data.color || '#8b5cf6',
        x: data.x || 50,
        y: data.y || 50,
        lastActive: Date.now(),
      };
      this.cursors[data.userId] = cursor;
      this.notifyCursorListeners();

      this.notifyPartnerJoinedListeners({
        id: data.userId,
        name: (data.userName || data.name || '').trim() || 'Напарник',
        avatar: data.avatar || '',
        userLevel: 'intermediate',
        skillDomain: 'Коллаборация',
        targetGoal: 'Парная практика и калибровка',
        matchScore: 99,
        onlineStatus: 'online',
        role: data.role === 'Driver' ? 'Navigator' : 'Driver',
        roomCode: this.roomId || undefined,
        dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${(this.roomId || 'p2p').toLowerCase()}#config.prejoinPageEnabled=false`,
      });

      // Reply with targeted welcome so specifically the newly announced peer registers us (prevents ping-pong loop)
      const welcomePayload = {
        type: 'peer_welcome',
        targetUserId: data.userId,
        senderId: this.clientId,
        userId: this.clientId,
        userName: this.userName,
        role: this.role,
        color: this.userColor,
        roomId: this.roomId,
      };
      try {
        this.broadcastChannel?.postMessage(welcomePayload);
      } catch {}
      if (this.roomId) {
        fetch('/api/peer/collab/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: this.roomId, event: welcomePayload, clientId: this.clientId }),
        }).catch(() => {});
      }
    } else if (data.type === 'peer_welcome') {
      // Ignore welcome if targeted specifically to another client in a multi-peer session
      if (data.targetUserId && data.targetUserId !== this.clientId) return;

      const cursor: PeerCursor = {
        userId: data.userId,
        userName: (data.userName || data.name || '').trim() || 'Напарник',
        role: data.role || 'Driver',
        color: data.color || '#8b5cf6',
        x: data.x || 50,
        y: data.y || 50,
        lastActive: Date.now(),
      };
      this.cursors[data.userId] = cursor;
      this.notifyCursorListeners();

      this.notifyPartnerJoinedListeners({
        id: data.userId,
        name: (data.userName || data.name || '').trim() || 'Напарник',
        avatar: data.avatar || '',
        userLevel: 'intermediate',
        skillDomain: 'Коллаборация',
        targetGoal: 'Парная практика и калибровка',
        matchScore: 99,
        onlineStatus: 'online',
        role: data.role,
        roomCode: this.roomId || undefined,
        dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${(this.roomId || 'p2p').toLowerCase()}#config.prejoinPageEnabled=false`,
      });
    } else if (data.type === 'cursor_move') {
      const cursor: PeerCursor = {
        userId: data.userId,
        userName: data.userName || 'Напарник',
        role: data.role || 'Navigator',
        color: data.color || '#8b5cf6', // Violet
        x: data.x,
        y: data.y,
        lastActive: Date.now(),
      };
      this.cursors[data.userId] = cursor;
      this.notifyCursorListeners();
    } else if (data.type === 'click_ripple') {
      const ripple: ClickRipple = {
        id: data.id || `rip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: data.userId || data.senderId,
        userName: data.userName || 'Напарник',
        color: data.color || '#8b5cf6',
        x: data.x,
        y: data.y,
        timestamp: data.timestamp || Date.now(),
        label: data.label,
        targetSelector: data.targetSelector,
        targetText: data.targetText,
        targetAriaLabel: data.targetAriaLabel,
        executeRemoteClick: data.executeRemoteClick !== false,
      };
      this.notifyRippleListeners(ripple);
    } else if (data.type === 'shared_action') {
      const action: SharedAction = {
        actionType: data.actionType,
        payload: data.payload,
        senderId: data.senderId,
        senderName: data.senderName,
        timestamp: data.timestamp || Date.now(),
      };
      this.notifyActionListeners(action);
    } else if (data.type === 'whiteboard_stroke') {
      const stroke: WhiteboardStrokeBroadcast = {
        id: data.id,
        points: data.points,
        color: data.color,
        strokeWidth: data.strokeWidth,
        tool: data.tool,
        senderId: data.senderId,
        senderName: data.senderName,
      };
      this.notifyStrokeListeners(stroke);
    }
  }

  public updateLocalCursor(xPct: number, yPct: number) {
    if (!this.roomId && !this.demoPartnerActive) return;
    const now = Date.now();

    // Do NOT store own client cursor in this.cursors to avoid phantom self-cursor in UI
    if (this.cursors[this.clientId]) {
      delete this.cursors[this.clientId];
      this.notifyCursorListeners();
    }

    if (!this.roomId) return;

    // Throttle local multi-tab broadcast to ~40ms
    if (now - this.lastBroadcastTime < 40) return;
    this.lastBroadcastTime = now;

    const eventPayload = {
      type: 'cursor_move',
      senderId: this.clientId,
      userId: this.clientId,
      userName: this.userName,
      role: this.role,
      color: this.userColor,
      x: xPct,
      y: yPct,
    };

    // 1. BroadcastChannel (0ms local multi-tab, zero network overhead)
    try {
      this.broadcastChannel?.postMessage(eventPayload);
    } catch {}

    // 2. Server broadcast endpoint only if SSE stream is connected and room is active
    if (this.isConnected && !this.sseDisabled) {
      try {
        fetch('/api/peer/collab/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: this.roomId, event: eventPayload, clientId: this.clientId }),
        }).catch(() => {});
      } catch {}
    }
    this.persistPresenceEvent(eventPayload);
  }

  public broadcastClick(
    xPct: number,
    yPct: number,
    label?: string,
    targetSelector?: string,
    executeRemoteClick: boolean = true,
    targetText?: string,
    targetAriaLabel?: string
  ) {
    if (!this.roomId && !this.demoPartnerActive) return;
    const clickId = `rip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventPayload = {
      id: clickId,
      type: 'click_ripple',
      senderId: this.clientId,
      userId: this.clientId,
      userName: this.userName,
      color: this.userColor,
      x: xPct,
      y: yPct,
      label,
      targetSelector,
      targetText,
      targetAriaLabel,
      executeRemoteClick,
      timestamp: Date.now(),
    };

    try {
      this.broadcastChannel?.postMessage(eventPayload);
    } catch {}

    if (this.roomId) {
      try {
        fetch('/api/peer/collab/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: this.roomId, event: eventPayload, clientId: this.clientId }),
        }).catch(() => {});
      } catch {}
      // High-frequency click ripples are distributed real-time via SSE and BroadcastChannel,
      // avoiding redundant Firestore write limits (1 write/sec).
    }
  }

  public broadcastAction(actionType: SharedAction['actionType'], payload: any) {
    if (!this.roomId) return;
    const now = Date.now();
    const action: SharedAction = {
      actionType,
      payload,
      senderId: this.clientId,
      senderName: this.userName,
      timestamp: now,
      eventId: `${this.clientId}:${now}:${Math.random().toString(36).slice(2, 8)}`,
    };

    const eventPayload = {
      type: 'shared_action',
      eventId: action.eventId,
      senderId: this.clientId,
      senderName: this.userName,
      actionType,
      payload,
      timestamp: now,
    };

    try {
      this.broadcastChannel?.postMessage(eventPayload);
    } catch {}

    try {
      fetch('/api/peer/collab/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: this.roomId, event: eventPayload, clientId: this.clientId }),
      }).catch(() => {});
    } catch {}

    if (this.roomId) {
      // Respect Firestore limit of 1 write/sec per document:
      // High-frequency drag moves are streamed real-time via SSE / BroadcastChannel.
      // Only write discrete actions or drag ends with a minimum 1.5s interval to Firestore.
      const isDragging = actionType === 'window_move' && payload?.isDragging;
      if (isDragging) {
        return;
      }
      const authenticatedUserId = auth.currentUser?.uid;
      if (!authenticatedUserId || now - this.lastFirestoreWindowMoveTime < 1500) {
        return;
      }
      this.lastFirestoreWindowMoveTime = now;
      try {
        setDoc(
          doc(db, 'peer_sessions', this.roomId),
          {
            lastEvent: { ...eventPayload, senderUid: authenticatedUserId },
            updatedAt: now,
            senderId: authenticatedUserId,
          },
          { merge: true }
        ).catch(() => {});
      } catch {}
    }
  }

  public broadcastWindowAction(
    actionType:
      | 'window_open'
      | 'window_close'
      | 'window_minimize'
      | 'window_maximize'
      | 'window_move'
      | 'window_resize'
      | 'window_focus'
      | 'window_tile',
    payload: any
  ) {
    this.broadcastAction(actionType, payload);
  }

  public broadcastWidgetAction(
    actionType:
      | 'widget_move'
      | 'widget_add'
      | 'widget_remove'
      | 'widget_collapse'
      | 'widget_arrange',
    payload: any
  ) {
    this.broadcastAction(actionType, payload);
  }

  public subscribeCursors(listener: CursorListener): () => void {
    this.cursorListeners.add(listener);
    listener({ ...this.cursors });
    return () => {
      this.cursorListeners.delete(listener);
    };
  }

  public subscribeRipples(listener: RippleListener): () => void {
    this.rippleListeners.add(listener);
    return () => {
      this.rippleListeners.delete(listener);
    };
  }

  public subscribeClicks(listener: RippleListener): () => void {
    return this.subscribeRipples(listener);
  }

  public subscribeActions(listener: ActionListener): () => void {
    this.actionListeners.add(listener);
    return () => {
      this.actionListeners.delete(listener);
    };
  }

  public broadcastStroke(stroke: { id: string; points: number[]; color: string; strokeWidth: number; tool: 'pen' | 'highlighter' | 'eraser' }) {
    const fullStroke: WhiteboardStrokeBroadcast = {
      ...stroke,
      senderId: this.clientId,
      senderName: this.userName,
    };

    const eventPayload = {
      type: 'whiteboard_stroke',
      ...fullStroke,
    };

    try {
      this.broadcastChannel?.postMessage(eventPayload);
    } catch {}

    try {
      fetch('/api/peer/collab/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: this.roomId, event: eventPayload, clientId: this.clientId }),
      }).catch(() => {});
    } catch {}
  }

  public subscribeStrokes(listener: StrokeListener): () => void {
    this.strokeListeners.add(listener);
    return () => {
      this.strokeListeners.delete(listener);
    };
  }

  /**
   * "сделай что ты ты не видишь свой кусрор только напарника а напарник только твой без своего"
   * Controls whether local user cursor is hidden from self.
   */
  public isHideOwnCursor(): boolean {
    return this.hideOwnCursor;
  }

  public setHideOwnCursor(hidden: boolean) {
    this.hideOwnCursor = hidden;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('hide-self-cursor');
    }
    this.hideCursorListeners.forEach((fn) => fn(this.hideOwnCursor));
  }

  public toggleHideOwnCursor(): boolean {
    const nextVal = !this.hideOwnCursor;
    this.setHideOwnCursor(nextVal);
    return nextVal;
  }

  public subscribeHideOwnCursor(listener: HideCursorListener): () => void {
    this.hideCursorListeners.add(listener);
    listener(this.hideOwnCursor);
    return () => {
      this.hideCursorListeners.delete(listener);
    };
  }

  /**
   * Demo Partner:
   * Simulates an active remote peer smoothly moving around the screen and clicking,
   * allowing immediate verification of "you don't see your own cursor, only your partner's"
   * even when testing in a single tab.
   */
  public startDemoPartner() {
    if (this.demoPartnerActive) return;
    this.demoPartnerActive = true;
    const partnerId = 'peer_demo_partner';
    
    this.cursors[partnerId] = {
      userId: partnerId,
      userName: 'Алексей (Напарник)',
      role: 'Navigator',
      color: '#8b5cf6',
      x: 52,
      y: 45,
      lastActive: Date.now() + 9999999,
    };
    this.notifyCursorListeners();

    let step = 0;
    this.demoPartnerTimer = setInterval(() => {
      step += 0.035;
      const x = 50 + Math.sin(step) * 26 + Math.cos(step * 0.4) * 12;
      const y = 48 + Math.cos(step * 0.75) * 20 + Math.sin(step * 0.25) * 8;

      this.cursors[partnerId] = {
        userId: partnerId,
        userName: 'Алексей (Напарник)',
        role: 'Navigator',
        color: '#8b5cf6',
        x: Math.max(8, Math.min(92, x)),
        y: Math.max(10, Math.min(90, y)),
        lastActive: Date.now() + 9999999,
      };
      this.notifyCursorListeners();

      if (Math.random() < 0.02) {
        this.notifyRippleListeners({
          id: `rip_partner_${Date.now()}`,
          userId: partnerId,
          userName: 'Алексей (Напарник)',
          color: '#8b5cf6',
          x,
          y,
          timestamp: Date.now(),
          label: 'Указатель напарника',
        });
      }
    }, 40);
  }

  public stopDemoPartner() {
    this.demoPartnerActive = false;
    if (this.demoPartnerTimer) {
      clearInterval(this.demoPartnerTimer);
      this.demoPartnerTimer = null;
    }
    delete this.cursors['peer_demo_partner'];
    this.notifyCursorListeners();
  }

  public toggleDemoPartner(): boolean {
    if (this.demoPartnerActive) {
      this.stopDemoPartner();
      return false;
    } else {
      this.startDemoPartner();
      return true;
    }
  }

  public isDemoPartnerActive(): boolean {
    return this.demoPartnerActive;
  }

  private notifyCursorListeners() {
    this.cursorListeners.forEach((fn) => fn({ ...this.cursors }));
  }

  private notifyRippleListeners(ripple: ClickRipple) {
    this.rippleListeners.forEach((fn) => fn(ripple));
  }

  private notifyActionListeners(action: SharedAction) {
    this.actionListeners.forEach((fn) => fn(action));
  }

  private notifyStrokeListeners(stroke: WhiteboardStrokeBroadcast) {
    this.strokeListeners.forEach((fn) => fn(stroke));
  }

  /**
   * Real Peer Inactivity Pruner:
   * Removes remote peers from cursor map if they disconnect or close the tab (no pings > 5s).
   */
  private startPruneInterval() {
    this.pruneTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const id in this.cursors) {
        if (id !== this.clientId && now - this.cursors[id].lastActive > 5000) {
          delete this.cursors[id];
          changed = true;
        }
      }
      if (changed) {
        this.notifyCursorListeners();
      }
    }, 1500);
  }

  /**
   * Returns list of real other peers actively connected in the room
   */
  public getActivePeers(): PeerCursor[] {
    const now = Date.now();
    return Object.values(this.cursors).filter(
      (c) => c.userId !== this.clientId && now - c.lastActive <= 6000
    );
  }

  /**
   * Returns count of real other peers actively connected
   */
  public getConnectedPeersCount(): number {
    return this.getActivePeers().length;
  }

  public subscribeActivePeers(listener: (peers: PeerCursor[]) => void): () => void {
    const cursorHandler = (cursors: Record<string, PeerCursor>) => {
      const now = Date.now();
      const active = Object.values(cursors).filter(
        (c) => c.userId !== this.clientId && now - c.lastActive <= 6000
      );
      listener(active);
    };
    this.cursorListeners.add(cursorHandler);
    cursorHandler(this.cursors);
    return () => {
      this.cursorListeners.delete(cursorHandler);
    };
  }

  public cleanup() {
    this.stopDemoPartner();
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    if (this.presenceTimeoutRef) {
      clearTimeout(this.presenceTimeoutRef);
      this.presenceTimeoutRef = null;
    }
    if (this.firestoreUnsub) {
      try { this.firestoreUnsub(); } catch {}
      this.firestoreUnsub = null;
    }
    if (this.eventSource) {
      try { this.eventSource.close(); } catch {}
      this.eventSource = null;
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch {}
      this.broadcastChannel = null;
    }

    this.cursorListeners.clear();
    this.rippleListeners.clear();
    this.actionListeners.clear();
    this.strokeListeners.clear();
    this.hideCursorListeners.clear();
    this.roomListeners.clear();
    this.partnerJoinedListeners.clear();
  }
}

export const peerCollabSync = new PeerCollabSyncManager();
