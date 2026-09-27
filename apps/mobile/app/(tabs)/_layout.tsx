import React from 'react';
import { Tabs } from 'expo-router';
import { MessageCircle, Phone, Settings } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#17212B' },
        headerTintColor: '#ffffff',
        tabBarStyle: { backgroundColor: '#17212B', borderTopColor: '#2b394a' },
        tabBarActiveTintColor: '#2AABEE',
        tabBarInactiveTintColor: '#6c7883',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, size }) => <Phone color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
