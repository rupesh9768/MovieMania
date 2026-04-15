import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMyChat, sendChatMessage, deleteChatMessage } from '../api/chatService';

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

const ChatPopup = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch chat on open
  const fetchChat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyChat();
      if (res.success) {
        setMessages(res.chat.messages || []);
        setUnread(0);
      }
    } catch (err) {
      console.error('Failed to fetch chat:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchChat();
    }
  }, [isOpen, fetchChat]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      setMessages(prev => [...prev, data.message]);
      if (!isOpen) {
        setUnread(prev => prev + 1);
      }
    };

    const handleRead = () => {
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
    };

    const handleTyping = () => setIsTyping(true);
    const handleStopTyping = () => setIsTyping(false);

    const handleDelete = (data) => {
      setMessages(prev => prev.filter(m => m._id !== data.messageId));
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:read', handleRead);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stopTyping', handleStopTyping);
    socket.on('chat:delete', handleDelete);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:read', handleRead);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stopTyping', handleStopTyping);
      socket.off('chat:delete', handleDelete);
    };
  }, [socket, isOpen]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msgText = text.trim();
    setText('');

    try {
      const res = await sendChatMessage(msgText);
      if (res.success) {
        setMessages(prev => [...prev, res.message]);
      }
    } catch (err) {
      console.error('Failed to send:', err);
    }

    if (socket) {
      socket.emit('chat:stopTyping', {});
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
    if (socket) {
      socket.emit('chat:typing', {});
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:stopTyping', {});
      }, 2000);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setUnread(0);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await deleteChatMessage(messageId);
      if (res.success) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Don't show for admins (they use the admin chat page)
  if (!isAuthenticated || isAdmin) return null;

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#E50914] hover:bg-[#c40812] text-white rounded-full shadow-2xl shadow-red-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-cyan-500 text-black text-[11px] font-bold rounded-full px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="px-4 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E50914] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">MovieMania Support</h3>
              <p className="text-[11px] text-green-400">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-slate-500">Hello! How can we help you?</p>
                <p className="text-xs text-slate-600 mt-1">Send a message to start chatting</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = !['admin', 'super_admin'].includes(msg.sender?.role);
                return (
                  <div key={msg._id} className={`group flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {isMe && (
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity self-center mr-1.5 p-1 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                        title="Delete message"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-[#E50914] text-white rounded-br-md'
                        : 'bg-[#2a2a2a] text-slate-200 rounded-bl-md'
                    }`}>
                      {!isMe && (
                        <p className="text-[10px] font-semibold text-cyan-400 mb-0.5">{msg.sender?.name || 'Admin'}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className={`text-[10px] ${isMe ? 'text-red-200' : 'text-slate-500'}`}>
                          {timeAgo(msg.createdAt)}
                        </span>
                        {isMe && msg.read && (
                          <svg className="w-3 h-3 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#2a2a2a] px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#2a2a2a] bg-[#1a1a1a]">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 bg-[#2a2a2a] text-white text-sm rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#E50914] placeholder-slate-500 max-h-24"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="bg-[#E50914] hover:bg-[#c40812] disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPopup;
