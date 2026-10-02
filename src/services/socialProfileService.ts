import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase.ts';
import { PartnerRequest, ProfileNodeSnapshot, ProfileWallPost, UserArtifact, UserProfile } from '../types.ts';
import { sanitizeFirestoreData } from '../utils/firestoreSanitizer.ts';

export type PublicProfile = Pick<
  UserProfile,
  'uid' | 'displayName' | 'avatar' | 'title' | 'specialty' | 'bio' | 'status' | 'ringProgress' | 'currentNodeIds' | 'currentNodes'
> & { updatedAt?: string };

export type PublicPortfolioArtifact = Pick<
  UserArtifact,
  'id' | 'unitTitle' | 'filename' | 'fileContent' | 'score' | 'strongPoints' | 'productionAdvice' | 'submittedAt'
>;

export interface PublicPortfolio {
  uid: string;
  displayName: string;
  avatar?: string;
  isPublic: true;
  artifacts: PublicPortfolioArtifact[];
  publishedAt: string;
  updatedAt: string;
}

type PartnerRequestRecord = PartnerRequest & { createdAt: string };

class SocialProfileService {
  private assertCurrentUser(uid: string) {
    if (!uid) {
      throw new Error('Для синхронизации профиля необходимо указать идентификатор пользователя.');
    }
  }

  public async savePublicProfile(profile: PublicProfile): Promise<void> {
    this.assertCurrentUser(profile.uid);
    const enriched = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`learning_os_public_profile_${profile.uid}`, JSON.stringify(enriched));
      window.dispatchEvent(new CustomEvent('learning_os_profile_updated', { detail: enriched }));
    } catch {}

    if (!isFirebaseConfigured) return;

    try {
      const profileRef = doc(db, 'public_user_profiles', profile.uid);
      await setDoc(profileRef, sanitizeFirestoreData(enriched), { merge: true });
    } catch (err) {
      console.warn('[Social Profile] Cloud sync failed, local copy active:', err);
    }
  }

  public async publishIdentity(identity: Pick<PublicProfile, 'uid' | 'displayName' | 'avatar'>): Promise<void> {
    this.assertCurrentUser(identity.uid);
    try {
      const key = `learning_os_public_profile_${identity.uid}`;
      const existing = localStorage.getItem(key);
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = { ...parsed, ...identity, updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('learning_os_profile_updated', { detail: updated }));
    } catch {}

    if (!isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, 'public_user_profiles', identity.uid), sanitizeFirestoreData({
        ...identity,
        updatedAt: new Date().toISOString(),
      }), { merge: true });
    } catch (err) {
      console.warn('[Social Profile] Cloud identity sync failed:', err);
    }
  }

  public async syncLearningSnapshot(
    uid: string,
    snapshot: Pick<PublicProfile, 'currentNodeIds' | 'currentNodes' | 'ringProgress' | 'status'>
  ): Promise<void> {
    this.assertCurrentUser(uid);
    try {
      const key = `learning_os_public_profile_${uid}`;
      const existing = localStorage.getItem(key);
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = { ...parsed, uid, ...snapshot, updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('learning_os_profile_updated', { detail: updated }));
    } catch {}

    if (!isFirebaseConfigured) return;
    try {
      const profileRef = doc(db, 'public_user_profiles', uid);
      await setDoc(profileRef, sanitizeFirestoreData({
        uid,
        ...snapshot,
        updatedAt: new Date().toISOString(),
      }), { merge: true });
    } catch (err) {
      console.warn('[Social Profile] Cloud snapshot sync failed:', err);
    }
  }

  public subscribeProfile(uid: string, onProfile: (profile: PublicProfile | null) => void) {
    if (!uid) {
      onProfile(null);
      return () => {};
    }

    // Always provide local state immediately
    const readLocal = () => {
      try {
        const raw = localStorage.getItem(`learning_os_public_profile_${uid}`);
        if (raw) return JSON.parse(raw) as PublicProfile;
      } catch {}
      return null;
    };
    onProfile(readLocal());

    const handleCustomUpdate = (e: any) => {
      if (e.detail?.uid === uid) {
        onProfile(e.detail as PublicProfile);
      }
    };
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === `learning_os_public_profile_${uid}`) {
        onProfile(readLocal());
      }
    };

    window.addEventListener('learning_os_profile_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    if (!isFirebaseConfigured) {
      return () => {
        window.removeEventListener('learning_os_profile_updated', handleCustomUpdate);
        window.removeEventListener('storage', handleStorageUpdate);
      };
    }

    const unsubFirestore = onSnapshot(
      doc(db, 'public_user_profiles', uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PublicProfile;
          try {
            localStorage.setItem(`learning_os_public_profile_${uid}`, JSON.stringify(data));
          } catch {}
          onProfile(data);
        }
      },
      (error) => console.warn(`[Social profile] Profile subscription failed for ${uid}:`, error)
    );

    return () => {
      window.removeEventListener('learning_os_profile_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      unsubFirestore();
    };
  }

  public async publishPortfolio(uid: string, displayName: string, avatar: string | undefined, artifacts: UserArtifact[]): Promise<void> {
    this.assertCurrentUser(uid);
    const publicArtifacts: PublicPortfolioArtifact[] = artifacts
      .filter((artifact) => artifact.passed && artifact.score >= 70)
      .slice(0, 20)
      .map((artifact) => ({
        id: String(artifact.id).slice(0, 140),
        unitTitle: String(artifact.unitTitle || 'Учебный проект').slice(0, 200),
        filename: String(artifact.filename || 'solution').slice(0, 140),
        fileContent: String(artifact.fileContent || '').slice(0, 24000),
        score: Math.max(0, Math.min(100, Number(artifact.score) || 0)),
        strongPoints: (Array.isArray(artifact.strongPoints) ? artifact.strongPoints : []).slice(0, 8).map((point) => String(point).slice(0, 240)),
        productionAdvice: String(artifact.productionAdvice || '').slice(0, 1200),
        submittedAt: String(artifact.submittedAt || '').slice(0, 120),
      }));

    if (publicArtifacts.length === 0) {
      throw new Error('Нет проверенных артефактов для публикации. Нужна оценка не ниже 70%.');
    }

    const portfolioRecord: PublicPortfolio = {
      uid,
      displayName: String(displayName || 'Студент').slice(0, 120),
      avatar: avatar || undefined,
      isPublic: true,
      artifacts: publicArtifacts,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`learning_os_public_portfolio_${uid}`, JSON.stringify(portfolioRecord));
      window.dispatchEvent(new CustomEvent('learning_os_portfolio_updated', { detail: portfolioRecord }));
    } catch {}

    if (!isFirebaseConfigured) return;

    try {
      const portfolioRef = doc(db, 'public_portfolios', uid);
      await setDoc(portfolioRef, sanitizeFirestoreData({
        ...portfolioRecord,
        avatar: avatar || null,
      }));
    } catch (err) {
      console.warn('[Social Profile] Cloud portfolio publish failed, local copy active:', err);
    }
  }

  public async unpublishPortfolio(uid: string): Promise<void> {
    this.assertCurrentUser(uid);
    try {
      localStorage.removeItem(`learning_os_public_portfolio_${uid}`);
      window.dispatchEvent(new CustomEvent('learning_os_portfolio_updated', { detail: null }));
    } catch {}

    if (!isFirebaseConfigured) return;
    try {
      await deleteDoc(doc(db, 'public_portfolios', uid));
    } catch {}
  }

  public subscribePublishedPortfolio(
    uid: string,
    onPortfolio: (portfolio: PublicPortfolio | null) => void,
    onError?: (error: Error) => void
  ) {
    if (!uid) return () => {};

    const readLocal = () => {
      try {
        const raw = localStorage.getItem(`learning_os_public_portfolio_${uid}`);
        if (raw) return JSON.parse(raw) as PublicPortfolio;
      } catch {}
      return null;
    };
    onPortfolio(readLocal());

    const handleCustomUpdate = (e: any) => {
      if (e.detail === null || e.detail?.uid === uid) {
        onPortfolio(e.detail as PublicPortfolio | null);
      }
    };
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === `learning_os_public_portfolio_${uid}`) {
        onPortfolio(readLocal());
      }
    };

    window.addEventListener('learning_os_portfolio_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    if (!isFirebaseConfigured) {
      return () => {
        window.removeEventListener('learning_os_portfolio_updated', handleCustomUpdate);
        window.removeEventListener('storage', handleStorageUpdate);
      };
    }

    const unsubFirestore = onSnapshot(
      doc(db, 'public_portfolios', uid),
      (snapshot) => {
        const data = snapshot.data();
        const portfolio = snapshot.exists() && data?.isPublic === true ? data as PublicPortfolio : null;
        if (portfolio) {
          try {
            localStorage.setItem(`learning_os_public_portfolio_${uid}`, JSON.stringify(portfolio));
          } catch {}
        }
        onPortfolio(portfolio);
      },
      (error) => {
        console.warn(`[Portfolio] Public portfolio subscription failed for ${uid}:`, error);
        onError?.(error);
      }
    );

    return () => {
      window.removeEventListener('learning_os_portfolio_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      unsubFirestore();
    };
  }

  public sendPartnerRequest(request: Omit<PartnerRequestRecord, 'id' | 'status' | 'createdAt'>): Promise<string> {
    this.assertCurrentUser(request.fromUserId);
    if (request.fromUserId === request.toUserId) {
      return Promise.reject(new Error('Нельзя отправить заявку самому себе.'));
    }

    const localId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newRecord: PartnerRequestRecord = {
      ...request,
      id: localId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem('learning_os_partner_requests');
      const list: PartnerRequestRecord[] = stored ? JSON.parse(stored) : [];
      list.unshift(newRecord);
      localStorage.setItem('learning_os_partner_requests', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('learning_os_requests_updated'));
    } catch {}

    if (!isFirebaseConfigured) {
      return Promise.resolve(localId);
    }

    return addDoc(collection(db, 'partner_requests'), sanitizeFirestoreData({
      ...request,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })).then((requestRef) => requestRef.id).catch(() => localId);
  }

  public subscribePartnerRequests(
    uid: string,
    onRequests: (requests: PartnerRequestRecord[]) => void
  ) {
    if (!uid) return () => {};

    const readLocal = () => {
      try {
        const stored = localStorage.getItem('learning_os_partner_requests');
        const list: PartnerRequestRecord[] = stored ? JSON.parse(stored) : [];
        return list.filter((r) => r.fromUserId === uid || r.toUserId === uid);
      } catch {}
      return [];
    };

    onRequests(readLocal());

    const handleUpdate = () => onRequests(readLocal());
    window.addEventListener('learning_os_requests_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    if (!isFirebaseConfigured) {
      return () => {
        window.removeEventListener('learning_os_requests_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }

    const results = new Map<string, PartnerRequestRecord>();
    const emit = () => onRequests(Array.from(results.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    const listeners = [
      onSnapshot(query(collection(db, 'partner_requests'), where('fromUserId', '==', uid)), (snapshot) => {
        snapshot.docs.forEach((item) => results.set(item.id, { ...item.data(), id: item.id } as PartnerRequestRecord));
        emit();
      }, (error) => console.warn('[Social profile] Outgoing request subscription failed:', error)),
      onSnapshot(query(collection(db, 'partner_requests'), where('toUserId', '==', uid)), (snapshot) => {
        snapshot.docs.forEach((item) => results.set(item.id, { ...item.data(), id: item.id } as PartnerRequestRecord));
        emit();
      }, (error) => console.warn('[Social profile] Incoming request subscription failed:', error)),
    ];

    return () => {
      window.removeEventListener('learning_os_requests_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }

  public async respondToPartnerRequest(requestId: string, recipientUid: string, status: 'accepted' | 'rejected') {
    this.assertCurrentUser(recipientUid);
    try {
      const stored = localStorage.getItem('learning_os_partner_requests');
      const list: PartnerRequestRecord[] = stored ? JSON.parse(stored) : [];
      const updated = list.map((r) => r.id === requestId ? { ...r, status, updatedAt: new Date().toISOString() } : r);
      localStorage.setItem('learning_os_partner_requests', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('learning_os_requests_updated'));
    } catch {}

    if (!isFirebaseConfigured) return;
    try {
      await updateDoc(doc(db, 'partner_requests', requestId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch {}
  }

  public subscribeWallPosts(ownerUid: string, onPosts: (posts: ProfileWallPost[]) => void) {
    if (!ownerUid) return () => {};

    const readLocal = () => {
      try {
        const stored = localStorage.getItem(`learning_os_wall_${ownerUid}`);
        return stored ? JSON.parse(stored) as ProfileWallPost[] : [];
      } catch {}
      return [];
    };

    onPosts(readLocal());

    const handleUpdate = () => onPosts(readLocal());
    window.addEventListener(`learning_os_wall_updated_${ownerUid}`, handleUpdate);

    if (!isFirebaseConfigured) {
      return () => {
        window.removeEventListener(`learning_os_wall_updated_${ownerUid}`, handleUpdate);
      };
    }

    const postsQuery = query(collection(db, 'profile_wall_posts'), where('ownerUid', '==', ownerUid));
    const unsub = onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs
        .map((item) => item.data() as ProfileWallPost)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      try {
        localStorage.setItem(`learning_os_wall_${ownerUid}`, JSON.stringify(posts));
      } catch {}
      onPosts(posts);
    }, (error) => console.warn(`[Social profile] Wall subscription failed for ${ownerUid}:`, error));

    return () => {
      window.removeEventListener(`learning_os_wall_updated_${ownerUid}`, handleUpdate);
      unsub();
    };
  }

  public async createWallPost(ownerUid: string, post: Omit<ProfileWallPost, 'id'>): Promise<void> {
    this.assertCurrentUser(post.authorId);
    const newPost: ProfileWallPost = {
      ...post,
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };

    try {
      const key = `learning_os_wall_${ownerUid}`;
      const stored = localStorage.getItem(key);
      const list: ProfileWallPost[] = stored ? JSON.parse(stored) : [];
      list.unshift(newPost);
      localStorage.setItem(key, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent(`learning_os_wall_updated_${ownerUid}`));
    } catch {}

    if (!isFirebaseConfigured) return;
    try {
      await addDoc(collection(db, 'profile_wall_posts'), sanitizeFirestoreData({
        ...post,
        ownerUid,
      }));
    } catch {}
  }
}

export const socialProfileService = new SocialProfileService();
