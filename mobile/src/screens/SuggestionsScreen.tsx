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
import { CATEGORIES, Category } from '@/constants/categories';
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

// ── Category grid card ─────────────────────────────────────────────────────────
function CategoryGridCard({
  cat,
  selected,
  onPress,
  colors,
}: {
  cat: Category;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof import('@/constants').palette>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        {
          flex: 1,
          backgroundColor: selected ? colors.primary : colors.surface,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: selected ? colors.primary : colors.line,
          paddingVertical: SPACING.sm + 2,
          paddingHorizontal: SPACING.sm,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 84,
        },
        SHADOWS.card,
      ]}
    >
      <Text style={{ fontSize: 24, marginBottom: 4 }}>{cat.emoji}</Text>
      <DNText
        variant="rowLabel"
        color={selected ? colors.onPrimary : colors.ink}
        style={{ textAlign: 'center' }}
        numberOfLines={2}
      >
        {cat.name}
      </DNText>
      <DNText
        variant="secondary"
        color={selected ? colors.onPrimary : colors.ink2}
        style={{ textAlign: 'center', fontSize: 11, marginTop: 2 }}
        numberOfLines={1}
      >
        {cat.tagline}
      </DNText>
    </TouchableOpacity>
  );
}

// ── Category grid (2-column) ───────────────────────────────────────────────────
function CategoryGrid({
  activeId,
  onSelect,
  colors,
}: {
  activeId: string | null;
  onSelect: (cat: Category | null) => void;
  colors: ReturnType<typeof import('@/constants').palette>;
}) {
  const rows: Category[][] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    rows.push(CATEGORIES.slice(i, i + 2));
  }
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
        <DNText variant="section" color={colors.ink2} style={{ flex: 1 }}>
          Browse by category
        </DNText>
        <DNChip
          label="All"
          selected={activeId === null}
          onPress={() => onSelect(null)}
          index={0}
        />
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          {row.map((cat) => (
            <CategoryGridCard
              key={cat.id}
              cat={cat}
              selected={activeId === cat.id}
              onPress={() => onSelect(activeId === cat.id ? null : cat)}
              colors={colors}
            />
          ))}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}

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

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
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

        fetchSuggestions(lat, lng, activeCategory?.id);
      } catch {
        fetchSuggestions(undefined, undefined, activeCategory?.id);
      }
    } else {
      setLocationGranted(false);
    }
  }, [activeCategory, fetchSuggestions]);

  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line

  const handleCategorySelect = (cat: Category | null) => {
    setActiveCategory(cat);
    fetchSuggestions(coords?.lat, coords?.lng, cat?.id, true);
  };

  const handleAdd = (s: Suggestion) => {
    const key = s.name + (s.address ?? '');
    setAddedIds((prev) => new Set(prev).add(key));
    // If opened from CreateProposal, navigate back with the selected suggestion
    if (hasProposalContext && route.params?.returnTo === 'CreateProposal') {
      navigation.navigate('CreateProposal', {
        groupId: route.params.groupId,
        addSuggestion: { name: s.name, category: s.category ?? 'Local Experience', address: s.address ?? '', description: s.description ?? '' },
      });
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSuggestions(coords?.lat, coords?.lng, activeCategory?.id, false);
    }
  };

  // Client-side guard: filter by active category in case the backend returned
  // cached unfiltered results. Matches new display names AND legacy internal names.
  const displayedSuggestions = !activeCategory
    ? suggestions
    : suggestions.filter(
        (s) =>
          !s.category ||
          s.category === activeCategory.name ||
          activeCategory.matches.includes(s.category),
      );

  const isEmpty = !loading && displayedSuggestions.length === 0;

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

      {/* Category grid + suggestion list */}
      {loading ? (
        <ScrollView contentContainerStyle={{ padding: SPACING.gutter, paddingBottom: 120 }}>
          <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} />
          <View style={{ paddingVertical: SPACING.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        </ScrollView>
      ) : isEmpty ? (
        <ScrollView contentContainerStyle={{ padding: SPACING.gutter, paddingBottom: 120 }}>
          <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} />
          <EmptyState
            onUseLocation={requestLocation}
            onSetHomeArea={() => {}}
            onAddManually={() => {}}
            colors={colors}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={displayedSuggestions}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          ListHeaderComponent={
            <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} />
          }
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
