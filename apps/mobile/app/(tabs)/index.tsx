import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { mobileApi } from '../../src/lib/api';
import { useChatStore } from '../../src/store/useChatStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { ChatDto } from '@nexchat/shared';

export default function ChatsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { chats, setChats, setActiveChatId } = useChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    mobileApi
      .get('/chats')
      .then((res: any) => setChats(res.data))
      .catch((err: any) => console.error('Failed to load mobile chats:', err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleOpenChat = (chatId: string) => {
    setActiveChatId(chatId);
    router.push(`/chat/${chatId}`);
  };

  const renderChatItem = ({ item }: { item: ChatDto }) => {
    const isDirect = item.type === 'DIRECT';
    const recipient = item.recipient;
    const title = isDirect ? recipient?.username || 'User' : item.name || 'Group Chat';
    const initial = title.charAt(0).toUpperCase();

    return (
      <TouchableOpacity onPress={() => handleOpenChat(item.id)} style={styles.chatCard}>
        <View style={styles.avatar}>
          {recipient?.avatarUrl ? (
            <Image source={{ uri: recipient.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
          {recipient?.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.chatTime}>
              {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2AABEE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e1621',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0e1621',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCard: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#17212B',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2AABEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#0e1621',
  },
  chatDetails: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  chatTime: {
    color: '#6c7883',
    fontSize: 12,
  },
  lastMessage: {
    color: '#8e9ca8',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6c7883',
    fontSize: 14,
  },
});
