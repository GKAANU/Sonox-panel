"use client";

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCall } from './CallProvider';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

export const CallInterface = () => {
  const {
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
  } = useCall();

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    
    if (call.isReceivingCall && !callAccepted) {
      audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      audio.play().catch(console.error);
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [call.isReceivingCall, callAccepted]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-4xl p-6">
          <div className={`grid ${isVideo ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {/* My Video/Audio */}
            <div className="relative">
              {isVideo ? (
                <video
                  playsInline
                  muted
                  ref={myVideo}
                  autoPlay
                  className="w-full rounded-lg bg-muted"
                />
              ) : (
                <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Mic className="w-8 h-8 mx-auto mb-2" />
                    <span>You</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4">
                <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">
                  You {!isAudioEnabled && '(Muted)'}
                </span>
              </div>
            </div>

            {/* User Video/Audio */}
            {callAccepted && !callEnded && (
              <div className="relative">
                {isVideo ? (
                  <video
                    playsInline
                    ref={userVideo}
                    autoPlay
                    className="w-full rounded-lg bg-muted"
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Mic className="w-8 h-8 mx-auto mb-2" />
                      <span>Caller</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">
                    Caller
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex justify-center gap-4 mt-6">
            {call.isReceivingCall && !callAccepted && (
              <div className="text-center">
                <p className="mb-4">Incoming {call.isVideo ? 'Video' : 'Voice'} Call...</p>
                <Button onClick={answerCall} variant="default">
                  <Phone className="w-4 h-4 mr-2" />
                  Answer
                </Button>
              </div>
            )}

            {callAccepted && !callEnded && (
              <>
                {isVideo && (
                  <Button onClick={toggleVideo} variant="outline">
                    {isVideoEnabled ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <VideoOff className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button onClick={toggleAudio} variant="outline">
                  {isAudioEnabled ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                </Button>
                <Button onClick={endCall} variant="destructive">
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}; 