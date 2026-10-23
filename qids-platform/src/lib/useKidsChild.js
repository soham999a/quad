// ─── useKidsChild ────────────────────────────────────────────────────────────
// One place that owns "which child am I looking at, and what have they done".
// The kids module is a set of child sub-profiles under the signed-in adult
// account, so no new auth surface exists: the uid here is the guardian's.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AVATARS,
  createKidsProfile,
  exportKidsData,
  loadKidsProfiles,
  loadKidsProgress,
  peekKidsProfiles,
  peekKidsProgress,
  removeKidsProfile,
  saveKidsProgress,
} from '../services/kidsService';
import { emptyProgress, normalizeProgress } from '../core/kids/progress';

const ACTIVE_KEY = 'qids-kids-active-child';

function readActive() {
  try { return window.localStorage.getItem(ACTIVE_KEY) || null; } catch { return null; }
}

export default function useKidsChild() {
  const { user, userProfile } = useAuth();
  const uid = user?.uid || null;

  const [profiles, setProfiles] = useState(() => peekKidsProfiles());
  const [childId, setChildId] = useState(() => readActive());
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  // Latest committed progress, so a save can append only newly finished
  // sessions without depending on a stale closure.
  const progressRef = useRef(null);

  // Load profiles (local paint first, then the network).
  useEffect(() => {
    let alive = true;
    loadKidsProfiles(uid)
      .then(list => { if (alive) setProfiles(list); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [uid]);

  // Keep the active child valid as profiles arrive.
  useEffect(() => {
    if (!profiles.length) return;
    if (!childId || !profiles.some(p => p.id === childId)) {
      setChildId(profiles[0].id);
    }
  }, [profiles, childId]);

  // Persist the active child across visits.
  useEffect(() => {
    try {
      if (childId) window.localStorage.setItem(ACTIVE_KEY, childId);
    } catch { /* best-effort */ }
  }, [childId]);

  // Load that child's progress: paint the local record instantly, then
  // reconcile with the network copy. Without the instant paint the dashboard
  // would briefly render "nothing left to play" on every visit.
  useEffect(() => {
    if (!childId) { setProgress(null); progressRef.current = null; return; }
    let alive = true;
    const cached = peekKidsProgress(childId);
    setProgress(cached);
    progressRef.current = cached;
    loadKidsProgress(uid, childId)
      .then(p => {
        if (!alive) return;
        setProgress(p);
        progressRef.current = p;
      })
      .catch(() => {
        if (!alive) return;
        const fallback = emptyProgress(childId);
        setProgress(fallback);
        progressRef.current = fallback;
      });
    return () => { alive = false; };
  }, [uid, childId]);

  const addChild = useCallback(async ({ name, avatar, ageBand, consent }) => {
    const profile = await createKidsProfile(uid, { name, avatar, ageBand, consent });
    setProfiles(prev => [...prev, profile]);
    setChildId(profile.id);
    setProgress(emptyProgress(profile.id));
    progressRef.current = emptyProgress(profile.id);
    return profile;
  }, [uid]);

  const removeChild = useCallback(async (id) => {
    await removeKidsProfile(uid, id);
    setProfiles(prev => {
      const next = prev.filter(p => p.id !== id);
      if (id === childId) setChildId(next[0]?.id || null);
      return next;
    });
  }, [uid, childId]);

  /** Write-through: UI updates immediately, storage follows. */
  const commit = useCallback((next) => {
    const normalized = normalizeProgress(next, next?.childId || childId);
    const prev = progressRef.current;
    setProgress(normalized);
    progressRef.current = normalized;
    saveKidsProgress(uid, normalized, prev);
    return normalized;
  }, [uid, childId]);

  /** Guardian data request: returns the full record as JSON. */
  const exportChild = useCallback(
    (id) => exportKidsData(uid, id || childId),
    [uid, childId],
  );

  const child = profiles.find(p => p.id === childId) || null;

  return {
    uid,
    guardianName: userProfile?.name || user?.displayName || '',
    profiles,
    child,
    childId,
    setChildId,
    progress,
    progressReady: progress !== null,
    commit,
    addChild,
    removeChild,
    exportChild,
    loading,
    avatars: AVATARS,
  };
}
