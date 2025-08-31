import React, { useCallback, useRef } from 'react';
import { useSocketContext } from '../context/WebSocketContext';

interface UseWebRTCProps {
  room: string;
  username: string;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  setIsCamOff: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useWebRTC = ({
  room,
  username,
  localVideoRef,
  remoteVideoRef,
  setIsCamOff,
}: UseWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useSocketContext();

  const localStreamRef = useRef<MediaStream | null>(null);
  const videoSenderRef = useRef<RTCRtpSender | null>(undefined);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    console.log('Inside initializePeerConnection ...............');
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);
    console.log('New peer connection created ...............');

    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream: ', event);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'ice-candidate',
            payload: {
              candidate: event.candidate,
              roomId: room,
            },
          })
        );
      }
    };
  }, [remoteVideoRef]);

  const getUserMedia = useCallback(async () => {
    console.log('Inside getUserMedia ...............');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      localStreamRef.current = stream;

      // Display on local video element
      if (localVideoRef.current) {
        // Show only video locally
        const videoOnlyStream = new MediaStream([stream.getVideoTracks()[0]]);
        localVideoRef.current.srcObject = videoOnlyStream;
      }

      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          console.log('Adding track: ', track.kind);
          const sender = peerConnectionRef.current?.addTrack(track, stream);

          if (sender?.track?.kind == 'video') {
            videoSenderRef.current = sender;
          }
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [localVideoRef]);

  const createOffer = async () => {
    console.log('Inside create offer ...............');
    if (!peerConnectionRef) return;

    try {
      console.log('creating offer');

      const offer = await peerConnectionRef.current?.createOffer();
      console.log('Offer created: ', offer);

      await peerConnectionRef.current?.setLocalDescription(offer);
      console.log('Saved offer: ', peerConnectionRef.current);

      socketRef.current?.send(
        JSON.stringify({
          type: 'offer',
          payload: {
            offer,
            roomId: room,
          },
        })
      );
      console.log('Offer sent to ws');
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    console.log('Inside handle offer ...............');
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(offer);
      console.log('Saved received offer: ', peerConnectionRef.current);

      const answer = await peerConnectionRef.current.createAnswer();
      console.log('Answer created: ', answer);

      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('Saved answer: ', peerConnectionRef.current);

      socketRef.current?.send(
        JSON.stringify({
          type: 'answer',
          payload: {
            answer,
            roomId: room,
          },
        })
      );
      console.log('Answer sent to ws');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    console.log('Inside handlwAnswer ...............');

    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
      console.log('Set received answer to remote');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  // when other user leave the room, stop remote peer video.
  const stopRemoteStream = async () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const startWebCam = async () => {
    // Get a new stream from the camera
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    const newVideoTrack = newStream.getVideoTracks()[0];

    // Add the new track to the local stream ref
    localStreamRef.current?.addTrack(newVideoTrack);

    // Update the local video element with the new stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = newStream;
    }
    videoSenderRef.current?.replaceTrack(newVideoTrack);
    setIsCamOff(false);
  };

  const stopWebCam = async (videoTrack: MediaStreamTrack) => {
    // Find the video sender
    const sender = peerConnectionRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === 'video');

    // Stop the track to release the camera and turn off the LED
    videoTrack.stop();
    // Explicitly remove the track from the local stream ref
    localStreamRef.current?.removeTrack(videoTrack);
    if (localVideoRef.current) {
      // localVideoRef.current.srcObject = null;
    }
    // Inform the peer connection to stop sending this track
    if (sender) {
      await sender.replaceTrack(null);
    }
    setIsCamOff(true);
  };

  const toggleVideo = async () => {
    //Find the current active video track
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()
      .find((track) => track.kind === 'video' && track.readyState === 'live');

    if (videoTrack) {
      stopWebCam(videoTrack);
    } else {
      startWebCam();
    }
  };

  // Cleanup
  const cleanup = () => {
    // stop webcam / audio
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (track.readyState == 'live') {
          track.stop();
        }
      });
    }
    // close peer connection
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (error) {}
      peerConnectionRef.current = null;
    }
  };

  return {
    initializePeerConnection,
    getUserMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
    stopRemoteStream,
    toggleVideo,
  };
};
