import { useRef } from 'react';
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

  // Initialize peer connection
  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

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
            candidate: event.candidate,
            roomId: room,
          })
        );
      }
    };
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Display on local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }

      //   return stream;
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const createOffer = async () => {
    if (!peerConnectionRef) return;

    try {
      const offer = await peerConnectionRef.current?.createOffer();
      await peerConnectionRef.current?.setLocalDescription(offer);
      socketRef.current?.send(
        JSON.stringify({
          type: 'offer',
          payload: {
            offer,
            roomId: room,
          },
        })
      );
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (
    offer: RTCSessionDescriptionInit
    // remoteUsername: string
  ) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socketRef.current?.send(
        JSON.stringify({
          type: 'answer',
          payload: {
            answer,
            roomId: room,
          },
        })
      );
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
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

  return {
    initializePeerConnection,
    getUserMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  };
};
