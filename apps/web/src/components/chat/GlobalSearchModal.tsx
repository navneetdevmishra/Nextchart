'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, User, MessageSquare, FileText, Users, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/useChatStore';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'USERS' | 'CHATS' | 'MESSAGES' | 'MEDIA'>('ALL');
  const [results, setResults] = useState<{ users: any[]; chats: any[]; messages: any[]; media: any[] }>({
    users: [],
    chats: [],
    messages: [],
    media: [],
  });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { setActiveChatId, chats, setChats } = useChatStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nexchat_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], chats: [], messages: [], media: [] });
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api
        .get(`/search/global?q=${encodeURIComponent(query)}&type=${filterType}`)
        .then((res: any) => setResults(res.data))
        .catch((err: any) => console.error('Search error:', err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filterType]);

  const saveRecentSearch = (term: string) => {
    const updated = Array.from(new Set([term, ...recentSearches])).slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('nexchat_recent_searches', JSON.stringify(updated));
  };

  const handleSelectUser = async (user: any) => {
    saveRecentSearch(user.username);
    try {
      const res = await api.post('/chats/direct', { recipientId: user.id });
      const newChat = res.data;
      if (!chats.find((c) => c.id === newChat.id)) {
        setChats([newChat, ...chats]);
      }
      setActiveChatId(newChat.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to open chat:', err);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    onClose();
  };

  const highlightMatch = (text: string, search: string) => {
    if (!search || !text) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-[#2AABEE]/30 text-[#2AABEE] px-0.5 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#17212B] border border-[#2b394a] rounded-2xl shadow-2xl flex flex-col max-h-[80vh] text-white overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#2b394a] flex items-center space-x-3">
          <Search className="w-5 h-5 text-[#2AABEE]" />
          <input
            type="text"
            autoFocus
            placeholder="Search messages, @users, public groups..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base focus:outline-none placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-white/10 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-[#2b394a] bg-[#0e1621]/40 px-4 text-xs font-semibold">
          {['ALL', 'USERS', 'CHATS', 'MESSAGES', 'MEDIA'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t as any)}
              className={`py-3 px-4 border-b-2 transition-all ${
                filterType === t
                  ? 'border-[#2AABEE] text-[#2AABEE] font-bold'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Searching...</div>
          ) : !query.trim() ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Searches</p>
              {recentSearches.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No recent searches</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 rounded-xl bg-[#0e1621] hover:bg-[#0e1621]/80 border border-[#2b394a] text-xs text-gray-300"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Users Results */}
              {results.users?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-[#2AABEE]" />
                    <span>Users</span>
                  </h4>
                  <div className="space-y-1">
                    {results.users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#0e1621]/60 hover:bg-[#0e1621] border border-[#2b394a]/50 cursor-pointer transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-[#2AABEE] flex items-center justify-center font-bold text-white">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">@{highlightMatch(u.username, query)}</div>
                            <div className="text-xs text-gray-400">{u.bio || 'NexChat user'}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Chats Results */}
              {results.chats?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-[#2AABEE]" />
                    <span>Public Groups & Channels</span>
                  </h4>
                  <div className="space-y-1">
                    {results.chats.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectChat(c.id)}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#0e1621]/60 hover:bg-[#0e1621] border border-[#2b394a]/50 cursor-pointer transition"
                      >
                        <div>
                          <div className="font-semibold text-sm">{highlightMatch(c.name || 'Group', query)}</div>
                          <div className="text-xs text-gray-400">{c.description || `${c._count?.members || 0} members`}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Results */}
              {results.messages?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#2AABEE]" />
                    <span>Messages</span>
                  </h4>
                  <div className="space-y-1">
                    {results.messages.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectChat(m.chatId)}
                        className="p-3 rounded-xl bg-[#0e1621]/60 hover:bg-[#0e1621] border border-[#2b394a]/50 cursor-pointer space-y-1 transition"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-semibold text-[#2AABEE]">@{m.sender?.username}</span>
                          <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-200 line-clamp-2">
                          {highlightMatch(m.content, query)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
