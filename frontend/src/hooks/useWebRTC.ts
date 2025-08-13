import { useCallback, useRef } from 'react';
import { useSocketContext } from '../context/WebSocketContext';

interface UseWebRTCProps {
  room: string;
  username: string;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export const useWebRTC = ({
  room,
  username,
  localVideoRef,
  remoteVideoRef,
}: UseWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useSocketContext();

  const localStreamRef = useRef<MediaStream | null>(null);

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
        localVideoRef.current.srcObject = stream;
      }

      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          console.log('Adding track: ', track.kind);
          peerConnectionRef.current?.addTrack(track, stream);
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

  // Cleanup
  const cleanup = () => {
    // stop webcam / audio
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    // close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
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
  };
};
