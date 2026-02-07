import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { MenuItem } from '@/lib/data';

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function MenuItemCard({ item, quantity, onAdd, onRemove }: Props) {
  const c = Colors.dark;

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd();
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove();
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
            {item.isAlcohol && (
              <View style={[styles.alcoholBadge, { backgroundColor: c.accentLight }]}>
                <Text style={[styles.alcoholText, { color: c.accent }]}>21+</Text>
              </View>
            )}
          </View>
          <Text style={[styles.description, { color: c.textSecondary }]} numberOfLines={2}>{item.description}</Text>
          {item.dietaryTags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.dietaryTags.slice(0, 3).map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: c.surfaceElevated }]}>
                  <Text style={[styles.tagText, { color: c.textTertiary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.price, { color: c.text }]}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.rightSection}>
          <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
          <View style={styles.quantityRow}>
            {quantity > 0 ? (
              <View style={[styles.quantityControl, { backgroundColor: c.accent }]}>
                <Pressable onPress={handleRemove} hitSlop={8}>
                  <Feather name="minus" size={16} color="#000" />
                </Pressable>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Pressable onPress={handleAdd} hitSlop={8}>
                  <Feather name="plus" size={16} color="#000" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.addButton,
                  { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="plus" size={18} color="#000" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  content: {
    flexDirection: 'row',
  },
  textContent: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    flexShrink: 1,
  },
  alcoholBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alcoholText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'center',
    gap: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  quantityRow: {
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 10,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#000',
    minWidth: 16,
    textAlign: 'center' as const,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
