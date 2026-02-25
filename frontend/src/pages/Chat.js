import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { timeAgo } from '../utils';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;

export default function Chat() {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadRooms();
    loadUsers();
    // Socket connection
    socketRef.current = io(SOCKET_URL, { path: '/api/socket.io', transports: ['polling'] });
    socketRef.current.on('connect', () => {
      socketRef.current.emit('registerUser', user?.id);
    });
    socketRef.current.on('newMessage', (data) => {
      if (data.roomId === activeRoom?._id) {
        setMessages(prev => [...prev, data.message]);
      }
      loadRooms();
    });
    return () => { socketRef.current?.disconnect(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRooms = async () => {
    try {
      const res = await api.get('/chat/rooms');
      setRooms(res.data?.rooms || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/me/users');
      setUsers(res.data?.users || res.data || []);
    } catch (e) { console.error(e); }
  };

  const selectRoom = async (room) => {
    setActiveRoom(room);
    try {
      const res = await api.get(`/chat/rooms/${room._id}/messages`);
      setMessages(res.data?.messages || []);
      socketRef.current?.emit('joinChatRoom', room._id);
      await api.patch(`/chat/rooms/${room._id}/read`).catch(() => {});
    } catch (e) { console.error(e); }
  };

  const startDM = async (otherUserId) => {
    try {
      const res = await api.post('/chat/dm', { otherUserId });
      setShowNewChat(false);
      await loadRooms();
      selectRoom(res.data?.room);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;
    try {
      const res = await api.post('/chat/messages', { roomId: activeRoom._id, content: newMessage });
      setMessages(prev => [...prev, res.data?.message]);
      socketRef.current?.emit('sendChatMessage', { roomId: activeRoom._id, message: res.data?.message, userId: user?.id });
      setNewMessage('');
      loadRooms();
    } catch (e) { console.error(e); }
  };

  const getRoomName = (room) => {
    if (room.type === 'group') return room.name;
    const other = room.participants?.find(p => (p._id || p) !== user?.id);
    return other ? `${other.firstName} ${other.lastName}` : 'Chat';
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-7.5rem)]" data-testid="chat-page">
      <div className="flex h-full bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-secondary">Messages</h2>
              <button onClick={() => setShowNewChat(!showNewChat)} className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" data-testid="new-chat-btn">
                <i className="fa-solid fa-plus text-sm" />
              </button>
            </div>
          </div>

          {showNewChat && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-2">Start a conversation</p>
              <div className="space-y-1 max-h-40 overflow-auto">
                {users.filter(u => u._id !== user?.id).map(u => (
                  <button key={u._id} onClick={() => startDM(u._id)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white transition-colors" data-testid={`dm-user-${u._id}`}>
                    {u.firstName} {u.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" /></div>
            ) : rooms.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No conversations yet</p>
            ) : (
              rooms.map(room => (
                <button
                  key={room._id}
                  onClick={() => selectRoom(room)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activeRoom?._id === room._id ? 'bg-primary/5' : ''}`}
                  data-testid={`room-${room._id}`}
                >
                  <p className="text-sm font-medium text-secondary truncate">{getRoomName(room)}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{room.lastMessage?.content || 'No messages'}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!activeRoom ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <i className="fa-solid fa-comments text-4xl mb-3" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-14 px-5 border-b border-gray-100 flex items-center">
                <h3 className="font-semibold text-secondary">{getRoomName(activeRoom)}</h3>
              </div>
              <div className="flex-1 overflow-auto p-5 space-y-3">
                {messages.map((msg, idx) => {
                  const isMine = (msg.sender?._id || msg.sender) === user?.id;
                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-br-md' : 'bg-gray-100 text-secondary rounded-bl-md'}`} data-testid={`message-${idx}`}>
                        {!isMine && <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.sender?.firstName || ''}</p>}
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>{timeAgo(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-2">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" data-testid="chat-input" />
                <button type="submit" className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors" data-testid="chat-send">
                  <i className="fa-solid fa-paper-plane text-sm" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
