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
    isVideoEnabled,
    isCalling
  } = useCall();

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    
    if ((call.isReceivingCall || isCalling) && !callAccepted) {
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
  }, [call.isReceivingCall, callAccepted, isCalling]);

  if (!call.isReceivingCall && !callAccepted && !isCalling) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-4xl p-6">
          {isCalling ? (
            <div className="text-center py-8">
              <div className="animate-pulse mb-4">
                {isVideo ? (
                  <Video className="w-12 h-12 mx-auto text-primary" />
                ) : (
                  <Phone className="w-12 h-12 mx-auto text-primary" />
                )}
              </div>
              <p className="text-lg mb-2">Calling...</p>
              <p className="text-sm text-muted-foreground mb-4">
                Waiting for answer
              </p>
              <Button onClick={endCall} variant="destructive">
                <PhoneOff className="w-4 h-4 mr-2" />
                Cancel Call
              </Button>
            </div>
          ) : call.isReceivingCall && !callAccepted ? (
            <div className="text-center py-8">
              <div className="animate-pulse mb-4">
                {call.isVideo ? (
                  <Video className="w-12 h-12 mx-auto text-primary" />
                ) : (
                  <Phone className="w-12 h-12 mx-auto text-primary" />
                )}
              </div>
              <p className="text-lg mb-2">Incoming {call.isVideo ? 'Video' : 'Voice'} Call</p>
              <div className="flex gap-4 justify-center mt-6">
                <Button 
                  onClick={answerCall} 
                  variant="default" 
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Answer
                </Button>
                <Button onClick={endCall} variant="destructive">
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className={`grid ${isVideo ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {/* My Video/Audio */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {isVideo ? (
                    <video
                      playsInline
                      muted
                      ref={myVideo}
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Mic className="w-8 h-8 mx-auto mb-2" />
                        <span>You</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">
                      You {!isAudioEnabled && '(Muted)'}
                    </span>
                    <div className="flex gap-2">
                      {isVideo && (
                        <Button 
                          onClick={toggleVideo} 
                          variant="outline" 
                          size="sm"
                          className="bg-black/50 hover:bg-black/70"
                        >
                          {isVideoEnabled ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <VideoOff className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button 
                        onClick={toggleAudio} 
                        variant="outline"
                        size="sm"
                        className="bg-black/50 hover:bg-black/70"
                      >
                        {isAudioEnabled ? (
                          <Mic className="w-4 h-4" />
                        ) : (
                          <MicOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Remote Video/Audio */}
                {callAccepted && !callEnded && (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {isVideo ? (
                      <video
                        playsInline
                        ref={userVideo}
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Mic className="w-8 h-8 mx-auto mb-2" />
                          <span>Remote User</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">
                        Remote User
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Controls */}
              <div className="flex justify-center gap-4 mt-6">
                <Button onClick={endCall} variant="destructive" size="lg">
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}; 