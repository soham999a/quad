import { useCallback, useEffect, useRef, useState } from 'react';
import {
  publishWebRtcOffer, publishWebRtcAnswer, addEvalIceCandidate,
  addCandidateIceCandidate, clearWebRtc, subscribeSession,
} from '../services/interviewService';

/**
 * useInterviewCall — Google-Meet-style video/audio for the live interview room.
 *
 * The two-browser conversation rides on peer-to-peer WebRTC; Firestore (the
 * session doc) is only the signalling channel that carries the SDP offer and
 * answer and a trickle of ICE candidates. Roles are asymmetrical, which keeps
 * the exchange glare-free by construction:
 *   - evaluator publishes the offer, consumes the answer;
 *   - candidate consumes the offer, publishes the answer.
 *
 * Each side also publishes its own ICE candidates into its own field, so
 * neither side can ever overwrite the other's signalling state.
 *
 * Camera/mic permission is explicitly requested — the call never starts
 * until the user joins with the join button.
 */
export default function useInterviewCall({ sessionId, isEvaluator }) {
  const [status, setStatus] = useState('idle'); // idle|requesting|connecting|connected|failed|ended
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  // Live wire stats — surfaced in the dock so "waiting to connect" is never
  // a black box: pc state, ice state, and the last signalling error code.
  const [connState, setConnState] = useState('idle');
  const [iceState, setIceState] = useState('idle');
  const [sigError, setSigError] = useState(null);

  const pcRef = useRef(null);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const unsubRef = useRef(null);
  const handledRef = useRef({ offerSdp: null, answerSdp: null, iceByValue: new Set() });
  const pendingIceRef = useRef([]); // ICE seen before the peer description arrived
  const roleRef = useRef(isEvaluator);
  roleRef.current = isEvaluator;

  const teardown = useCallback(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (pcRef.current) { try { pcRef.current.close(); } catch { /* already closed */ } pcRef.current = null; }
    localRef.current?.getTracks().forEach(t => t.stop());
    localRef.current = null;
    remoteRef.current = null;
    handledRef.current = { offerSdp: null, answerSdp: null, iceByValue: new Set() };
    pendingIceRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setConnState('idle');
    setIceState('idle');
    setSigError(null);
  }, []);

  const stop = useCallback(() => {
    teardown();
    setStatus('ended');
    if (sessionId) clearWebRtc(sessionId);
  }, [teardown, sessionId]);

  const applyStream = useCallback(pc => {
    pc.ontrack = e => {
      const stream = e.streams?.[0];
      if (stream && stream !== remoteRef.current) {
        remoteRef.current = stream;
        setRemoteStream(stream);
      }
    };
  }, []);

  const bufferOrApplyIce = useCallback((pc, candidate) => {
    if (!candidate) return;
    if (pc.remoteDescription) pc.addIceCandidate(candidate).catch(() => { /* late candidate */ });
    else pendingIceRef.current.push(candidate);
  }, []);

  const flushPendingIce = useCallback(pc => {
    for (const c of pendingIceRef.current) pc.addIceCandidate(c).catch(() => {});
    pendingIceRef.current = [];
  }, []);

  const wireIce = useCallback((pc, publish) => {
    pc.onicecandidate = e => {
      if (e.candidate) publish({ candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate });
    };
    // Candidate-level ICE errors (firewall blocking UDP, dead TURN credentials,
    // mDNS resolution): console-only, but the state ribbon surfaces the result.
    pc.onicecandidateerror = e => {
      console.warn('[interview-call] ICE candidate error', e.errorCode, e.errorText, e.url || '');
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      setConnState(st);
      if (st === 'connected') setStatus('connected');
      else if (st === 'failed') setStatus('failed');
      else if (st === 'disconnected') setStatus('connecting'); // brief renegotiation window
      else setStatus(s => (s === 'connected' ? s : 'connecting'));
    };
    pc.oniceconnectionstatechange = () => setIceState(pc.iceConnectionState);
  }, []);

  const buildPeer = useCallback(sendIce => {
    const pc = new RTCPeerConnection({
      iceServers: [
        // STUN discovers public addresses; it is free and usually enough when
        // both peers share a NAT or a permissive home connection.
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        // TURN relays media when the two peers sit behind carrier-grade or
        // symmetric NAT (common on mobile data and corporate Wi-Fi). Without
        // a relay in the list, "my camera works but their video never shows"
        // is exactly the failure mode. Metered's open relay is a public demo
        // relay — fine for a pilot; a private TURN follows with scale.
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp',
          ],
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ],
      iceCandidatePoolSize: 4,
    });
    applyStream(pc);
    wireIce(pc, sendIce);
    if (localRef.current) localRef.current.getTracks().forEach(t => pc.addTrack(t, localRef.current));
    pcRef.current = pc;
    return pc;
  }, [applyStream, wireIce]);

  const grabMedia = useCallback(async () => {
    if (localRef.current) return localRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    });
    localRef.current = stream;
    setLocalStream(stream);
    setMuted(false);
    setCameraOff(false);
    return stream;
  }, []);

  const start = useCallback(async () => {
    if (!sessionId || pcRef.current) return;
    setStatus('requesting');
    setMediaError(null);
    try {
      await grabMedia();
      const publishIce = isEvaluator
        ? c => addEvalIceCandidate(sessionId, c)
        : c => addCandidateIceCandidate(sessionId, c);

      if (isEvaluator) {
        const pc = buildPeer(publishIce);
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        setStatus('connecting');
        publishWebRtcOffer(sessionId, { type: offer.type, sdp: pc.localDescription.sdp });
      } else {
        // The candidate cannot build an answer until the evaluator's offer
        // lands; media + the subscription below do all the pre-waiting work.
        buildPeer(publishIce);
        setStatus('connecting');
      }

      // Signalling loop — the snapshot drives everything that follows.
      // (Firestore push latency on answers is milliseconds; no local mirror
      // of state is kept that could drift from the doc.)
      unsubRef.current = subscribeSession(sessionId, data => {
        if (!data) return;
        let pc = pcRef.current;
        if (!pc) return;
        const role = isEvaluator;

        if (!role) {
          // ── Candidate side ────────────────────────────────────────────
          const offerSdp = data.webrtcOffer?.sdp || null;
          if (offerSdp && handledRef.current.offerSdp !== offerSdp) {
            // First offer, or the evaluator left and re-joined (a fresh offer
            // means fresh negotiation). A pc can only take one remote
            // description that changes the core session — rebuild instead.
            handledRef.current.offerSdp = offerSdp;
            handledRef.current.iceByValue = new Set();
            pendingIceRef.current = [];
            try { pc.close(); } catch { /* already closed */ }
            pc = buildPeer(publishIce);
            setStatus('connecting');
            pc.setRemoteDescription(data.webrtcOffer)
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => {
                flushPendingIce(pc);
                return publishWebRtcAnswer(sessionId, {
                  type: pc.localDescription.type,
                  sdp: pc.localDescription.sdp,
                });
              })
              .catch(() => setStatus('failed'));
          }
        } else if (data.webrtcAnswer) {
          // ── Evaluator side: consume the answer (fresh SDP wins) ──────
          const answerSdp = data.webrtcAnswer.sdp || '';
          if (handledRef.current.answerSdp !== answerSdp) {
            handledRef.current.answerSdp = answerSdp;
            handledRef.current.iceByValue = new Set();
            pendingIceRef.current = [];
            pc.setRemoteDescription(data.webrtcAnswer)
              .then(() => flushPendingIce(pc))
              .catch(() => setStatus('failed'));
          }
        }

        // ── Both sides: drain the OTHER side's ICE array ──────────────
        const theirs = role ? data.webrtcCandIce : data.webrtcEvalIce;
        for (const c of theirs || []) {
          const cand = c?.candidate != null && (c.type === 'candidate' || c.sdpMid != null)
            ? c
            : (c && typeof c.toJSON === 'function' ? c.toJSON() : c);
          const norm = typeof cand?.candidate === 'string' ? cand.candidate : JSON.stringify(cand);
          if (!norm || norm === '{}' || handledRef.current.iceByValue.has(norm)) continue;
          handledRef.current.iceByValue.add(norm);
          bufferOrApplyIce(pc, cand);
        }
      }, err => {
        // A dead subscription explains "stuck waiting to connect" with no
        // other trace — never stay silent about it.
        console.warn('[interview-call] signalling subscription error:', err?.code || err?.message);
        setSigError(err?.code || 'signalling error');
      });
    } catch (e) {
      teardown();
      setStatus('failed');
      setMediaError(
        e?.name === 'NotAllowedError'
          ? 'Camera or microphone permission was denied. Allow access in your browser settings and join again.'
          : e?.name === 'NotFoundError'
            ? 'No camera or microphone found on this device.'
            : 'Could not start the call — check your connection and try again.',
      );
    }
  }, [sessionId, isEvaluator, buildPeer, grabMedia, teardown, flushPendingIce, bufferOrApplyIce]);

  const toggleMute = useCallback(() => {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = muted;
    setMuted(!muted);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const track = localRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = cameraOff;
    setCameraOff(!cameraOff);
  }, [cameraOff]);

  // Unmount cleanup (routes away, completed session reload).
  useEffect(() => () => teardown(), [teardown]);

  return { status, muted, cameraOff, localStream, remoteStream, mediaError, connState, iceState, sigError, start, stop, toggleMute, toggleCamera };
}
