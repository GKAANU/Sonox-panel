"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

interface CallContextType {
  callUser: (userId: string) => void;
  answerCall: () => void;
  endCall: () => void;
  stream: MediaStream | null;
  call: {
    isReceivingCall: boolean;
    from: string;
    signal: any;
  };
  callAccepted: boolean;
  myVideo: React.RefObject<HTMLVideoElement>;
  userVideo: React.RefObject<HTMLVideoElement>;
  callEnded: boolean;
  me: string;
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
  const [call, setCall] = useState({ isReceivingCall: false, from: '', signal: null });
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance>();
  const socketRef = useRef<Socket>();

  useEffect(() => {
    // Socket.IO bağlantısını başlat
    socketRef.current = io('http://localhost:3001');

    // Kullanıcının kamera ve mikrofon erişimini al
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      });

    // Socket.IO event listener'ları
    socketRef.current.on('me', (id) => setMe(id));

    socketRef.current.on('callUser', ({ from, signal: callerSignal }) => {
      setCall({
        isReceivingCall: true,
        from,
        signal: callerSignal,
      });
    });

    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const callUser = (userId: string) => {
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

  const answerCall = () => {
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
    window.location.reload();
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
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}; 