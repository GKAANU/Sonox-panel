"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

interface CallContextType {
  callUser: (userId: string, isVideo: boolean) => void;
  answerCall: () => void;
  endCall: () => void;
  stream: MediaStream | null;
  call: {
    isReceivingCall: boolean;
    from: string;
    signal: any;
    isVideo: boolean;
  };
  callAccepted: boolean;
  myVideo: React.RefObject<HTMLVideoElement>;
  userVideo: React.RefObject<HTMLVideoElement>;
  callEnded: boolean;
  me: string;
  isVideo: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [me, setMe] = useState('');
  const [call, setCall] = useState({ isReceivingCall: false, from: '', signal: null, isVideo: true });
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isVideo, setIsVideo] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance>();
  const socketRef = useRef<Socket>();

  useEffect(() => {
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('me', (id) => setMe(id));

    socketRef.current.on('callUser', ({ from, signal: callerSignal, isVideo }) => {
      setCall({
        isReceivingCall: true,
        from,
        signal: callerSignal,
        isVideo
      });
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeStream = async (video: boolean) => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio: true
      });
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const callUser = async (userId: string, withVideo: boolean) => {
    setIsVideo(withVideo);
    await initializeStream(withVideo);
    
    if (!stream) return;

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      socketRef.current?.emit('callUser', {
        userToCall: userId,
        signalData: data,
        from: me,
        isVideo: withVideo
      });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    socketRef.current?.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = async () => {
    setIsVideo(call.isVideo);
    await initializeStream(call.isVideo);
    
    if (!stream || !call.signal) return;

    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      socketRef.current?.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  const endCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCallAccepted(false);
    setCall({ isReceivingCall: false, from: '', signal: null, isVideo: true });
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const value = {
    call,
    callAccepted,
    myVideo,
    userVideo,
    stream,
    callEnded,
    me,
    callUser,
    answerCall,
    endCall,
    isVideo,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}; 