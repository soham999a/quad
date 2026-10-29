import React from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Monitor, Loader2 } from 'lucide-react';

/**
 * VideoCallDock — the video/audio dock for the live interview, shared by the
 * evaluator room and the candidate screen. Renders peer-to-peer WebRTC through
 * useInterviewCall(): the remote peer large, your own camera as a small inset,
 * and mic/camera/leave controls. States stay honest — permission errors,
 * waiting-to-connect and call-ended are all shown, never faked.
 */
export default function VideoCallDock({ call, role = 'evaluator', className = '' }) {
  const { status, muted, cameraOff, localStream, remoteStream, mediaError, connState, iceState, sigError } = call;

  const retry = () => { try { call.stop(); } finally { setTimeout(() => call.start(), 400); } };

  // Attach streams to the video elements — srcObject is not a React attribute.
  const remoteRef = el => { if (el && remoteStream) el.srcObject = remoteStream; };
  const localRef = el => { if (el && localStream) el.srcObject = localStream; };

  const statusLine = {
    idle: null,
    requesting: 'Getting camera and microphone…',
    connecting: 'Calling — waiting to connect…',
    connected: 'Call connected',
    failed: mediaError || 'Call failed to connect.',
    ended: 'Call ended',
  }[status];

  const stateDot = {
    requesting: 'bg-gold animate-pulse',
    connecting: 'bg-gold animate-pulse',
    connected: 'bg-success',
    failed: 'bg-red-500',
    ended: 'bg-outline-variant',
  }[status];

  return (
    <div className={`card overflow-hidden ${className}`}>
      {status === 'idle' ? (
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 border-[0.5px] border-primary/30 bg-primary/10 flex items-center justify-center" style={{ borderRadius: '6px' }}>
            <Monitor size={20} className="text-primary" />
          </div>
          <div className="text-label-md font-label-md text-on-background mb-1">Video & audio call</div>
          <p className="text-body-sm font-body-sm text-on-surface-variant mb-4 max-w-[320px] mx-auto">
            {role === 'evaluator'
              ? 'See and hear the candidate face-to-face while you ask and score. Nothing starts until you join.'
              : 'See and hear your evaluator live while you answer. Nothing starts until you join.'}
          </p>
          <button type="button" onClick={call.start} className="btn-primary glow inline-flex items-center gap-2 cursor-pointer">
            <Video size={13} /> Join with camera & audio
          </button>
        </div>
      ) : (
        <div>
          {/* Remote peer — the main stage */}
          <div className="relative aspect-video bg-[#0b0d10]">
            <video
              ref={remoteRef}
              autoPlay playsInline
              className={`w-full h-full object-cover ${remoteStream ? '' : 'hidden'}`}
            />
            {!remoteStream && <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <Loader2 size={22} className="text-gold/70 animate-spin mb-3" />
                <div className="text-body-sm font-body-sm text-white/70">
                  {statusLine || 'Waiting…'}
                </div>
                {/* Wire truth while connecting: peer state and ICE state tell us
                    whether failure is signalling or network — no more guessing. */}
                {status === 'connecting' && (
                  <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-white/40">
                    pc {connState || '…'} · ice {iceState || '…'}{sigError ? ` · sig ${sigError}` : ''}
                  </div>
                )}
              </div>}
            {/* Own camera inset */}
            {localStream && <div className="absolute bottom-3 right-3 w-[112px] aspect-video bg-[#0b0d10] border border-white/10 overflow-hidden" style={{ borderRadius: '6px' }}>
                <video ref={localRef} autoPlay playsInline muted
                  className={`w-full h-full object-cover ${cameraOff ? 'hidden' : ''}`} />
                {cameraOff && <div className="absolute inset-0 flex items-center justify-center"><VideoOff size={14} className="text-white/50" /></div>}
              </div>}
          </div>

          {/* Status ribbon */}
          <div className="flex items-center gap-2 px-4 py-2 border-y-[0.5px] border-outline-variant bg-surface-container-low">
            <span className={`w-1.5 h-1.5 flex-shrink-0 ${stateDot || 'bg-outline-variant'}`} />
            <span className="text-technical-sm font-technical-sm uppercase tracking-widest text-on-surface-variant truncate">
              {statusLine || 'Idle'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            <button type="button" onClick={call.toggleMute}
              title={muted ? 'Unmute microphone' : 'Mute microphone'}
              className={`inline-flex items-center gap-2 px-3.5 py-2 border-[0.5px] transition-colors cursor-pointer ${muted ? 'border-red-400/40 text-red-400 bg-red-400/10' : 'border-outline-variant text-on-surface bg-surface-container-low hover:bg-surface-container'}`}
              style={{ borderRadius: '6px' }}>
              {muted ? <MicOff size={14} /> : <Mic size={14} />}
              <span className="text-technical-sm font-technical-sm uppercase tracking-widest">{muted ? 'Unmute' : 'Mute'}</span>
            </button>
            <button type="button" onClick={call.toggleCamera}
              title={cameraOff ? 'Turn camera on' : 'Turn camera off'}
              className={`inline-flex items-center gap-2 px-3.5 py-2 border-[0.5px] transition-colors cursor-pointer ${cameraOff ? 'border-red-400/40 text-red-400 bg-red-400/10' : 'border-outline-variant text-on-surface bg-surface-container-low hover:bg-surface-container'}`}
              style={{ borderRadius: '6px' }}>
              {cameraOff ? <VideoOff size={14} /> : <Video size={14} />}
              <span className="text-technical-sm font-technical-sm uppercase tracking-widest">{cameraOff ? 'Camera on' : 'Camera off'}</span>
            </button>
            <button type="button" onClick={status === 'failed' ? retry : call.stop}
              title={status === 'failed' ? 'Retry the call' : 'Leave the call'}
              className="inline-flex items-center gap-2 px-3.5 py-2 border-[0.5px] border-red-400/40 text-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors cursor-pointer"
              style={{ borderRadius: '6px' }}>
              <PhoneOff size={14} />
              <span className="text-technical-sm font-technical-sm uppercase tracking-widest">{status === 'failed' ? 'Retry' : 'Leave'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
