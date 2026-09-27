import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { mobileApi } from '../../src/lib/api';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function CallsScreen() {
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileApi
      .get('/calls/history')
      .then((res: any) => setCalls(res.data))
      .catch((err: any) => console.error('Failed to load call history:', err))
      .finally(() => setLoading(false));
  }, []);

  const renderCallItem = ({ item }: { item: any }) => {
    const isOutgoing = item.callerId === user?.id;
    const otherUser = isOutgoing ? item.recipient : item.caller;
    const isMissed = item.status === 'MISSED' || item.status === 'REJECTED';

    return (
      <View style={styles.callCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{otherUser?.username?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>

        <View style={styles.callDetails}>
          <View style={styles.callHeader}>
            <Text style={styles.username}>@{otherUser?.username || 'User'}</Text>
            {isOutgoing ? (
              <PhoneOutgoing color="#2AABEE" size={16} />
            ) : isMissed ? (
              <PhoneMissed color="#ff5252" size={16} />
            ) : (
              <PhoneIncoming color="#4caf50" size={16} />
            )}
          </View>

          <Text style={styles.callSubtext}>
            {new Date(item.createdAt).toLocaleDateString()}{' '}
            {item.duration ? `• ${Math.floor(item.duration / 60)}m ${item.duration % 60}s` : `• ${item.status}`}
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
      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        renderItem={renderCallItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No call history found</Text>
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
  callCard: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#17212B',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2AABEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  callDetails: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  callSubtext: {
    color: '#8e9ca8',
    fontSize: 12,
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
