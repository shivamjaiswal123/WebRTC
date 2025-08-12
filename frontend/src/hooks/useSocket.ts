import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/WebSocketContext';

interface WSProps {
  onNewUser: () => void;
  onOffer: (offer: RTCSessionDescriptionInit) => void;
  onAnswer: (answer: RTCLocalSessionDescriptionInit) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
}

export const useSocket = ({
  onNewUser,
  onOffer,
  onAnswer,
  onIceCandidate,
}: WSProps) => {
  // const socketRef = useRef<WebSocket | null>(null);
  const socketRef = useSocketContext();
  const navigate = useNavigate();

  const initializeWebSocket = (username: string, roomId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket('ws://localhost:8080');
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join-room',
          payload: {
            username,
            roomId,
          },
        })
      );
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'room-joined':
          navigate(`/room/${message.payload.roomId}`, {
            state: {
              room: message.payload.roomId,
              username: message.payload.username,
            },
          });
          break;
        case 'user-left':
          navigate('/');
          break;
        case 'offer':
          onOffer(message.payload.offer);
          break;

        case 'answer':
          onAnswer(message.payload.offer);
          break;

        case 'ice-candidate':
          // onIceCandidate();
          break;

        case 'new-user':
          onNewUser();
          break;
      }
    };
  };

  return { initializeWebSocket };
};
