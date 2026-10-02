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
    if (!uid || auth.currentUser?.uid !== uid) {
      throw new Error('Для синхронизации профиля необходимо войти в аккаунт.');
    }
  }

  public async savePublicProfile(profile: PublicProfile): Promise<void> {
    if (!isFirebaseConfigured) return;
    this.assertCurrentUser(profile.uid);
    const profileRef = doc(db, 'public_user_profiles', profile.uid);
    await setDoc(profileRef, sanitizeFirestoreData({
      ...profile,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  }

  public async publishIdentity(identity: Pick<PublicProfile, 'uid' | 'displayName' | 'avatar'>): Promise<void> {
    if (!isFirebaseConfigured) return;
    this.assertCurrentUser(identity.uid);
    await setDoc(doc(db, 'public_user_profiles', identity.uid), sanitizeFirestoreData({
      ...identity,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  }

  public async syncLearningSnapshot(
    uid: string,
    snapshot: Pick<PublicProfile, 'currentNodeIds' | 'currentNodes' | 'ringProgress' | 'status'>
  ): Promise<void> {
    if (!isFirebaseConfigured) return;
    this.assertCurrentUser(uid);
    const profileRef = doc(db, 'public_user_profiles', uid);
    await setDoc(profileRef, sanitizeFirestoreData({
      uid,
      ...snapshot,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  }

  public subscribeProfile(uid: string, onProfile: (profile: PublicProfile | null) => void) {
    if (!uid || !isFirebaseConfigured) {
      onProfile(null);
      return () => {};
    }
    return onSnapshot(
      doc(db, 'public_user_profiles', uid),
      (snapshot) => onProfile(snapshot.exists() ? snapshot.data() as PublicProfile : null),
      (error) => console.warn(`[Social profile] Profile subscription failed for ${uid}:`, error)
    );
  }

  public async publishPortfolio(uid: string, displayName: string, avatar: string | undefined, artifacts: UserArtifact[]): Promise<void> {
    if (!isFirebaseConfigured) return;
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

    const portfolioRef = doc(db, 'public_portfolios', uid);
    await setDoc(portfolioRef, sanitizeFirestoreData({
      uid,
      displayName: String(displayName || 'Студент').slice(0, 120),
      avatar: avatar || null,
      isPublic: true,
      artifacts: publicArtifacts,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  public async unpublishPortfolio(uid: string): Promise<void> {
    this.assertCurrentUser(uid);
    await deleteDoc(doc(db, 'public_portfolios', uid));
  }

  public subscribePublishedPortfolio(
    uid: string,
    onPortfolio: (portfolio: PublicPortfolio | null) => void,
    onError?: (error: Error) => void
  ) {
    if (!uid) return () => {};
    return onSnapshot(
      doc(db, 'public_portfolios', uid),
      (snapshot) => {
        const data = snapshot.data();
        onPortfolio(snapshot.exists() && data?.isPublic === true ? data as PublicPortfolio : null);
      },
      (error) => {
        console.warn(`[Portfolio] Public portfolio subscription failed for ${uid}:`, error);
        onError?.(error);
      }
    );
  }

  public sendPartnerRequest(request: Omit<PartnerRequestRecord, 'id' | 'status' | 'createdAt'>): Promise<string> {
    this.assertCurrentUser(request.fromUserId);
    if (request.fromUserId === request.toUserId) {
      return Promise.reject(new Error('Нельзя отправить заявку самому себе.'));
    }
    return addDoc(collection(db, 'partner_requests'), sanitizeFirestoreData({
      ...request,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })).then((requestRef) => requestRef.id);
  }

  public subscribePartnerRequests(
    uid: string,
    onRequests: (requests: PartnerRequestRecord[]) => void
  ) {
    if (!uid || auth.currentUser?.uid !== uid) return () => {};
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
    return () => listeners.forEach((unsubscribe) => unsubscribe());
  }

  public async respondToPartnerRequest(requestId: string, recipientUid: string, status: 'accepted' | 'rejected') {
    this.assertCurrentUser(recipientUid);
    await updateDoc(doc(db, 'partner_requests', requestId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  public subscribeWallPosts(ownerUid: string, onPosts: (posts: ProfileWallPost[]) => void) {
    if (!ownerUid) return () => {};
    const postsQuery = query(collection(db, 'profile_wall_posts'), where('ownerUid', '==', ownerUid));
    return onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs
        .map((item) => item.data() as ProfileWallPost)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onPosts(posts);
    }, (error) => console.warn(`[Social profile] Wall subscription failed for ${ownerUid}:`, error));
  }

  public async createWallPost(ownerUid: string, post: Omit<ProfileWallPost, 'id'>): Promise<void> {
    this.assertCurrentUser(post.authorId);
    await addDoc(collection(db, 'profile_wall_posts'), sanitizeFirestoreData({
      ...post,
      ownerUid,
    }));
  }
}

export const socialProfileService = new SocialProfileService();
