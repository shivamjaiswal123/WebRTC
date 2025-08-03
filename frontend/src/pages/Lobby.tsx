import { useState } from 'react';

function Lobby() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(randomId);
  };

  return (
    <div className="min-h-screen bg-gray-800/95 from-blue-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center my-6">
          <p className="text-white text-2xl font-medium">
            Join or create a video room
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <form className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-200 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Room ID Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Room ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID or generate one"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400"
                  required
                />
              </div>
              <button
                type="button"
                onClick={generateRoomId}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 cursor-pointer"
              >
                Generate random room ID
              </button>
            </div>

            {/* Join Button */}
            <button
              type="submit"
              disabled={!username.trim() || !roomId.trim()}
              className="w-full bg-blue-600 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {/* {isJoining ? ( */}
              {/* <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining...</span>
                </> */}
              {/* ) : ( */}
              <>
                <span>Join Room</span>
              </>
              {/* )} */}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
