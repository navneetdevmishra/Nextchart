import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { mobileApi } from '../../src/lib/api';
import { Shield, Lock, LogOut, KeyRound } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showLastSeen, setShowLastSeen] = useState(user?.profile?.showLastSeen ?? true);
  const [showReadReceipts, setShowReadReceipts] = useState(user?.profile?.showReadReceipts ?? true);

  const handleTogglePrivacy = async (field: 'showLastSeen' | 'showReadReceipts', value: boolean) => {
    try {
      if (field === 'showLastSeen') setShowLastSeen(value);
      if (field === 'showReadReceipts') setShowReadReceipts(value);
      await mobileApi.put('/privacy/settings', { [field]: value });
    } catch (err: any) {
      console.error('Failed to update privacy settings:', err);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of NexChat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.username}>@{user?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Privacy Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Last Seen & Online Status</Text>
            <Text style={styles.rowSubtext}>Show active status to contacts</Text>
          </View>
          <Switch
            value={showLastSeen}
            onValueChange={(val) => handleTogglePrivacy('showLastSeen', val)}
            thumbColor={showLastSeen ? '#2AABEE' : '#6c7883'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Read Receipts</Text>
            <Text style={styles.rowSubtext}>Send read status acknowledgements</Text>
          </View>
          <Switch
            value={showReadReceipts}
            onValueChange={(val) => handleTogglePrivacy('showReadReceipts', val)}
            thumbColor={showReadReceipts ? '#2AABEE' : '#6c7883'}
          />
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut color="#ff5252" size={20} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e1621',
  },
  profileCard: {
    backgroundColor: '#17212B',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2b394a',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2AABEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  username: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    color: '#6c7883',
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#17212B',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2b394a',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#2AABEE',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#2b394a',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtext: {
    color: '#6c7883',
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  logoutText: {
    color: '#ff5252',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
