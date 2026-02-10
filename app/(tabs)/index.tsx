import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ScrollView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { RESTAURANTS, CUISINE_FILTERS, Restaurant } from '@/lib/data';
import { RestaurantCard } from '@/components/RestaurantCard';

export default function HomeScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const isWeb = Platform.OS === 'web';

  const featured = useMemo(() => RESTAURANTS.filter(r => r.featured), []);

  const filtered = useMemo(() => {
    let list = RESTAURANTS;
    if (selectedCuisine !== 'All') {
      list = list.filter(r => r.cuisine === selectedCuisine);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));
    }
    return list;
  }, [selectedCuisine, search]);

  const topPad = isWeb ? 67 : insets.top;

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View>
          <Text style={[styles.greeting, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>Deliver to</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={c.accent} />
            <Text style={[styles.location, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Miami Beach, FL</Text>
            <Feather name="chevron-down" size={16} color={c.textSecondary} />
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/sommelier')}
          style={({ pressed }) => [styles.sommelierButton, { backgroundColor: c.accentLight, opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="wine" size={20} color={c.accent} />
        </Pressable>
      </View>

      <View style={[styles.searchBar, { backgroundColor: c.surface }]}>
        <Feather name="search" size={18} color={c.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
          placeholder="Search restaurants, cuisines..."
          placeholderTextColor={c.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={c.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {CUISINE_FILTERS.map(cuisine => {
          const active = cuisine === selectedCuisine;
          return (
            <Pressable
              key={cuisine}
              onPress={() => setSelectedCuisine(cuisine)}
              style={[
                styles.filterChip,
                { backgroundColor: active ? c.accent : c.surface },
              ]}
            >
              <Text style={[
                styles.filterText,
                { color: active ? '#000' : c.textSecondary, fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular' },
              ]}>{cuisine}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.placeholderBanner}>
        <View style={styles.bannerIconRow}>
          <Ionicons name="information-circle" size={18} color={c.accent} />
          <Text style={[styles.bannerTitle, { color: c.accent, fontFamily: 'DMSans_600SemiBold' }]}>Preview Data</Text>
        </View>
        <Text style={[styles.bannerText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
          The restaurants and menus shown here are placeholder listings for demonstration purposes. Real merchants will manage their own menus once they sign up through the Merchant Portal.
        </Text>
      </View>

      {selectedCuisine === 'All' && search.length === 0 && (
        <View style={styles.featuredSection}>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Popular near you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featured.map(r => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                compact
                onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: r.id } })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_700Bold', marginTop: 8 }]}>
        {selectedCuisine === 'All' ? 'All restaurants' : selectedCuisine}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 84 : 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>No restaurants found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  greeting: { fontSize: 13, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 17 },
  sommelierButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  filtersRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
  },
  featuredSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  featuredScroll: {
    paddingHorizontal: 20,
  },
  list: {
    paddingBottom: 100,
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  placeholderBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.2)',
  },
  bannerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 13,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
