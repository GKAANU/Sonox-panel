"use client";

import React from 'react';
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
  } = useCall();

  const [isVideoEnabled, setIsVideoEnabled] = React.useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = React.useState(true);

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-4xl p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* My Video */}
            <div className="relative">
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay
                className="w-full rounded-lg bg-muted"
              />
              <div className="absolute bottom-4 left-4">
                <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">
                  You
                </span>
              </div>
            </div>

            {/* User Video */}
            {callAccepted && !callEnded && (
              <div className="relative">
                <video
                  playsInline
                  ref={userVideo}
                  autoPlay
                  className="w-full rounded-lg bg-muted"
                />
                <div className="absolute bottom-4 left-4">
                  <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">
                    Caller
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mt-6">
            {call.isReceivingCall && !callAccepted && (
              <Button onClick={answerCall} variant="default">
                <Phone className="w-4 h-4 mr-2" />
                Answer Call
              </Button>
            )}

            {callAccepted && !callEnded && (
              <>
                <Button onClick={toggleVideo} variant="outline">
                  {isVideoEnabled ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <VideoOff className="w-4 h-4" />
                  )}
                </Button>
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