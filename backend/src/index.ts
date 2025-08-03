import { WebSocket, WebSocketServer } from 'ws';

const rooms = new Map<string, Set<WebSocket>>();

const wss = new WebSocketServer({ port: 8080 });

console.log('WS started on port 8080');

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected...');

  ws.on('error', (error) => console.error('Something went wrong!: ', error));

  ws.on('message', (data) => {
    const parsedData = JSON.parse(data.toString());

    if (parsedData.type == 'join') {
      if (!rooms.has(parsedData.payload.roomId)) {
        // create a entry in map with key as roomId and value with empty set
        rooms.set(parsedData.payload.roomId, new Set());
      }

      const roomSize = rooms.get(parsedData.payload.roomId)?.size;
      if (roomSize == 2) {
        ws.close();
        return;
      }

      rooms.get(parsedData.payload.roomId)?.add(ws);

      // inform already existing user that new user joined
      const userSockets = rooms.get(parsedData.payload.roomId);
      userSockets?.forEach((userSocket) => {
        if (userSocket !== ws && userSocket.readyState == WebSocket.OPEN) {
          userSocket.send(
            JSON.stringify({
              type: 'new-user',
              payload: {
                username: parsedData.payload.username,
              },
            })
          );
        }
      });

      ws.send(
        JSON.stringify({
          type: 'room-joined',
          payload: {
            roomId: parsedData.payload.roomId,
          },
        })
      );
    } else if (parsedData.type == 'offer') {
      console.log(parsedData.payload);
    }
  });
});
