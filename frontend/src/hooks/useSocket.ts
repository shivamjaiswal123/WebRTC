import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type FormProps = {
  username?: string;
  roomId?: string;
};

export const useSocket = ({ username, roomId }: FormProps = {}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  const connectToWS = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket('ws://localhost:8080');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'join',
          payload: {
            username,
            roomId,
          },
        })
      );
    };

    ws.onmessage = (data) => {
      const parsedData = JSON.parse(data.data);

      if (parsedData.type == 'room-joined') {
        navigate(`/room/${parsedData.payload.roomId}`);
      }
    };
  };

  return { wsRef, connectToWS };
};
