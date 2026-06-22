import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(pseudo) {
  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'ringing', 'connected'
  const [caller, setCaller] = useState(null); // The person calling us
  const [callTarget, setCallTarget] = useState(null); // The person we are calling
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef(null);
  const channelRef = useRef(null);

  const cleanupCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCaller(null);
    setCallTarget(null);
    setIsMuted(false);
  }, [localStream]);

  const sendSignal = useCallback((target, type, data) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: { target, sender: pseudo, type, data }
      });
    }
  }, [pseudo]);

  useEffect(() => {
    if (!pseudo) return;

    const channel = supabase.channel('webrtc_signaling', {
      config: { broadcast: { ack: true } }
    });

    channel.on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
      // Ignore if not for us
      if (payload.target !== pseudo) return;

      if (payload.type === 'offer') {
        // If we are already in a call, we should reject or ignore.
        if (callState !== 'idle' && callState !== 'ringing') {
          // Could send busy signal here
          sendSignal(payload.sender, 'busy', null);
          return;
        }
        setCaller(payload.sender);
        setCallState('ringing');
        // Store the offer to be processed when accepted
        pcRef.current = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current.remoteOffer = payload.data.sdp;
        
        setupPeerConnection(payload.sender);
      } 
      else if (payload.type === 'answer') {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.data.sdp));
          setCallState('connected');
        }
      } 
      else if (payload.type === 'ice-candidate') {
        if (pcRef.current && pcRef.current.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.data.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate', e);
          }
        }
      } 
      else if (payload.type === 'end-call' || payload.type === 'busy') {
        cleanupCall();
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      cleanupCall();
    };
  }, [pseudo, callState, cleanupCall, sendSignal]);

  const setupPeerConnection = (peerPseudo) => {
    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerPseudo, 'ice-candidate', { candidate: event.candidate });
      }
    };

    pcRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
  };

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get local stream", err);
      alert("Failed to access microphone. Please check your permissions.");
      return null;
    }
  };

  const startCall = async (targetPseudo) => {
    setCallTarget(targetPseudo);
    setCallState('calling');
    
    const stream = await getMedia();
    if (!stream) {
      setCallState('idle');
      return;
    }

    pcRef.current = new RTCPeerConnection(ICE_SERVERS);
    setupPeerConnection(targetPseudo);

    stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    sendSignal(targetPseudo, 'offer', { sdp: offer });
  };

  const acceptCall = async () => {
    const stream = await getMedia();
    if (!stream) {
      endCall();
      return;
    }

    stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

    await pcRef.current.setRemoteDescription(new RTCSessionDescription(pcRef.current.remoteOffer));
    
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);

    setCallState('connected');
    sendSignal(caller, 'answer', { sdp: answer });
  };

  const endCall = () => {
    const target = callTarget || caller;
    if (target) {
      sendSignal(target, 'end-call', null);
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return {
    callState,
    caller,
    callTarget,
    localStream,
    remoteStream,
    isMuted,
    startCall,
    acceptCall,
    endCall,
    toggleMute
  };
}
