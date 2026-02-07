import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/lib/cart-context';

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'driver';
  timestamp: string;
}

const QUICK_REPLIES = [
  'Out of stock - OK to substitute?',
  'On my way!',
  'Almost there!',
];

const INITIAL_MESSAGES: Message[] = [
  { id: '1', text: 'Hi! I have your order and heading to you now.', sender: 'driver', timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: '2', text: 'Great, thanks!', sender: 'customer', timestamp: new Date(Date.now() - 60000).toISOString() },
];

function ChatBubble({ message }: { message: Message }) {
  const c = Colors.dark;
  const isCustomer = message.sender === 'customer';
  const time = new Date(message.timestamp);
  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={[styles.bubbleRow, isCustomer ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      <View style={[styles.bubble, { backgroundColor: isCustomer ? c.accent : c.surface }]}>
        <Text style={[styles.bubbleText, { color: isCustomer ? '#000' : c.text, fontFamily: 'DMSans_400Regular' }]}>
          {message.text}
        </Text>
        <Text style={[styles.bubbleTime, { color: isCustomer ? 'rgba(0,0,0,0.5)' : c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
          {timeStr}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { orders } = useCart();

  const order = orders.find(o => o.id === orderId);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      sender: 'customer',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [newMsg, ...prev]);
    setInputText('');
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
            {order?.driverName ?? 'Driver'}
          </Text>
          <Text style={[styles.headerSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            Order #{orderId?.slice(0, 8)}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        inverted
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

      <View style={styles.quickReplies}>
        {QUICK_REPLIES.map((reply) => (
          <Pressable
            key={reply}
            onPress={() => sendMessage(reply)}
            style={({ pressed }) => [styles.quickReply, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.quickReplyText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]} numberOfLines={1}>
              {reply}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.inputBar, { backgroundColor: c.surface, paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={[styles.input, { color: c.text, backgroundColor: c.background, fontFamily: 'DMSans_400Regular' }]}
          placeholder="Type a message..."
          placeholderTextColor={c.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => sendMessage(inputText)}
          returnKeyType="send"
        />
        <Pressable
          onPress={() => sendMessage(inputText)}
          style={({ pressed }) => [styles.sendBtn, { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="send" size={18} color="#000" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 12,
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16 },
  headerSub: { fontSize: 12, marginTop: 1 },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  bubbleRow: { marginVertical: 2 },
  bubbleRowLeft: { alignItems: 'flex-start' },
  bubbleRowRight: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  quickReplies: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickReply: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexShrink: 1,
  },
  quickReplyText: { fontSize: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
