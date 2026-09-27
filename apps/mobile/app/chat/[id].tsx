import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mobileApi } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useChatStore } from '../../src/store/useChatStore';
import { Send, Phone, Video } from 'lucide-react-native';
import { MessageDto } from '@nexchat/shared';

export default function MobileChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage } = useChatStore();

  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);

  const chatMessages = messages[id || ''] || [];

  useEffect(() => {
    if (!id) return;
    mobileApi
      .get(`/chats/${id}/messages`)
      .then((res: any) => setMessages(id, res.data))
      .catch((err: any) => console.error('Failed to load chat messages:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSend = async () => {
    if (!inputContent.trim() || !id) return;
    const content = inputContent.trim();
    setInputContent('');

    const tempMsg: any = {
      id: `temp-${Date.now()}`,
      chatId: id,
      senderId: user?.id || '',
      sender: { id: user?.id, username: user?.username || 'Me' },
      content,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
    };

    addMessage(id, tempMsg);

    try {
      // In a full mobile deployment, Socket.IO emits message:send
    } catch (err: any) {
      console.error('Failed to send message:', err);
    }
  };

  const renderMessageBubble = ({ item }: { item: MessageDto }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View style={[styles.bubbleContainer, isMe ? styles.myBubbleContainer : styles.otherBubbleContainer]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          {!isMe && <Text style={styles.senderName}>@{item.sender?.username}</Text>}
          <Text style={styles.messageContent}>{item.content}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
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
      {/* Messages List */}
      <FlatList
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageBubble}
        contentContainerStyle={styles.listContent}
      />

      {/* Message Composer Footer */}
      <View style={styles.composer}>
        <TextInput
          value={inputContent}
          onChangeText={setInputContent}
          placeholder="Message..."
          placeholderTextColor="#6c7883"
          style={styles.composerInput}
          multiline
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Send color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>
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
  listContent: {
    padding: 12,
  },
  bubbleContainer: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  myBubbleContainer: {
    justifyContent: 'flex-end',
  },
  otherBubbleContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#2AABEE',
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#182533',
    borderBottomLeftRadius: 2,
  },
  senderName: {
    color: '#2AABEE',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  messageContent: {
    color: '#ffffff',
    fontSize: 15,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#17212B',
    borderTopWidth: 1,
    borderTopColor: '#2b394a',
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#0e1621',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2AABEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
