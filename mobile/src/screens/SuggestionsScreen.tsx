import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { proposalsAPI } from '@/services/api';
import { Suggestion } from '@/types';
import { COLORS, SPACING } from '@/constants';

const CATEGORIES = ['All', 'Dining', 'Entertainment', 'Outdoors', 'Arts', 'Nightlife', 'Relaxation'];

export default function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAvailable, setLocationAvailable] = useState<boolean | null>(null);

  const fetchSuggestions = async (cat: string, lat?: number, lng?: number) => {
    setLoading(true);
    try {
      const res = await proposalsAPI.suggestions(
        lat,
        lng,
        cat && cat !== 'All' ? cat.toLowerCase() : undefined,
      );
      setSuggestions(res.data.suggestions || []);
    } catch {
      Alert.alert('Error', 'Could not load suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggestions immediately (no location) on category change
  useEffect(() => {
    fetchSuggestions(category, coords?.lat, coords?.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Request location on mount; re-fetch suggestions once we have it
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationAvailable(false);
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude: lat, longitude: lng } = position.coords;
        setCoords({ lat, lng });
        setLocationAvailable(true);
        // Re-fetch with actual location
        fetchSuggestions(category, lat, lng);
      } catch {
        setLocationAvailable(false);
      }
    })();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = suggestions.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <TextInput style={styles.search} placeholder="Search activities..."
          value={search} onChangeText={setSearch} placeholderTextColor={COLORS.textSecondary} />

        {/* Location status indicator */}
        {locationAvailable === true && (
          <View style={styles.locationBanner}>
            <Text style={styles.locationText}>📍 Using your location</Text>
          </View>
        )}
        {locationAvailable === false && (
          <View style={[styles.locationBanner, styles.locationBannerUnavailable]}>
            <Text style={styles.locationTextUnavailable}>
              Location unavailable — showing general suggestions
            </Text>
          </View>
        )}
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catBtn, category === item && styles.catBtnActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.catText, category === item && styles.catTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No activities found</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardCategory}>{item.category}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{item.estimatedDuration}</Text>
                <Text style={styles.cardCost}>{item.estimatedCost}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.md, paddingTop: SPACING.lg },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  search: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING.md, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.surface },
  locationBanner: { marginTop: SPACING.xs, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 8, backgroundColor: '#e8f5e9', alignSelf: 'flex-start' },
  locationBannerUnavailable: { backgroundColor: '#fff3e0' },
  locationText: { fontSize: 12, color: '#2e7d32', fontWeight: '500' },
  locationTextUnavailable: { fontSize: 12, color: '#e65100', fontWeight: '500' },
  categoryList: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, flexGrow: 0 },
  catBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  catBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 14, color: COLORS.text },
  catTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { padding: SPACING.sm },
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, margin: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  cardCategory: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { fontSize: 12, color: COLORS.textSecondary },
  cardCost: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  empty: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
