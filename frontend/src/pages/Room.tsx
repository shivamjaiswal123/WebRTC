import { useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useParams } from 'react-router-dom';

function Room() {
  const [copied, setCopied] = useState(false);
  const { roomId } = useParams();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const copyRoomId = async () => {
    try {
      if (roomId) {
        await navigator.clipboard.writeText(roomId);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room ID');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Room ID */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-300 font-medium">Room ID:</span>
          <span className="font-mono text-blue-400 text-lg underline underline-offset-1">
            {roomId}
          </span>
          <button
            onClick={copyRoomId}
            className="ml-2 p-1 hover:bg-gray-600 rounded transition-colors cursor-pointer"
            title="Copy room ID"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {/* local video */}
        <video
          ref={localVideoRef}
          className="w-xl h-80 rounded-md"
          autoPlay
          playsInline
        />
        {/* remote video */}
        <video ref={remoteVideoRef} className="w-xl rounded-md" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mt-12">
        {/* <button onClick={createOffer}>Create Offer</button> */}

        {/* Mute/Unmute */}
        {/* <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-3 rounded-full transition-colors ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button> */}

        {/* Video On/Off */}
        {/* <button
          onClick={createOffer}
          className={`p-3 rounded-full transition-colors ${
            isVideoOff
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isVideoOff ? 'Turn video on' : 'Turn video off'}
        >
          {isVideoOff ? (
            <Video className="w-6 h-6 text-white" />
          ) : (
            <VideoOff className="w-6 h-6 text-white" />
          )}
        </button> */}

        {/* Leave Room */}
        {/* <button
          //   onClick={onLeaveRoom}
          className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
          title="Leave room"
        >
          <Phone className="w-6 h-6 text-white rotate-[135deg]" />
        </button> */}
      </div>
    </div>
  );
}

export default Room;
