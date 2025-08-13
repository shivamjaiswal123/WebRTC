import { WebSocket, WebSocketServer } from 'ws';

const rooms = new Map<string, Set<WebSocket>>();

const wss = new WebSocketServer({ port: 8080 });

console.log('WS started on port 8080');

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected...');

  ws.on('error', (error) => console.error('Something went wrong!: ', error));

  ws.on('message', (data) => {
    const parsedData = JSON.parse(data.toString());

    switch (parsedData.type) {
      case 'join-room':
        handleJoinRoom(ws, parsedData.payload);
        break;
      case 'leave-room':
        handleLeaveRoom(ws, parsedData.payload);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        handelSignalling(ws, parsedData);
        break;
    }
  });
});

function handleJoinRoom(ws: WebSocket, payload: any) {
  const { roomId, username } = payload;

  // Create new room if does not exist
  if (!rooms.has(roomId)) {
    // create a entry in map with key as roomId and value with empty set
    rooms.set(roomId, new Set());
  }

  const roomSize = rooms.get(roomId)?.size;
  if (roomSize == 2) {
    ws.send(
      JSON.stringify({
        type: 'room-full',
        payload: {
          message: 'Room is already taken...',
        },
      })
    );
    ws.close();
    return;
  }

  rooms.get(roomId)?.add(ws);

  // inform already existing user that new user joined
  const userSockets = rooms.get(roomId);
  userSockets?.forEach((userSocket) => {
    if (userSocket !== ws && userSocket.readyState == WebSocket.OPEN) {
      userSocket.send(
        JSON.stringify({
          type: 'new-user',
          payload: {
            roomId,
            username,
          },
        })
      );
    }
  });

  ws.send(
    JSON.stringify({
      type: 'room-joined',
      payload: {
        roomId,
        username,
      },
    })
  );
}

function handleLeaveRoom(ws: WebSocket, payload: any) {
  const { roomId } = payload;

  const room = rooms.get(roomId);

  if (!room) return; // room not found

  room.delete(ws);

  // delete room if its empty
  if (room.size == 0) {
    rooms.delete(roomId);
    return;
  }

  // single user left
  const [remainingUser] = room;
  remainingUser.send(
    JSON.stringify({
      type: 'user-left',
      payload: {
        roomId,
      },
    })
  );
}

function handelSignalling(ws: WebSocket, data: any) {
  const {
    payload: { roomId },
  } = data;

  if (!rooms.has(roomId)) return;

  const room = rooms.get(roomId);

  // forward signallinf data to other user
  if (room) {
    for (const socket of room) {
      if (socket !== ws) {
        socket.send(JSON.stringify(data));
        break;
      }
    }
  }
}
