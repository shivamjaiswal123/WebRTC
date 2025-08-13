import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/WebSocketContext';

interface WSProps {
  onNewUser: () => void;
  onOffer: (offer: RTCSessionDescriptionInit) => void;
  onAnswer: (answer: RTCSessionDescriptionInit) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
}

export const useSocket = () => {
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
        //   case 'user-left':
        //     navigate('/');
        //     break;
        //   case 'offer':
        //     onOffer(message.payload.offer);
        //     break;

        //   case 'answer':
        //     onAnswer(message.payload.offer);
        //     break;

        //   case 'ice-candidate':
        //     onIceCandidate(message.candidate);
        //     break;

        //   case 'new-user':
        //     onNewUser();
        //     break;
      }
    };
  };

  const registerHandlers = useCallback(
    ({ onNewUser, onOffer, onAnswer, onIceCandidate }: WSProps) => {
      if (!socketRef.current) return;

      const prevOnMessage = socketRef.current.onmessage;

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received data:', data);

        prevOnMessage?.call(socketRef.current!, event);

        switch (data.type) {
          case 'offer':
            console.log('calling on offer.....');

            onOffer(data.payload.offer);
            break;

          case 'answer':
            onAnswer(data.payload.answer);
            break;

          case 'ice-candidate':
            onIceCandidate(data.payload.candidate);
            break;

          case 'new-user':
            setTimeout(() => {
              onNewUser();
            }, 3000);
            break;
        }
      };
    },
    []
  );

  const leaveRoom = (roomId: string) => {
    if (socketRef.current && socketRef.current.readyState == WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'leave-room',
          payload: {
            roomId,
          },
        })
      );
      socketRef.current.close();
    }
  };

  return { initializeWebSocket, registerHandlers, leaveRoom };
};
