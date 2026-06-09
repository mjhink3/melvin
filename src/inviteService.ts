/**
 * inviteService.ts
 * Invitation system -- the only way to access Melvin is through introduction.
 * Each user gets 3 invites. Melvin's first message references the introducer.
 */

import { db } from './firebaseConfig';
import {
  doc, getDoc, setDoc, collection, query,
  where, getDocs, updateDoc, serverTimestamp
} from 'firebase/firestore';

export interface InviteRecord {
  token: string;
  inviterUid: string;
  inviterName: string;
  createdAt: any;
  usedAt?: any;
  usedByUid?: string;
  used: boolean;
}

export interface UserInviteProfile {
  uid: string;
  invitesRemaining: number;
  invitedBy?: string;   // UID of who introduced them
  invitedByName?: string;
  joinedAt: any;
}

// Generate a readable invite token
function generateInviteToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) token += '-';
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Get or create a user's invite profile
export async function getOrCreateInviteProfile(uid: string, displayName?: string): Promise<UserInviteProfile> {
  const ref = doc(db, 'inviteProfiles', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserInviteProfile;

  const profile: UserInviteProfile = {
    uid,
    invitesRemaining: 3,
    joinedAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return profile;
}

// Create a new invite token for a user
export async function createInvite(inviterUid: string, inviterName: string): Promise<string | null> {
  const profile = await getOrCreateInviteProfile(inviterUid);
  if (profile.invitesRemaining <= 0) return null;

  const token = generateInviteToken();
  const inviteRef = doc(db, 'invites', token);
  const invite: InviteRecord = {
    token,
    inviterUid,
    inviterName: inviterName || 'someone',
    createdAt: serverTimestamp(),
    used: false,
  };
  await setDoc(inviteRef, invite);

  // Decrement invites remaining
  const profileRef = doc(db, 'inviteProfiles', inviterUid);
  await updateDoc(profileRef, { invitesRemaining: profile.invitesRemaining - 1 });

  return token;
}

// Validate an invite token and return the inviter info
export async function validateInvite(token: string): Promise<InviteRecord | null> {
  if (!token) return null;
  const ref = doc(db, 'invites', token);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const invite = snap.data() as InviteRecord;
  if (invite.used) return null;
  return invite;
}

// Mark invite as used when new user signs up
export async function redeemInvite(token: string, newUserUid: string): Promise<string | null> {
  const invite = await validateInvite(token);
  if (!invite) return null;

  // Mark invite used
  const inviteRef = doc(db, 'invites', token);
  await updateDoc(inviteRef, {
    used: true,
    usedAt: serverTimestamp(),
    usedByUid: newUserUid,
  });

  // Record who introduced the new user
  const profileRef = doc(db, 'inviteProfiles', newUserUid);
  await setDoc(profileRef, {
    uid: newUserUid,
    invitesRemaining: 3,
    invitedBy: invite.inviterUid,
    invitedByName: invite.inviterName,
    joinedAt: serverTimestamp(),
  });

  return invite.inviterName;
}

// Get a user's invite links
export async function getUserInvites(uid: string): Promise<InviteRecord[]> {
  const q = query(collection(db, 'invites'), where('inviterUid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as InviteRecord);
}

// Get how many invites a user has left
export async function getInvitesRemaining(uid: string): Promise<number> {
  const profile = await getOrCreateInviteProfile(uid);
  return profile.invitesRemaining;
}

// Store pending invite token in localStorage before login
export const PENDING_INVITE_KEY = 'melvin_pending_invite';

export function storePendingInvite(token: string) {
  localStorage.setItem(PENDING_INVITE_KEY, token);
}

export function getPendingInvite(): string | null {
  return localStorage.getItem(PENDING_INVITE_KEY);
}

export function clearPendingInvite() {
  localStorage.removeItem(PENDING_INVITE_KEY);
}
