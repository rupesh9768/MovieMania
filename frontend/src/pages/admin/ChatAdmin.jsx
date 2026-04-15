import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAllChats, getChatByUser, adminSendMessage, adminDeleteChatMessage } from '../../api/chatService';
import { useSocket } from '../../context/SocketContext';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/avatars/') || !avatar.startsWith('/')) {
    return avatar.startsWith('/') ? avatar : `/avatars/${encodeURIComponent(avatar)}`;
  }
  return `${BACKEND_URL}${avatar}`;
};

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const ChatAdmin = () => {
  const { socket } = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    try {
      const res = await getAllChats();
      if (res.success) setChats(res.chats);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Load chat when user selected
  useEffect(() => {
    if (!selectedUserId) return;
    const loadChat = async () => {
      setMsgLoading(true);
      try {
        const res = await getChatByUser(selectedUserId);
        if (res.success) {
          setMessages(res.chat.messages || []);
          setSelectedUser(res.chat.user);
          // Clear unread for this chat in sidebar
          setChats(prev => prev.map(c =>
            c.user._id === selectedUserId ? { ...c, unreadByAdmin: 0 } : c
          ));
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setMsgLoading(false);
      }
    };
    loadChat();
  }, [selectedUserId]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      // Update sidebar
      setChats(prev => {
        const existing = prev.find(c => c.user._id === data.userId);
        if (existing) {
          return prev.map(c =>
            c.user._id === data.userId
              ? { ...c, lastMessage: data.message.text, lastMessageAt: data.message.createdAt, unreadByAdmin: selectedUserId === data.userId ? 0 : c.unreadByAdmin + 1 }
              : c
          ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        }
        // New chat from a user we haven't seen
        fetchChats();
        return prev;
      });

      // If this chat is currently open, add message
      if (data.userId === selectedUserId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleTyping = (data) => {
      setTypingUsers(prev => ({ ...prev, [data.userId]: data.name }));
    };

    const handleStopTyping = (data) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };

    const handleDelete = (data) => {
      if (data.userId === selectedUserId) {
        setMessages(prev => prev.filter(m => m._id !== data.messageId));
      }
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stopTyping', handleStopTyping);
    socket.on('chat:delete', handleDelete);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stopTyping', handleStopTyping);
      socket.off('chat:delete', handleDelete);
    };
  }, [socket, selectedUserId, fetchChats]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !selectedUserId) return;
    const msgText = text.trim();
    setText('');

    try {
      const res = await adminSendMessage(selectedUserId, msgText);
      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        setChats(prev =>
          prev.map(c =>
            c.user._id === selectedUserId
              ? { ...c, lastMessage: msgText, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to send:', err);
    }

    // Stop typing indicator
    if (socket) {
      socket.emit('chat:stopTyping', { to: selectedUserId });
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (socket && selectedUserId) {
      socket.emit('chat:typing', { to: selectedUserId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:stopTyping', { to: selectedUserId });
      }, 2000);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!selectedUserId) return;
    try {
      const res = await adminDeleteChatMessage(selectedUserId, messageId);
      if (res.success) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
      {/* Sidebar: Chat list */}
      <div className="w-80 border-r border-slate-800 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No conversations yet
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat._id}
                onClick={() => setSelectedUserId(chat.user._id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left hover:bg-slate-800/60 ${
                  selectedUserId === chat.user._id ? 'bg-slate-800 border-l-2 border-cyan-400' : 'border-l-2 border-transparent'
                }`}
              >
                {chat.user.avatar ? (
                  <img src={getAvatarUrl(chat.user.avatar)} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {chat.user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate">{chat.user.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(chat.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{chat.lastMessage || 'No messages'}</p>
                </div>
                {chat.unreadByAdmin > 0 && (
                  <span className="min-w-[20px] h-5 flex items-center justify-center bg-cyan-500 text-black text-[10px] font-bold rounded-full px-1 shrink-0">
                    {chat.unreadByAdmin}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selectedUserId ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-3">
              {selectedUser?.avatar ? (
                <img src={getAvatarUrl(selectedUser.avatar)} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-700" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                  {selectedUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedUser?.name}</h3>
                <p className="text-xs text-slate-500">{selectedUser?.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = ['admin', 'super_admin'].includes(msg.sender?.role);
                  return (
                    <div key={msg._id} className={`group flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      {!isAdmin && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity self-center mr-1.5 p-1 rounded-full hover:bg-red-500/20 text-slate-600 hover:text-red-400"
                          title="Delete message"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isAdmin
                          ? 'bg-cyan-600 text-white rounded-br-md'
                          : 'bg-slate-800 text-slate-200 rounded-bl-md'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin ? 'text-cyan-200' : 'text-slate-500'}`}>
                          {timeAgo(msg.createdAt)}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity self-center ml-1.5 p-1 rounded-full hover:bg-red-500/20 text-slate-600 hover:text-red-400"
                          title="Delete message"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {Object.keys(typingUsers).length > 0 && selectedUserId && typingUsers[selectedUserId] && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 px-4 py-2 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-slate-800">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-slate-800 text-white text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 max-h-28"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold p-3 rounded-xl transition-all shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatAdmin;
