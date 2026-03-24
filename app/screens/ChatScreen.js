import { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { deferAfterInteractions } from '../utils/deferAfterInteractions';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from '../utils/safeArea';
import { createThemedStyles } from '../theme/styles';
import { themes } from '../theme/colors';

const colors = themes.darkNeon;
const styles = createThemedStyles(colors);

const SUGGESTION_CHIPS = [
  'How many people are playing Baldur\'s Gate 3 right now?',
  'Who\'s streaming Elden Ring on Twitch?',
  'What\'s the Steam rating for Helldivers 2?',
];

const PLACEHOLDER_REPLY = 'Placeholder reply — backend not connected yet.';

function nextId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const localStyles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  headerTagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  messageArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    paddingTop: 24,
  },
  welcomeLine: {
    marginBottom: 20,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  chipWrap: {
    marginBottom: 4,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.text,
  },
  bubbleTextUser: {
    color: colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const MessageBubble = memo(function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[localStyles.messageRow, isUser && localStyles.messageRowUser]}>
      <View
        style={[
          localStyles.bubble,
          isUser ? localStyles.bubbleUser : localStyles.bubbleAssistant,
        ]}
      >
        <Text
          style={[
            localStyles.bubbleText,
            isUser && localStyles.bubbleTextUser,
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
});

const INPUT_BOTTOM_PADDING = 24;
const CHAT_INITIAL_NUM_TO_RENDER = 12;
const CHAT_MAX_TO_RENDER_PER_BATCH = 10;
const CHAT_WINDOW_SIZE = 11;

export default function ChatScreen({ route }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const gameName = route.params?.gameName;
    if (gameName) {
      const { cancel } = deferAfterInteractions(() => {
        setInputText(`How many people are playing ${gameName} right now?`);
      }, 'ChatScreen.prefill');
      return () => cancel();
    }
  }, [route.params?.gameName]);

  useEffect(() => {
    if (messages.length > 0) {
      const { cancel } = deferAfterInteractions(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 'ChatScreen.scrollToEnd');
      return () => cancel();
    }
  }, [messages.length]);

  const handleSend = useCallback((text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const userMsg = { id: nextId(), role: 'user', content: trimmed };
    const assistantMsg = {
      id: nextId(),
      role: 'assistant',
      content: PLACEHOLDER_REPLY,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  }, []);

  const onSendPress = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    handleSend(trimmed);
    setInputText('');
  }, [inputText, handleSend]);

  const onImagePress = useCallback(() => {
    setInputText('Generate an image of ');
    inputRef.current?.focus();
  }, []);

  const keyExtractor = useCallback((item) => item.id, []);
  const renderItem = useCallback(({ item }) => <MessageBubble message={item} />, []);
  const listEmptyComponent = useCallback(
    () => (
      <View style={localStyles.emptyState}>
        <Text style={[styles.textSecondary, localStyles.welcomeLine]}>
          Ask about any game — player counts, streams, ratings
        </Text>
        <View style={localStyles.chipRow}>
          {SUGGESTION_CHIPS.map((label) => (
            <View key={label} style={localStyles.chipWrap}>
              <Pressable
                style={styles.chip}
                onPress={() => handleSend(label)}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Text style={styles.chipText}>{label}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    ),
    [handleSend]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, styles.screenTransparent, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={localStyles.header}>
        <Text style={localStyles.headerTitle}>Peakked</Text>
        <Text style={localStyles.headerTagline}>Ask about player counts, streams, and ratings</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={listEmptyComponent}
        style={localStyles.messageArea}
        contentContainerStyle={localStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={CHAT_INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={CHAT_MAX_TO_RENDER_PER_BATCH}
        windowSize={CHAT_WINDOW_SIZE}
      />

      <View
        style={[
          localStyles.inputRow,
          { paddingBottom: 12 + INPUT_BOTTOM_PADDING + insets.bottom },
        ]}
      >
        <Pressable
          style={localStyles.imageButton}
          onPress={onImagePress}
          accessibilityLabel="Insert image prompt"
          accessibilityRole="button"
        >
          <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
        </Pressable>
        <TextInput
          ref={inputRef}
          style={[styles.input, localStyles.input]}
          placeholder="Ask about player counts, streams, ratings…"
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable
          onSubmitEditing={onSendPress}
        />
        <Pressable
          style={localStyles.sendButton}
          onPress={onSendPress}
          accessibilityLabel="Send"
        >
          <Text style={localStyles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
