/**
 * SuggestionsScreen / DiscoverScreen — rewritten for real event data
 *
 * Flow: Category grid → tap category → event list loads inline →
 *       tap event card → EventDetailSheet → "Add to Plan"
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlanBuilder } from '@/contexts/PlanBuilderContext';
import { OPTION_RADII, SHADOWS, SPACING, TYPE } from '@/constants';
import { CATEGORIES, Category, getCategoryColorById } from '@/constants/categories';
import {
  DNButton,
  DNCard,
  DNChip,
  DNScreenHeader,
  DNSticker,
  DNText,
} from '@/components/ui';
import { proposalsAPI, api } from '@/services/api';
import type { RootStackParamList, Suggestion } from '@/types';

type RouteT = RouteProp<RootStackParamList, 'Suggestions'>;

// ── Category colour & emoji fallbacks ─────────────────────────────────────────
function getCategoryEmoji(category: string): string {
  const cat = CATEGORIES.find((c) => c.name === category || c.id === category);
  return cat?.emoji ?? '📍';
}

function getCategoryColor(category: string): string {
  return getCategoryColorById(category);
}

// ── Image or emoji fallback block ─────────────────────────────────────────────
function SuggestionImage({
  imageUrl,
  category,
  height = 160,
  borderRadius,
}: {
  imageUrl?: string;
  category: string;
  height?: number;
  borderRadius?: number;
}) {
  const [err, setErr] = useState(false);

  if (imageUrl && !err) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height, borderRadius }}
        resizeMode="cover"
        onError={() => setErr(true)}
      />
    );
  }

  const emoji = getCategoryEmoji(category);
  const bg = getCategoryColor(category);
  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 48 }}>{emoji}</Text>
    </View>
  );
}

// ── Format event date ──────────────────────────────────────────────────────────
function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

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
  colors: any;
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
  colors: any;
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

// ── Event Detail Sheet ─────────────────────────────────────────────────────────
function EventDetailSheet({
  suggestion,
  visible,
  onClose,
  onAdd,
  alreadyAdded,
  colors,
}: {
  suggestion: Suggestion | null;
  visible: boolean;
  onClose: () => void;
  onAdd: (s: Suggestion) => void;
  alreadyAdded: boolean;
  colors: any;
}) {
  const insets = useSafeAreaInsets();
  if (!suggestion) return null;

  const priceStr = suggestion.priceLevel ? '$'.repeat(suggestion.priceLevel) : null;
  const hasDate = !!suggestion.date;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '88%',
          paddingBottom: insets.bottom + SPACING.xl,
        }}
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: SPACING.md,
            right: SPACING.md,
            zIndex: 10,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: colors.ink, fontSize: 18, lineHeight: 22 }}>×</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image */}
          <View style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
            <SuggestionImage
              imageUrl={suggestion.imageUrl}
              category={suggestion.category}
              height={220}
            />
          </View>

          {/* Content */}
          <View style={{ padding: SPACING.gutter, paddingTop: SPACING.md }}>
            {/* Category sticker */}
            <View style={{ flexDirection: 'row', marginBottom: SPACING.sm }}>
              <DNSticker
                label={suggestion.category}
                color={colors.primarySoft}
                textColor={colors.primary}
                rotationIndex={0}
              />
            </View>

            {/* Name */}
            <DNText variant="title" color={colors.ink} style={{ marginBottom: SPACING.sm }}>
              {suggestion.name}
            </DNText>

            {/* Address */}
            {suggestion.address && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
                <Text style={{ marginRight: 6, marginTop: 1 }}>📍</Text>
                <DNText variant="body" color={colors.ink2} style={{ flex: 1 }}>
                  {suggestion.address}
                </DNText>
              </View>
            )}

            {/* Date / time for events */}
            {hasDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
                <Text style={{ marginRight: 6 }}>📅</Text>
                <DNText variant="body" color={colors.ink2}>
                  {formatEventDate(suggestion.date!)}
                </DNText>
              </View>
            )}

            {/* Rating + price + distance */}
            {(suggestion.rating != null || priceStr || suggestion.distanceMiles != null) && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  marginBottom: SPACING.sm,
                }}
              >
                {suggestion.rating != null && (
                  <DNSticker
                    label={`★ ${suggestion.rating.toFixed(1)}`}
                    color={colors.limeSoft}
                    textColor={colors.lime}
                    rotationIndex={1}
                  />
                )}
                {priceStr && (
                  <DNSticker
                    label={priceStr}
                    color={colors.primarySoft}
                    textColor={colors.primary}
                    rotationIndex={2}
                  />
                )}
                {suggestion.distanceMiles != null && (
                  <DNText variant="secondary" color={colors.ink2}>
                    {suggestion.distanceMiles.toFixed(1)} mi
                  </DNText>
                )}
              </View>
            )}

            {/* Description */}
            {suggestion.description ? (
              <DNText
                variant="body"
                color={colors.ink2}
                style={{ marginBottom: SPACING.md, lineHeight: 22 }}
              >
                {suggestion.description}
              </DNText>
            ) : null}

            {/* External link */}
            {suggestion.sourceUrl && (
              <TouchableOpacity
                onPress={() => Linking.openURL(suggestion.sourceUrl!)}
                style={{ marginBottom: SPACING.md }}
              >
                <DNText variant="secondary" color={colors.primary}>
                  View Details →{suggestion.sourceName ? ` (${suggestion.sourceName})` : ''}
                </DNText>
              </TouchableOpacity>
            )}

            {/* Add to Plan CTA */}
            {alreadyAdded ? (
              <View
                style={{
                  backgroundColor: colors.limeSoft,
                  borderRadius: 20,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <DNText variant="buttonSm" color={colors.lime}>
                  ✓ Added to plan
                </DNText>
              </View>
            ) : (
              <DNButton
                label="Add to Plan"
                variant="primary"
                onPress={() => onAdd(suggestion)}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Suggestion Card ────────────────────────────────────────────────────────────
function SuggestionCard({
  suggestion,
  index,
  alreadyAdded,
  onPress,
  colors,
}: {
  suggestion: Suggestion;
  index: number;
  alreadyAdded: boolean;
  onPress: () => void;
  colors: any;
}) {
  const radii = OPTION_RADII[index % 4];
  const priceStr = suggestion.priceLevel ? '$'.repeat(suggestion.priceLevel) : null;
  const hasDate = !!suggestion.date;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
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
      <View
        style={{
          borderTopLeftRadius: radii.topLeft,
          borderTopRightRadius: radii.topRight,
          overflow: 'hidden',
        }}
      >
        <SuggestionImage
          imageUrl={suggestion.imageUrl}
          category={suggestion.category}
          height={160}
        />

        {/* Category sticker */}
        {suggestion.category && (
          <DNSticker
            label={suggestion.category}
            color={colors.primarySoft}
            textColor={colors.primary}
            style={{ position: 'absolute', top: 10, left: 10, transform: [{ rotate: '-4deg' }] }}
          />
        )}

        {/* Rating sticker — only if real data */}
        {suggestion.rating != null && (
          <DNSticker
            label={`★ ${suggestion.rating.toFixed(1)}`}
            color={colors.limeSoft}
            textColor={colors.lime}
            style={{ position: 'absolute', top: 10, right: 10, transform: [{ rotate: '4deg' }] }}
          />
        )}
      </View>

      {/* Body */}
      <View style={{ padding: SPACING.md }}>
        <DNText variant="heading" color={colors.ink}>
          {suggestion.name}
        </DNText>

        {/* Address or event date */}
        {hasDate ? (
          <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 2 }}>
            {formatEventDate(suggestion.date!)}
          </DNText>
        ) : suggestion.address ? (
          <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 2 }}>
            {suggestion.address}
          </DNText>
        ) : null}

        {/* Price + distance */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {priceStr && (
            <DNText variant="secondary" color={colors.ink2}>
              {priceStr}
            </DNText>
          )}
          {suggestion.distanceMiles != null && (
            <DNText variant="secondary" color={colors.ink2}>
              · {suggestion.distanceMiles.toFixed(1)} mi
            </DNText>
          )}
        </View>

        {/* Already added indicator */}
        {alreadyAdded && (
          <View style={{ marginTop: SPACING.xs }}>
            <DNText variant="secondary" color={colors.lime}>
              ✓ In your plan
            </DNText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Idea Card (seed-catalog starter — no live listing) ────────────────────────
function IdeaCard({
  suggestion,
  alreadyAdded,
  onAdd,
  colors,
}: {
  suggestion: Suggestion;
  alreadyAdded: boolean;
  onAdd: () => void;
  colors: any;
}) {
  const tint = getCategoryColor(suggestion.category);
  const emoji = getCategoryEmoji(suggestion.category);
  return (
    <View
      style={{
        backgroundColor: tint,
        borderRadius: 18,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: colors.primary,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 32, marginRight: SPACING.md }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <DNText variant="heading" color="#1A1A1A">
          {suggestion.name}
        </DNText>
        {suggestion.description ? (
          <DNText variant="secondary" color="#4A4A4A" style={{ marginTop: 2 }} numberOfLines={2}>
            {suggestion.description}
          </DNText>
        ) : null}
        <View style={{ marginTop: SPACING.xs, flexDirection: 'row' }}>
          {alreadyAdded ? (
            <DNText variant="secondary" color={colors.lime}>
              ✓ In your plan
            </DNText>
          ) : (
            <TouchableOpacity
              onPress={onAdd}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 6,
                paddingHorizontal: 14,
              }}
            >
              <DNText variant="buttonSm" color={colors.onPrimary}>
                Add to Plan
              </DNText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Ideas Section (rendered below real results) ───────────────────────────────
function IdeasSection({
  ideas,
  hasRealResults,
  addedKeys,
  onAdd,
  colors,
}: {
  ideas: Suggestion[];
  hasRealResults: boolean;
  addedKeys: Set<string>;
  onAdd: (s: Suggestion) => void;
  colors: any;
}) {
  if (ideas.length === 0) return null;
  return (
    <View style={{ marginTop: hasRealResults ? SPACING.md : 0 }}>
      <DNText variant="section" color={colors.ink} style={{ marginBottom: 2 }}>
        Ideas to spark the plan ✨
      </DNText>
      <DNText variant="secondary" color={colors.ink2} style={{ marginBottom: SPACING.sm }}>
        No live listings for this filter yet — some starters:
      </DNText>
      {ideas.map((idea, i) => {
        const key = idea.name + (idea.address ?? '');
        return (
          <IdeaCard
            key={`idea-${idea.name}-${i}`}
            suggestion={idea}
            alreadyAdded={addedKeys.has(key)}
            onAdd={() => onAdd(idea)}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({
  onUseLocation,
  colors,
}: {
  onUseLocation: () => void;
  colors: any;
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
          style={{ width: '100%' }}
        />
      </DNCard>
    </View>
  );
}

// ── 🌙 Tonight near me banner ──────────────────────────────────────────────────
function TonightBanner({
  active,
  weekendFallback,
  city,
  onActivate,
  onClear,
  colors,
}: {
  active: boolean;
  weekendFallback: boolean;
  city: string;
  onActivate: () => void;
  onClear: () => void;
  colors: any;
}) {
  if (active) {
    return (
      <View style={{ marginBottom: SPACING.md }}>
        <View
          style={[
            {
              backgroundColor: '#0A6B72',
              borderRadius: 18,
              paddingVertical: SPACING.sm + 4,
              paddingHorizontal: SPACING.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
            SHADOWS.card,
          ]}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 }} numberOfLines={1}>
            🌙 Showing tonight {city !== 'your area' ? `in ${city}` : 'near you'}
          </Text>
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderRadius: 14,
              paddingVertical: 4,
              paddingHorizontal: 12,
              marginLeft: SPACING.sm,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>clear ×</Text>
          </TouchableOpacity>
        </View>
        {weekendFallback && (
          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: 14,
              padding: SPACING.sm + 2,
              marginTop: SPACING.xs,
            }}
          >
            <DNText variant="secondary" color={colors.primary}>
              🌙 Quiet night out there — here's this weekend instead
            </DNText>
          </View>
        )}
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={onActivate}
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: '#0E8C8C',
          borderRadius: 18,
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.md,
          marginBottom: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        SHADOWS.card,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 26, marginRight: SPACING.sm + 2 }}>🌙</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>Tonight near me</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 1 }}>
            Events happening today, close by
          </Text>
        </View>
      </View>
      <Text style={{ color: '#fff', fontSize: 18 }}>→</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SuggestionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { options: planOptions, addOption, groupId: pbGroupId, setGroupId } = usePlanBuilder();
  const hasProposalContext = !!route.params?.groupId;

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [city, setCity] = useState('your area');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailSuggestion, setDetailSuggestion] = useState<Suggestion | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  // 🌙 Tonight near me shortcut — pseudo-selection 'All · Tonight'
  const [tonightActive, setTonightActive] = useState(false);
  const [weekendFallback, setWeekendFallback] = useState(false);

  const PAGE_SIZE = 10;
  // Use ref for page tracking to avoid stale closures
  const pageRef = useRef(0);
  const allSuggestionsRef = useRef<Suggestion[]>([]);

  // Sync groupId into PlanBuilder if coming from proposal context
  useEffect(() => {
    const incoming = route.params?.groupId;
    if (incoming && incoming !== pbGroupId) {
      setGroupId(incoming);
    }
  }, [route.params?.groupId]);

  const fetchSuggestions = useCallback(async (
    lat?: number,
    lng?: number,
    category?: string,
    reset = true,
  ) => {
    if (reset) {
      setLoading(true);
      pageRef.current = 0;
    } else {
      setLoadingMore(true);
    }
    try {
      const cat = category === 'All' ? undefined : category;
      const res = await proposalsAPI.suggestions(lat, lng, cat);
      const data: Suggestion[] = Array.isArray(res.data) ? res.data : res.data?.results ?? [];

      if (reset) {
        allSuggestionsRef.current = data;
        setSuggestions(data.slice(0, PAGE_SIZE));
        pageRef.current = 1;
      } else {
        const page = pageRef.current;
        setSuggestions((prev) => [
          ...prev,
          ...allSuggestionsRef.current.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
        ]);
        pageRef.current = page + 1;
      }
      setHasMore(data.length > (reset ? 1 : pageRef.current) * PAGE_SIZE);
    } catch (e) {
      console.warn('Failed to fetch suggestions', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []); // no stale-closure deps — uses refs

  // 🌙 Fetch tonight (dateFilter=tonight, All categories). Empty → warm
  // this-weekend fallback instead of a dead end.
  const fetchTonight = useCallback(async (lat?: number, lng?: number) => {
    setLoading(true);
    setWeekendFallback(false);
    pageRef.current = 0;
    try {
      const load = async (dateFilter: 'tonight' | 'this-weekend') => {
        const res = await api.get('/api/suggestions', { params: { lat, lng, dateFilter } });
        const data: Suggestion[] = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        return data;
      };
      let data = await load('tonight');
      // Backend 'tonight' keeps only events dated today (undated places are
      // excluded) — a quiet night can legitimately return only seed ideas.
      if (data.filter((s) => s.isIdea !== true).length === 0) {
        const weekend = await load('this-weekend');
        if (weekend.filter((s) => s.isIdea !== true).length > 0) {
          data = weekend;
          setWeekendFallback(true);
        }
      }
      allSuggestionsRef.current = data;
      setSuggestions(data.slice(0, PAGE_SIZE));
      pageRef.current = 1;
      setHasMore(data.length > PAGE_SIZE);
    } catch (e) {
      console.warn('Failed to fetch tonight suggestions', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const activateTonight = useCallback(async () => {
    setTonightActive(true);
    setActiveCategory(null); // pseudo-selection: All · Tonight
    if (coords) {
      fetchTonight(coords.lat, coords.lng);
      return;
    }
    // Run the existing expo-location flow, then fetch tonight
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationGranted(true);
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setCoords({ lat, lng });
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        setCity(geo.city ?? geo.region ?? 'your area');
        fetchTonight(lat, lng);
      } catch {
        fetchTonight();
      }
    } else {
      setLocationGranted(false);
      fetchTonight();
    }
  }, [coords, fetchTonight]);

  const clearTonight = useCallback(() => {
    setTonightActive(false);
    setWeekendFallback(false);
    fetchSuggestions(coords?.lat, coords?.lng, undefined, true);
  }, [coords, fetchSuggestions]);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationGranted(true);
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setCoords({ lat, lng });
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
    if (tonightActive) {
      setTonightActive(false);
      setWeekendFallback(false);
    }
    setActiveCategory(cat);
    fetchSuggestions(coords?.lat, coords?.lng, cat?.id, true);
  };

  const handleAdd = useCallback((s: Suggestion) => {
    addOption({
      name: s.name,
      category: s.category ?? 'Local Experience',
      address: s.address,
      description: s.description,
      imageUrl: s.imageUrl,
      sourceUrl: s.sourceUrl,
      eventDate: s.date,
      rating: s.rating,
      priceLevel: s.priceLevel,
      sourceName: s.sourceName,
    });
    setDetailVisible(false);
  }, [addOption]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    if (tonightActive) {
      // Tonight data is fully in allSuggestionsRef — paginate locally
      const page = pageRef.current;
      setSuggestions((prev) => [
        ...prev,
        ...allSuggestionsRef.current.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
      ]);
      pageRef.current = page + 1;
      setHasMore(allSuggestionsRef.current.length > (page + 1) * PAGE_SIZE);
      return;
    }
    fetchSuggestions(coords?.lat, coords?.lng, activeCategory?.id, false);
  };

  // Client-side filter by active category
  const displayedSuggestions = !activeCategory
    ? suggestions
    : suggestions.filter(
        (s) =>
          !s.category ||
          s.category === activeCategory.name ||
          (activeCategory as any).matches?.includes(s.category),
      );

  // Split into real results vs seed-catalog ideas (isIdea may be absent)
  const realResults = displayedSuggestions.filter((s) => s.isIdea !== true);
  const ideaResults = displayedSuggestions.filter((s) => s.isIdea === true);

  // Already-added key set
  const addedKeys = new Set(planOptions.map((o) => o.name + (o.address ?? '')));

  const isEmpty = !loading && displayedSuggestions.length === 0;

  if (locationGranted === false && isEmpty) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <DNScreenHeader title="Discover" subtitle="📍 Allow location to find activities" />
        <EmptyState onUseLocation={requestLocation} colors={colors} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DNScreenHeader
        title={tonightActive ? 'Tonight near you' : 'Discover'}
        subtitle={tonightActive ? '🌙 Events happening today' : `📍 Near ${city} · tonight`}
      />

      {loading ? (
        <ScrollView contentContainerStyle={{ padding: SPACING.gutter, paddingBottom: 200 }}>
          <TonightBanner active={tonightActive} weekendFallback={weekendFallback} city={city} onActivate={activateTonight} onClear={clearTonight} colors={colors} />
          <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} />
          <View style={{ paddingVertical: SPACING.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        </ScrollView>
      ) : isEmpty ? (
        <ScrollView contentContainerStyle={{ padding: SPACING.gutter, paddingBottom: 200 }}>
          <TonightBanner active={tonightActive} weekendFallback={weekendFallback} city={city} onActivate={activateTonight} onClear={clearTonight} colors={colors} />
          <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} />
          <EmptyState onUseLocation={requestLocation} colors={colors} />
        </ScrollView>
      ) : (
        <FlatList
          data={realResults}
          keyExtractor={(item, i) => `${item.name}-${item.address ?? ''}-${i}`}
          ListHeaderComponent={
            <>
              <TonightBanner active={tonightActive} weekendFallback={weekendFallback} city={city} onActivate={activateTonight} onClear={clearTonight} colors={colors} />
              <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} />
            </>
          }
          renderItem={({ item, index }) => {
            const key = item.name + (item.address ?? '');
            return (
              <SuggestionCard
                suggestion={item}
                index={index}
                alreadyAdded={addedKeys.has(key)}
                onPress={() => {
                  setDetailSuggestion(item);
                  setDetailVisible(true);
                }}
                colors={colors}
              />
            );
          }}
          contentContainerStyle={{ padding: SPACING.gutter, paddingBottom: 200 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <>
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
              ) : null}
              <IdeasSection
                ideas={ideaResults}
                hasRealResults={realResults.length > 0}
                addedKeys={addedKeys}
                onAdd={handleAdd}
                colors={colors}
              />
            </>
          }
        />
      )}

      {/* Event detail sheet */}
      <EventDetailSheet
        suggestion={detailSuggestion}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onAdd={handleAdd}
        alreadyAdded={detailSuggestion
          ? addedKeys.has(detailSuggestion.name + (detailSuggestion.address ?? ''))
          : false}
        colors={colors}
      />
    </View>
  );
}
