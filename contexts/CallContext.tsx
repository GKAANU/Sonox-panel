"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

interface CallContextType {
  callUser: (userId: string, isVideo: boolean) => void;
  endCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  call: {
    isReceivingCall: boolean;
    from: string | null;
    isVideo: boolean;
  };
  callAccepted: boolean;
  isCalling: boolean;
  myVideo: React.RefObject<HTMLVideoElement>;
  userVideo: React.RefObject<HTMLVideoElement>;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [call, setCall] = useState({
    isReceivingCall: false,
    from: null,
    isVideo: false
  });
  const [callAccepted, setCallAccepted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [me, setMe] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callSignal, setCallSignal] = useState<any>(null);

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance>();
  const socketRef = useRef<Socket>();

  useEffect(() => {
    if (!user) return;

    try {
      socketRef.current = io('http://localhost:3001');
      
      socketRef.current.on('me', (id) => setMe(id));
      
      socketRef.current.on('callUser', ({ from, signal, isVideo }) => {
        setCall({
          isReceivingCall: true,
          from,
          isVideo
        });
        setCallSignal(signal);
        toast.info('Incoming call...', {
          action: {
            label: 'Answer',
            onClick: () => acceptCall()
          }
        });
      });

      socketRef.current.on('callEnded', () => {
        endCall();
        toast.info('Call ended');
      });

      return () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to call service');
    }
  }, [user]);

  const callUser = async (userId: string, isVideo: boolean) => {
    try {
      setIsCalling(true);
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('signal', (data) => {
        socketRef.current?.emit('callUser', {
          userToCall: userId,
          signalData: data,
          from: me,
          isVideo
        });
      });

      peer.on('stream', (currentStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      });

      socketRef.current?.on('callAccepted', (signal) => {
        setCallAccepted(true);
        setIsCalling(false);
        peer.signal(signal);
        toast.success('Call connected');
      });

      socketRef.current?.on('callRejected', () => {
        setIsCalling(false);
        endCall();
        toast.error('Call was rejected');
      });

      connectionRef.current = peer;
    } catch (error) {
      console.error('Error in callUser:', error);
      setIsCalling(false);
      endCall();
      toast.error('Failed to start call');
    }
  };

  const acceptCall = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: call.isVideo,
        audio: true
      });
      
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      setCallAccepted(true);

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('signal', (data) => {
        socketRef.current?.emit('answerCall', { signal: data, to: call.from });
      });

      peer.on('stream', (currentStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      });

      peer.signal(callSignal);
      connectionRef.current = peer;
      toast.success('Call connected');
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to accept call');
      endCall();
    }
  };

  const rejectCall = () => {
    if (call.from) {
      socketRef.current?.emit('rejectCall', { from: call.from });
      endCall();
    }
  };

  const endCall = () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      setCallAccepted(false);
      setCall({ isReceivingCall: false, from: null, isVideo: false });
      setStream(null);
      setCallSignal(null);
      if (myVideo.current) myVideo.current.srcObject = null;
      if (userVideo.current) userVideo.current.srcObject = null;
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Error ending call');
    }
  };

  return (
    <CallContext.Provider value={{ 
      callUser, 
      endCall, 
      acceptCall,
      rejectCall,
      call, 
      callAccepted,
      isCalling,
      myVideo,
      userVideo
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
} 