/**
 * SuggestionsScreen / DiscoverScreen — 3j + 4e
 * HANDOFF_README spec: full redesign
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { OPTION_RADII, SHADOWS, SPACING, TYPE } from '@/constants';
import {
  DNButton,
  DNCard,
  DNChip,
  DNScreenHeader,
  DNSticker,
  DNText,
} from '@/components/ui';
import { proposalsAPI } from '@/services/api';
import type { RootStackParamList, Suggestion } from '@/types';

type RouteT = RouteProp<RootStackParamList, 'Suggestions'>;

const FILTERS = [
  'All', 'Dining', 'Outdoors', 'Live Music', 'Movies',
  'Wine & Drinks', 'Arts & Culture', 'Active', 'Comedy', 'Local Experience',
];

// ── Striped placeholder ────────────────────────────────────────────────────────
function StripedPlaceholder({ primarySoft }: { primarySoft: string }) {
  return (
    <View style={{ height: 150, backgroundColor: primarySoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 300,
              backgroundColor: 'rgba(14,140,140,0.12)',
              left: i * 28 - 20,
              top: -60,
              transform: [{ rotate: '35deg' }],
            }}
          />
        ))}
      </View>
      <Text style={[TYPE.secondary, { color: 'rgba(14,140,140,0.5)' }]}>Yelp photo</Text>
    </View>
  );
}

// ── Suggestion Card ─────────────────────────────────────────────────────────────
interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
  hasProposalContext: boolean;
  proposalName?: string;
  alreadyAdded: boolean;
  onAdd: (s: Suggestion) => void;
  colors: ReturnType<typeof import('@/constants').palette>;
}

function SuggestionCard({
  suggestion, index, hasProposalContext, proposalName, alreadyAdded, onAdd, colors,
}: SuggestionCardProps) {
  const radii = OPTION_RADII[index % 4];

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.topLeft,
          borderTopRightRadius: radii.topRight,
          borderBottomRightRadius: radii.bottomRight,
          borderBottomLeftRadius: radii.bottomLeft,
          marginBottom: SPACING.md,
          overflow: 'hidden',
        },
        SHADOWS.card,
      ]}
    >
      {/* Image slot */}
      <View style={{ borderTopLeftRadius: radii.topLeft, borderTopRightRadius: radii.topRight, overflow: 'hidden' }}>
        <StripedPlaceholder primarySoft={colors.primarySoft} />
        {suggestion.category && (
          <DNSticker
            label={suggestion.category}
            color={colors.primarySoft}
            textColor={colors.primary}
            style={{ position: 'absolute', top: 10, left: 10, transform: [{ rotate: '-4deg' }] }}
          />
        )}
        <DNSticker
          label="★ 4.5"
          color={colors.limeSoft}
          textColor={colors.lime}
          style={{ position: 'absolute', top: 10, right: 10, transform: [{ rotate: '4deg' }] }}
        />
      </View>

      {/* Body */}
      <View style={{ padding: SPACING.md }}>
        <DNText variant="heading" color={colors.ink}>{suggestion.name}</DNText>
        {suggestion.address && (
          <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 2 }}>
            {suggestion.address}
          </DNText>
        )}

        {/* CTA */}
        <View style={{ marginTop: SPACING.sm }}>
          {hasProposalContext ? (
            alreadyAdded ? (
              <View
                style={{
                  backgroundColor: colors.limeSoft,
                  borderRadius: 20,
                  paddingVertical: 8,
                  paddingHorizontal: SPACING.md,
                  alignItems: 'center',
                }}
              >
                <DNText variant="buttonSm" color={colors.lime}>
                  ✓ In {proposalName ?? 'proposal'}
                </DNText>
              </View>
            ) : (
              <DNButton
                label="+ Add to proposal"
                variant="primary"
                size="compact"
                onPress={() => onAdd(suggestion)}
              />
            )
          ) : (
            <DNButton
              label="+ Add"
              variant="tonal"
              size="compact"
              onPress={() => onAdd(suggestion)}
            />
          )}
        </View>
      </View>
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({
  onUseLocation,
  onSetHomeArea,
  onAddManually,
  colors,
}: {
  onUseLocation: () => void;
  onSetHomeArea: () => void;
  onAddManually: () => void;
  colors: ReturnType<typeof import('@/constants').palette>;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.gutter }}>
      <DNCard index={0} style={{ alignItems: 'center', padding: SPACING.xl, marginBottom: SPACING.lg, width: '100%' }}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>📍</Text>
        <DNSticker
          label="where are you?"
          color={colors.primarySoft}
          textColor={colors.primary}
          rotationIndex={1}
          style={{ marginBottom: SPACING.md }}
        />
        <DNText variant="title" color={colors.ink} style={{ textAlign: 'center', marginBottom: SPACING.lg }}>
          Nothing nearby, yet
        </DNText>
        <DNButton
          label="Use my location"
          variant="primary"
          onPress={onUseLocation}
          style={{ width: '100%', marginBottom: SPACING.sm }}
        />
        <DNButton
          label="Set a home area"
          variant="secondary"
          onPress={onSetHomeArea}
          style={{ width: '100%', marginBottom: SPACING.md }}
        />
        <TouchableOpacity onPress={onAddManually}>
          <DNText variant="secondary" color={colors.primary}>Add an option manually</DNText>
        </TouchableOpacity>
      </DNCard>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SuggestionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const hasProposalContext = !!route.params?.groupId;

  const [activeFilter, setActiveFilter] = useState('All');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [city, setCity] = useState('your area');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 10;

  const fetchSuggestions = useCallback(async (lat?: number, lng?: number, category?: string, reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const cat = category === 'All' ? undefined : category;
      const res = await proposalsAPI.suggestions(lat, lng, cat);
      const data: Suggestion[] = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      if (reset) {
        setSuggestions(data.slice(0, PAGE_SIZE));
        setPage(1);
      } else {
        setSuggestions((prev) => [...prev, ...data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)]);
        setPage((p) => p + 1);
      }
      setHasMore(data.length > (reset ? 1 : page + 1) * PAGE_SIZE);
    } catch (e) {
      console.warn('Failed to fetch suggestions', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationGranted(true);
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setCoords({ lat, lng });

        // Reverse geocode for city name
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        setCity(geo.city ?? geo.region ?? 'your area');

        fetchSuggestions(lat, lng, activeFilter);
      } catch {
        fetchSuggestions(undefined, undefined, activeFilter);
      }
    } else {
      setLocationGranted(false);
    }
  }, [activeFilter, fetchSuggestions]);

  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line

  const handleFilterChange = (f: string) => {
    setActiveFilter(f);
    fetchSuggestions(coords?.lat, coords?.lng, f, true);
  };

  const handleAdd = (s: Suggestion) => {
    const key = s.name + (s.address ?? '');
    setAddedIds((prev) => new Set(prev).add(key));
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSuggestions(coords?.lat, coords?.lng, activeFilter, false);
    }
  };

  const isEmpty = !loading && suggestions.length === 0;

  if (locationGranted === false && isEmpty) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <DNScreenHeader
          title="Discover"
          subtitle="📍 Allow location to find activities"
        />
        <EmptyState
          onUseLocation={requestLocation}
          onSetHomeArea={() => {}}
          onAddManually={() => navigation.navigate('CreateProposal', { groupId: route.params?.groupId ?? '' })}
          colors={colors}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DNScreenHeader
        title="Discover"
        subtitle={`📍 Near ${city} · tonight`}
      />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.gutter, paddingBottom: SPACING.sm, gap: SPACING.sm }}
        style={{ maxHeight: 56, flexGrow: 0 }}
      >
        {FILTERS.map((f, i) => (
          <DNChip
            key={f}
            label={f}
            selected={activeFilter === f}
            onPress={() => handleFilterChange(f)}
            index={i}
          />
        ))}
      </ScrollView>

      {/* Suggestion list */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isEmpty ? (
        <EmptyState
          onUseLocation={requestLocation}
          onSetHomeArea={() => {}}
          onAddManually={() => {}}
          colors={colors}
        />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          renderItem={({ item, index }) => {
            const key = item.name + (item.address ?? '');
            return (
              <SuggestionCard
                suggestion={item}
                index={index}
                hasProposalContext={hasProposalContext}
                proposalName="proposal"
                alreadyAdded={addedIds.has(key)}
                onAdd={handleAdd}
                colors={colors}
              />
            );
          }}
          contentContainerStyle={{ padding: SPACING.gutter, paddingBottom: 120 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> : null
          }
        />
      )}
    </View>
  );
}
