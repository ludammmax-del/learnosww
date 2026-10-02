import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  runTransaction, 
  type Unsubscribe 
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase.ts';
import { CommunityRoom, CommunityRoomBan, CommunityRoomPost, BlockGraphicSnapshot } from '../types.ts';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer.ts';

export type UpdateCommunityRoomInput = Pick<CommunityRoom,
  'name' | 'description' | 'bioMarkdown' | 'category' | 'tags' | 'activeTopic'
>;

export interface CreateRoomInput {
  name: string;
  description: string;
  bioMarkdown?: string;
  avatarUrl?: string;
  bannerCover?: string;
  bannerTheme?: 'indigo_neon' | 'emerald_matrix' | 'sunset_fire' | 'midnight_glass' | 'cyber_purple' | 'slate_minimal';
  isPrivate: boolean;
  accessCode?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  category: string;
  tags: string[];
  maxMembers?: number;
  activeTopic?: string;
  rules?: string[];
  hasVoiceCall?: boolean;
  hasWhiteboard?: boolean;
  hasCodeEditor?: boolean;
}

export const POPULAR_CATEGORY_SUGGESTIONS = [
  'Распределенные системы',
  'Искусственный интеллект & ML',
  'Highload & Go',
  'Фронтенд & React',
  'Алгоритмы & Структуры данных',
  'DevOps & Kubernetes',
  'Архитектура ПО',
  'Информационная безопасность',
  'Базы данных & SQL/NoSQL',
  'Мобильная разработка',
  'Системный дизайн (System Design)',
  'Английский для IT'
];

export const COMMUNITY_CATEGORIES = [
  'Все категории',
  ...POPULAR_CATEGORY_SUGGESTIONS
];

export interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  createdAt?: string | number;
  pinned?: boolean;
  attachedNotes?: Array<{
    id: string;
    title: string;
    content: string;
    tag: string;
    createdAt?: string;
  }>;
  attachedBlockSnapshot?: BlockGraphicSnapshot;
  reactions?: Record<string, string[]>;
}

const LOCAL_STORAGE_CUSTOM_ROOMS_KEY = 'learning_os_custom_community_rooms';

class CommunityRoomService {
  private localRoomsCache: Map<string, CommunityRoom> = new Map();

  private sanitizeCachedRoom(room: CommunityRoom): CommunityRoom {
    return { ...room, accessCode: undefined, members: undefined, bannedMembers: undefined };
  }

  constructor() {
    this.hydrateFromLocalStorage();
  }

  private hydrateFromLocalStorage() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_ROOMS_KEY);
      if (saved) {
        const list: CommunityRoom[] = JSON.parse(saved);
        if (Array.isArray(list)) {
          list.forEach((r) => {
            if (r && r.id) {
              this.localRoomsCache.set(r.id, this.sanitizeCachedRoom(r));
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading community rooms from localStorage:', e);
    }
  }

  private persistToLocalStorage(room: CommunityRoom) {
    try {
      const cachedRoom = this.sanitizeCachedRoom(room);
      this.localRoomsCache.set(room.id, cachedRoom);
      const allRooms = Array.from(this.localRoomsCache.values());
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_ROOMS_KEY, JSON.stringify(allRooms));
    } catch (e) {
      console.warn('Error saving community rooms to localStorage:', e);
    }
  }

  private removeFromLocalStorage(roomId: string) {
    try {
      this.localRoomsCache.delete(roomId);
      const allRooms = Array.from(this.localRoomsCache.values());
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_ROOMS_KEY, JSON.stringify(allRooms));
    } catch (e) {
      console.warn('Error removing room from localStorage:', e);
    }
  }

  // 1. LIST ROOMS (Aggregates Firestore + LocalStorage + Backend API)
  async listRooms(filters?: { query?: string; category?: string; includePrivate?: boolean }): Promise<CommunityRoom[]> {
    const roomsMap = new Map<string, CommunityRoom>();

    // 1. Load from localStorage cache first (immediate offline resilience)
    this.hydrateFromLocalStorage();
    this.localRoomsCache.forEach((r) => roomsMap.set(r.id, r));

    // 2. Fetch from Firebase Firestore
    try {
      const roomsCol = collection(db, 'community_rooms');
      const snap = await getDocs(query(roomsCol, where('isPrivate', '==', false)));
      snap.forEach((docSnap) => {
        const data = docSnap.data() as CommunityRoom;
        if (data && (data.id || docSnap.id)) {
          const roomObj: CommunityRoom = {
            ...data,
            id: docSnap.id || data.id,
            tags: Array.isArray(data.tags) ? data.tags : [],
            memberCount: data.memberCount || 1,
            maxMembers: data.maxMembers || 30
          };
          roomsMap.set(roomObj.id, roomObj);
          this.persistToLocalStorage(roomObj);
        }
      });
    } catch (err) {
      console.warn('Firestore listRooms error (will use local/backend fallback):', err);
    }

    // 3. Fetch from Express backend API (contains seeds + server rooms)
    try {
      const params = new URLSearchParams();
      if (filters?.query) params.set('q', filters.query);
      if (filters?.category && filters.category !== 'Все категории') params.set('category', filters.category);
      if (filters?.includePrivate) params.set('includePrivate', 'true');

      const res = await fetch(`/api/community/rooms?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const apiRooms: CommunityRoom[] = data.rooms || [];
        apiRooms.forEach((r) => {
          if (r && r.id) {
            // If not already present or to enrich
            if (!roomsMap.has(r.id)) {
              roomsMap.set(r.id, r);
            }
            // Background sync to Firestore
            this.syncRoomToFirestore(r).catch(() => {});
          }
        });
      }
    } catch (e) {
      console.warn('Error fetching community rooms from backend:', e);
    }

    const allMerged = Array.from(roomsMap.values());
    // Sort: newest first
    allMerged.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return this.filterRooms(allMerged, filters);
  }

  private filterRooms(rooms: CommunityRoom[], filters?: { query?: string; category?: string; includePrivate?: boolean }): CommunityRoom[] {
    let result = [...rooms];
    if (filters?.category && filters.category !== 'Все категории') {
      const catLower = filters.category.toLowerCase().trim();
      result = result.filter(r => r.category && r.category.toLowerCase().trim() === catLower);
    }
    if (filters?.query) {
      const qLower = filters.query.toLowerCase().trim();
      result = result.filter(r => 
        (r.name && r.name.toLowerCase().includes(qLower)) ||
        (r.description && r.description.toLowerCase().includes(qLower)) ||
        (r.category && r.category.toLowerCase().includes(qLower)) ||
        (r.tags && r.tags.some(t => t.toLowerCase().includes(qLower))) ||
        (r.activeTopic && r.activeTopic.toLowerCase().includes(qLower))
      );
    }
    if (!filters?.includePrivate) {
      result = result.filter(r => !r.isPrivate);
    }
    return result;
  }

  // Real-time Firestore Live Subscription
  subscribeRooms(onUpdate: (rooms: CommunityRoom[]) => void): Unsubscribe {
    try {
      const roomsCol = collection(db, 'community_rooms');
      return onSnapshot(query(roomsCol, where('isPrivate', '==', false)), (snapshot) => {
        const liveMap = new Map<string, CommunityRoom>();
        this.localRoomsCache.forEach(r => liveMap.set(r.id, r));

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CommunityRoom;
          if (data && (data.id || docSnap.id)) {
            const roomObj: CommunityRoom = {
              ...data,
              id: docSnap.id || data.id,
              tags: Array.isArray(data.tags) ? data.tags : [],
              memberCount: data.memberCount || 1,
              maxMembers: data.maxMembers || 30
            };
            liveMap.set(roomObj.id, roomObj);
            this.persistToLocalStorage(roomObj);
          }
        });

        const sorted = Array.from(liveMap.values()).sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        if (sorted.length > 0) {
          onUpdate(sorted);
        }
      }, (error) => {
        console.warn('Realtime rooms snapshot warning:', error);
      });
    } catch (e) {
      console.warn('Failed to attach realtime rooms snapshot:', e);
      return () => {};
    }
  }

  // 2. GET ROOM
  async getRoom(id: string): Promise<CommunityRoom | null> {
    try {
      const roomDoc = await getDoc(doc(db, 'community_rooms', id));
      if (roomDoc.exists()) {
        const r = { ...(roomDoc.data() as CommunityRoom), id: roomDoc.id };
        this.persistToLocalStorage(r);
        return r;
      }
    } catch (e) {
      console.warn('Error reading room from Firestore:', e);
    }

    if (this.localRoomsCache.has(id)) {
      return this.localRoomsCache.get(id)!;
    }

    try {
      const res = await fetch(`/api/community/rooms/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          this.persistToLocalStorage(data.room);
          this.syncRoomToFirestore(data.room).catch(() => {});
          return data.room;
        }
      }
    } catch (e) {
      console.warn('Error fetching room from backend:', e);
    }

    return null;
  }

  private async getRoomForOwnerAction(roomId: string): Promise<CommunityRoom | null> {
    try {
      const roomDoc = await getDoc(doc(db, 'community_rooms', roomId));
      if (roomDoc.exists()) return { ...(roomDoc.data() as CommunityRoom), id: roomDoc.id };
    } catch (e) {
      console.warn('Error reading room before owner action:', e);
    }

    try {
      const response = await fetch(`/api/community/rooms/${encodeURIComponent(roomId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.room) return data.room as CommunityRoom;
      }
    } catch (e) {
      console.warn('Error fetching room before owner action:', e);
    }

    return this.localRoomsCache.get(roomId) || null;
  }

  private async authHeaders(userId: string): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) return {};
    try {
      if (typeof user.getIdToken === 'function') {
        const token = await user.getIdToken();
        return { Authorization: `Bearer ${token}` };
      }
    } catch {}
    return { Authorization: `Bearer demo-token-${userId}` };
  }

  async updateRoom(
    roomId: string,
    ownerId: string,
    updates: UpdateCommunityRoomInput
  ): Promise<{ success: boolean; room?: CommunityRoom; error?: string }> {
    const room = await this.getRoomForOwnerAction(roomId);
    if (!room) return { success: false, error: 'Комната не найдена' };
    if (!ownerId || room.creatorId !== ownerId) {
      return { success: false, error: 'Изменять информацию может только владелец группы' };
    }
    if (!updates.name.trim() || !updates.category.trim()) {
      return { success: false, error: 'Название и категория обязательны' };
    }

    const updatedRoom = { ...room, ...updates, updatedAt: new Date().toISOString() };
    let saved = false;

    try {
      await setDoc(doc(db, 'community_rooms', roomId), { ...updates, updatedAt: updatedRoom.updatedAt }, { merge: true });
      saved = true;
    } catch (e) {
      console.warn('Firestore updateRoom error:', e);
    }
    if (!saved) return { success: false, error: 'Не удалось сохранить изменения в постоянное хранилище' };

    try {
      const response = await fetch(`/api/community/rooms/${encodeURIComponent(roomId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...await this.authHeaders(ownerId) },
        body: JSON.stringify({ ownerId, updates }),
      });
      if (response.ok) {
        const data = await response.json();
        const resultRoom = data.room || updatedRoom;
        this.persistToLocalStorage(resultRoom);
        return { success: true, room: resultRoom };
      }
    } catch (e) {
      console.warn('Backend updateRoom error:', e);
    }

    if (!saved) return { success: false, error: 'Не удалось сохранить изменения группы' };
    this.persistToLocalStorage(updatedRoom);
    return { success: true, room: updatedRoom };
  }

  async listBannedMembers(roomId: string, ownerId: string): Promise<{ success: boolean; members?: CommunityRoomBan[]; error?: string }> {
    const room = await this.getRoomForOwnerAction(roomId);
    if (!room) return { success: false, error: 'Комната не найдена' };
    if (!ownerId || room.creatorId !== ownerId) {
      return { success: false, error: 'Список блокировок доступен только владельцу' };
    }

    const members = new Map<string, CommunityRoomBan>();
    try {
      const banDocs = await getDocs(collection(db, 'community_rooms', roomId, 'banned_members'));
      banDocs.forEach((banDoc) => members.set(banDoc.id, banDoc.data() as CommunityRoomBan));
    } catch (e) {
      console.warn('Firestore listBannedMembers error:', e);
    }

    try {
      const response = await fetch(`/api/community/rooms/${encodeURIComponent(roomId)}/banned-members?ownerId=${encodeURIComponent(ownerId)}`, {
        headers: await this.authHeaders(ownerId),
      });
      if (response.ok) {
        const data = await response.json();
        (data.members || []).forEach((member: CommunityRoomBan) => members.set(member.userId, member));
      }
    } catch (e) {
      console.warn('Backend listBannedMembers error:', e);
    }

    return { success: true, members: Array.from(members.values()) };
  }

  subscribeRoomBan(roomId: string, userId: string, onBanChange: (isBanned: boolean) => void): Unsubscribe {
    try {
      return onSnapshot(doc(db, 'community_rooms', roomId, 'banned_members', userId), (banDoc) => {
        onBanChange(banDoc.exists());
      }, (error) => {
        console.warn('Room ban subscription warning:', error);
      });
    } catch (error) {
      console.warn('Failed to subscribe to room ban:', error);
      return () => {};
    }
  }

  async banRoomMember(
    roomId: string,
    ownerId: string,
    memberId: string
  ): Promise<{ success: boolean; room?: CommunityRoom; error?: string }> {
    const room = await this.getRoomForOwnerAction(roomId);
    if (!room) return { success: false, error: 'Комната не найдена' };
    if (!ownerId || room.creatorId !== ownerId) {
      return { success: false, error: 'Блокировать участников может только владелец группы' };
    }
    if (!memberId || memberId === room.creatorId) {
      return { success: false, error: 'Нельзя заблокировать владельца группы' };
    }

    const member = room.members?.find((item) => item.userId === memberId);
    if (!member) return { success: false, error: 'Участник уже отсутствует в группе' };

    const ban: CommunityRoomBan = {
      userId: memberId,
      userName: member.userName || member.name || memberId,
      avatar: member.avatar,
      bannedAt: new Date().toISOString(),
    };
    const updatedRoom: CommunityRoom = {
      ...room,
      members: (room.members || []).filter((item) => item.userId !== memberId),
      memberCount: Math.max(0, (room.memberCount || (room.members || []).length) - 1),
      bannedMembers: [...(room.bannedMembers || []).filter((item) => item.userId !== memberId), ban],
      updatedAt: ban.bannedAt,
    };
    let saved = false;

    try {
      await setDoc(doc(db, 'community_rooms', roomId, 'banned_members', memberId), ban);
      saved = true;
      await deleteDoc(doc(db, 'community_rooms', roomId, 'members', memberId));
      await setDoc(doc(db, 'community_rooms', roomId), {
        members: updatedRoom.members,
        memberCount: updatedRoom.memberCount,
        updatedAt: updatedRoom.updatedAt,
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore banRoomMember error:', e);
    }
    if (!saved) return { success: false, error: 'Не удалось сохранить бессрочную блокировку' };

    try {
      const response = await fetch(`/api/community/rooms/${encodeURIComponent(roomId)}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await this.authHeaders(ownerId) },
        body: JSON.stringify({ ownerId, memberId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (!saved) {
          return { success: false, error: 'Для бессрочной блокировки требуется постоянное хранилище' };
        }
        const resultRoom = data.room || updatedRoom;
        this.persistToLocalStorage(resultRoom);
        return { success: true, room: resultRoom };
      }
      if (!response.ok) console.warn('Backend banRoomMember rejected:', data.error || response.statusText);
    } catch (e) {
      console.warn('Backend banRoomMember error:', e);
    }

    this.persistToLocalStorage(updatedRoom);
    return { success: true, room: updatedRoom };
  }

  // 3. CREATE ROOM (Triple persistence: LocalStorage + Firestore + Express)
  async createRoom(input: CreateRoomInput): Promise<{ success: boolean; room?: CommunityRoom; error?: string }> {
    const roomId = 'room-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    
    const newRoom: CommunityRoom = {
      id: roomId,
      name: input.name.trim(),
      description: input.description.trim() || `Учебное пространство: ${input.name}`,
      bioMarkdown: input.bioMarkdown?.trim() || `### О комнате «${input.name}»\nДобро пожаловать в наше учебное пространство!`,
      avatarUrl: input.avatarUrl || '',
      bannerCover: input.bannerCover || '',
      bannerTheme: input.bannerTheme || 'indigo_neon',
      isPrivate: !!input.isPrivate,
      accessCode: input.isPrivate ? (input.accessCode?.trim() || String(Math.floor(1000 + Math.random() * 9000))) : undefined,
      creatorId: input.creatorId,
      creatorName: input.creatorName,
      creatorAvatar: input.creatorAvatar,
      category: input.category.trim() || 'Общие темы',
      tags: Array.isArray(input.tags) && input.tags.length > 0 ? input.tags : ['Архитектура', 'Практика'],
      createdAt: new Date().toISOString(),
      memberCount: 1,
      maxMembers: input.maxMembers || 30,
      activeTopic: input.activeTopic?.trim() || 'Совместное обучение на доске',
      rules: input.rules || ['Взаимное уважение', 'Конструктивный диалог', 'Понятные диаграммы на доске'],
      hasVoiceCall: true,
      hasWhiteboard: true,
      hasCodeEditor: true,
      dailyRoomUrl: `https://meet.jit.si/learning-os-${roomId}#config.prejoinPageEnabled=false`,
      members: [
        {
          userId: input.creatorId,
          userName: input.creatorName,
          name: input.creatorName,
          avatar: input.creatorAvatar,
          joinedAt: new Date().toISOString(),
          role: 'owner',
          isOnline: true,
        }
      ],
      bannedMembers: [],
      feedPosts: [
        {
          id: 'post-welcome-' + roomId,
          authorId: input.creatorId,
          authorName: input.creatorName,
          authorAvatar: input.creatorAvatar,
          text: `Комната «${input.name}» открыта! Приглашаем всех к совместному проектированию на бесконечной доске.`,
          createdAt: new Date().toISOString(),
          likes: 1,
        }
      ]
    };

    // 1. Instant local persistence (NEVER lost)
    this.persistToLocalStorage(newRoom);

    // 2. Firebase Firestore persistence
    try {
      await setDoc(doc(db, 'community_rooms', roomId), {
        ...newRoom,
        updatedAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'community_rooms', roomId, 'members', input.creatorId), {
        userId: input.creatorId,
        userName: input.creatorName,
        avatar: input.creatorAvatar || '',
        role: 'owner',
        joinedAt: new Date().toISOString(),
      });
      console.log('Room persisted successfully to Firestore:', roomId);
    } catch (fsErr) {
      console.warn('Firestore room setDoc warning (offline or permissions):', fsErr);
    }

    // 3. Initialize whiteboard doc in Firestore
    try {
      await setDoc(doc(db, 'community_whiteboards', roomId), {
        shapes: [],
        stickies: [
          {
            id: 'sticky-welcome-' + roomId,
            x: 200,
            y: 150,
            width: 220,
            height: 180,
            color: '#FEF08A',
            text: `🎯 Пространство комнаты:\n${newRoom.name}\n\nРисуйте диаграммы, создавайте стикеры и делитесь мыслями!`,
            author: input.creatorName
          }
        ],
        lastModified: new Date().toISOString()
      });
    } catch (wbErr) {
      console.warn('Whiteboard Firestore init warning:', wbErr);
    }

    // 4. Express backend persistence
    try {
      const res = await fetch('/api/community/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await this.authHeaders(input.creatorId) },
        body: JSON.stringify({ ...input, id: roomId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          this.persistToLocalStorage(data.room);
          return { success: true, room: data.room };
        }
      }
    } catch (apiErr) {
      console.warn('Backend API createRoom call warning:', apiErr);
    }

    return { success: true, room: newRoom };
  }

  // 4. JOIN ROOM
  async joinRoom(roomId: string, params: {
    userId: string;
    userName: string;
    avatar?: string;
    accessCode?: string;
    role?: 'member' | 'architect' | 'auditor';
  }): Promise<{ success: boolean; room?: CommunityRoom; error?: string }> {
    const localRoom = this.localRoomsCache.get(roomId);
    if (localRoom?.bannedMembers?.some((member) => member.userId === params.userId)) {
      return { success: false, error: 'Владелец группы заблокировал для вас повторный вход' };
    }
    if (localRoom && localRoom.isPrivate && localRoom.accessCode && localRoom.accessCode !== params.accessCode) {
      return { success: false, error: 'Неверный PIN-код доступа' };
    }

    try {
      const roomRef = doc(db, 'community_rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        const roomData = roomSnap.data() as CommunityRoom;
        const banSnap = await getDoc(doc(db, 'community_rooms', roomId, 'banned_members', params.userId));
        if (banSnap.exists()) {
          return { success: false, error: 'Владелец группы заблокировал для вас повторный вход' };
        }
        if (roomData.bannedMembers?.some((member) => member.userId === params.userId)) {
          return { success: false, error: 'Владелец группы заблокировал для вас повторный вход' };
        }
        if (roomData.isPrivate && roomData.accessCode && roomData.accessCode !== params.accessCode) {
          return { success: false, error: 'Неверный PIN-код доступа' };
        }

        const members = roomData.members || [];
        if ((roomData.memberCount || members.length) >= roomData.maxMembers && !members.some((member) => member.userId === params.userId)) {
          return { success: false, error: 'Комната заполнена (достигнут лимит участников)' };
        }
        await setDoc(doc(db, 'community_rooms', roomId, 'members', params.userId), {
          userId: params.userId,
          userName: params.userName,
          avatar: params.avatar || '',
          role: members.find((member) => member.userId === params.userId)?.role || 'member',
          joinedAt: new Date().toISOString(),
        }, { merge: true });
        if (!members.some(m => m.userId === params.userId)) {
          members.push({
            userId: params.userId,
            userName: params.userName,
            name: params.userName,
            avatar: params.avatar,
            joinedAt: new Date().toISOString(),
            role: params.role || 'member',
            isOnline: true,
          });
          const updated = {
            ...roomData,
            members,
            memberCount: members.length,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(roomRef, updated, { merge: true });
          this.persistToLocalStorage(updated);
        }
      }
    } catch (err) {
      console.warn('Firestore joinRoom error:', err);
    }

    // Call backend API
    try {
      const res = await fetch(`/api/community/rooms/${encodeURIComponent(roomId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await this.authHeaders(params.userId) },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.persistToLocalStorage(data.room);
        return { success: true, room: data.room };
      }
      if (!res.ok) {
        return { success: false, error: data.error || 'Не удалось войти в комнату' };
      }
    } catch (e: any) {
      console.warn('Backend join room error:', e);
    }

    if (localRoom) {
      return { success: true, room: localRoom };
    }

    return { success: false, error: 'Комната не найдена' };
  }

  // 5. POST TO FEED
  async postToFeed(roomId: string, post: {
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    text: string;
    learningNode?: CommunityRoomPost['learningNode'];
    attachedNotes?: CommunityRoomPost['attachedNotes'];
    attachedHabits?: CommunityRoomPost['attachedHabits'];
    attachedMetric?: CommunityRoomPost['attachedMetric'];
    attachedProject?: CommunityRoomPost['attachedProject'];
  }): Promise<{ success: boolean; feedPosts?: CommunityRoomPost[]; error?: string }> {
    if (!post.text.trim()) throw new Error('Добавьте текст публикации.');
    if ((post.attachedNotes?.length || 0) > 5) throw new Error('К публикации можно добавить не более 5 заметок.');

    const newPost = sanitizeFirestoreData<CommunityRoomPost>({
      id: `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      text: post.text,
      createdAt: new Date().toISOString(),
      likes: 0,
      learningNode: post.learningNode,
      attachedNotes: post.attachedNotes,
      attachedHabits: post.attachedHabits,
      attachedMetric: post.attachedMetric,
      attachedProject: post.attachedProject,
      attachedMindmap: post.attachedMindmap,
      attachedQuiz: post.attachedQuiz,
      habitCheered: post.habitCheered,
    });

    let feedPosts: CommunityRoomPost[] = [];

    // 1. Try Firestore Transaction if available
    try {
      const roomRef = doc(db, 'community_rooms', roomId);
      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) throw new Error('Комната не найдена в Firestore.');
        const existingPosts = Array.isArray(roomSnap.data().feedPosts)
          ? roomSnap.data().feedPosts as CommunityRoomPost[]
          : [];
        feedPosts = [...existingPosts, newPost].slice(-50);
        transaction.update(roomRef, { feedPosts, updatedAt: new Date().toISOString() });
      });
    } catch (firestoreErr) {
      console.warn('[communityRoomService] Firestore transaction notice:', firestoreErr);
      // Fallback: update local cache
      const cachedRoom = this.localRoomsCache.get(roomId);
      const existing = cachedRoom?.feedPosts || [];
      feedPosts = [...existing, newPost].slice(-50);
    }

    const cachedRoom = this.localRoomsCache.get(roomId);
    if (cachedRoom) this.persistToLocalStorage({ ...cachedRoom, feedPosts });

    // Also notify backend store in background
    fetch(`/api/community/rooms/${encodeURIComponent(roomId)}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost),
    }).catch(() => {});

    return { success: true, feedPosts };
  }

  // 6. REALTIME CHAT (Firestore Messages)
  subscribeChatMessages(roomId: string, onMessages: (messages: RoomChatMessage[]) => void): Unsubscribe {
    try {
      const messagesCol = collection(db, 'community_chat', roomId, 'messages');
      const q = query(messagesCol, orderBy('createdAt', 'asc'));
      
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const msgs: RoomChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            msgs.push({
              ...(docSnap.data() as RoomChatMessage),
              id: docSnap.id
            });
          });
          onMessages(msgs);
        }
      }, (err) => {
        console.warn('Realtime chat subscription warning:', err);
      });
    } catch (e) {
      console.warn('Failed to subscribe to chat in Firestore:', e);
      return () => {};
    }
  }

  async sendChatMessage(roomId: string, message: Omit<RoomChatMessage, 'id'>): Promise<{ success: boolean; messageId: string }> {
    const msgId = 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const fullMsg: RoomChatMessage = {
      ...message,
      id: msgId,
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(db, 'community_chat', roomId, 'messages', msgId), fullMsg);
      return { success: true, messageId: msgId };
    } catch (err) {
      console.warn('Firestore sendChatMessage error:', err);
      return { success: false, messageId: msgId };
    }
  }

  // 7. ROOM WHITEBOARD (Firestore & Backend API)
  async getRoomWhiteboard(roomId: string, userId?: string): Promise<{ success: boolean; whiteboard?: { shapes: any[]; stickies: any[]; lastModified: string }; error?: string }> {
    try {
      const wbDoc = await getDoc(doc(db, 'community_whiteboards', roomId));
      if (wbDoc.exists()) {
        const data = wbDoc.data();
        return {
          success: true,
          whiteboard: {
            shapes: data.shapes || [],
            stickies: data.stickies || [],
            lastModified: data.lastModified || new Date().toISOString()
          }
        };
      }
    } catch (err) {
      console.warn('Firestore getRoomWhiteboard error:', err);
    }

    try {
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const headers = userId ? await this.authHeaders(userId) : {};
      const res = await fetch(`/api/community/rooms/${encodeURIComponent(roomId)}/whiteboard${query}`, { headers });
      if (res.ok) {
        const data = await res.json();
        return { success: true, whiteboard: data.whiteboard };
      }
      if (res.status === 403) return { success: false, error: 'Доступ к доске заблокирован' };
    } catch (e: any) {
      console.warn('Error fetching whiteboard from backend:', e);
    }

    return { success: false, error: 'Whiteboard storage is unavailable' };
  }

  async saveRoomWhiteboard(roomId: string, data: { shapes: any[]; stickies: any[] }, userId?: string): Promise<{ success: boolean; error?: string }> {
    const payload = {
      shapes: data.shapes || [],
      stickies: data.stickies || [],
      lastModified: new Date().toISOString()
    };

    let saved = false;

    try {
      await setDoc(doc(db, 'community_whiteboards', roomId), payload, { merge: true });
      saved = true;
    } catch (err) {
      console.warn('Firestore saveRoomWhiteboard error:', err);
    }

    try {
      const response = await fetch(`/api/community/rooms/${encodeURIComponent(roomId)}/whiteboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(userId ? await this.authHeaders(userId) : {}) },
        body: JSON.stringify({ ...payload, userId }),
      });
      saved = saved || response.ok;
    } catch (e: any) {
      console.warn('Backend save whiteboard error:', e);
    }

    return saved ? { success: true } : { success: false, error: 'Whiteboard could not be saved remotely' };
  }

  // 8. DELETE ROOM
  async deleteRoom(roomId: string, ownerId: string): Promise<{ success: boolean; error?: string }> {
    const room = await this.getRoomForOwnerAction(roomId);
    if (!room) return { success: false, error: 'Комната не найдена' };
    if (!ownerId || room.creatorId !== ownerId) {
      return { success: false, error: 'Удалить группу может только владелец' };
    }

    let deleted = false;
    try {
      await deleteDoc(doc(db, 'community_rooms', roomId));
      deleted = true;
    } catch (err) {
      console.warn('Firestore deleteRoom error:', err);
    }
    if (!deleted) return { success: false, error: 'Не удалось удалить группу из постоянного хранилища' };
    try {
      await deleteDoc(doc(db, 'community_whiteboards', roomId));
    } catch (err) {
      console.warn('Firestore deleteRoom whiteboard error:', err);
    }

    try {
      const response = await fetch(`/api/community/rooms/${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...await this.authHeaders(ownerId) },
        body: JSON.stringify({ ownerId }),
      });
      deleted = deleted || response.ok;
    } catch (e: any) {
      console.warn('Backend deleteRoom error:', e);
    }

    if (!deleted) return { success: false, error: 'Не удалось удалить группу' };
    this.removeFromLocalStorage(roomId);
    return { success: true };
  }

  private async syncRoomToFirestore(room: CommunityRoom) {
    try {
      await setDoc(doc(db, 'community_rooms', room.id), {
        ...room,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      // background sync ignore
    }
  }
}

export const communityRoomService = new CommunityRoomService();
