/**
 * SuggestionsScreen / DiscoverScreen — rewritten for real event data
 *
 * Flow: Category grid → tap category → event list loads inline →
 *       tap event card → EventDetailSheet → "Add to Plan"
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlanBuilder } from '@/contexts/PlanBuilderContext';
import { API_BASE_URL, OPTION_RADII, SHADOWS, SPACING, TYPE } from '@/constants';
import { CATEGORIES, Category, getCategoryColorById } from '@/constants/categories';
import { loadFavCategories, orderCategoriesByFavorites } from '@/components/FavCategories';
import {
  DNButton,
  DNCard,
  DNChip,
  DNScreenHeader,
  DNSticker,
  DNText,
} from '@/components/ui';
import { AddToDateButton } from '@/components/AddToDateButton';
import { proposalsAPI, api, getToken } from '@/services/api';
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
  isFav,
}: {
  cat: Category;
  selected: boolean;
  onPress: () => void;
  colors: any;
  isFav?: boolean;
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
          borderColor: selected ? colors.primary : isFav ? colors.primary : colors.line,
          paddingVertical: SPACING.sm + 2,
          paddingHorizontal: SPACING.sm,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 84,
        },
        SHADOWS.card,
      ]}
    >
      {isFav && !selected && (
        <Text style={{ position: 'absolute', top: 6, right: 8, fontSize: 11, color: colors.primary }}>★</Text>
      )}
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
  categories,
  favIds,
}: {
  activeId: string | null;
  onSelect: (cat: Category | null) => void;
  colors: any;
  categories: Category[];
  favIds: string[];
}) {
  const rows: Category[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    rows.push(categories.slice(i, i + 2));
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
              isFav={favIds.includes(cat.id)}
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

  // ── Venue enrichment state ─────────────────────────────────────────────────
  type VenueDetail = {
    hours?: string;
    phone?: string;
    reservationUrl?: string;
    menuHighlights?: string[];
    parking?: string;
    dresscode?: string;
    cancellationPolicy?: string;
  };
  const [venueDetail, setVenueDetail] = useState<VenueDetail | null>(null);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (!visible || !suggestion?.sourceUrl) {
      setVenueDetail(null);
      setEnriching(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setEnriching(true);
      setVenueDetail(null);
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE_URL}/api/suggestions/enrich?url=${encodeURIComponent(suggestion.sourceUrl!)}`,
          { headers: { Authorization: `Bearer ${token ?? ''}` } },
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          setVenueDetail(data.detail ?? null);
        }
      } catch {
        // silent — venueDetail stays null
      } finally {
        if (!cancelled) setEnriching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [visible, suggestion?.sourceUrl]);
  // ──────────────────────────────────────────────────────────────────────────

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

            {/* More Details (Firecrawl enrichment) */}
            {enriching && (
              <ActivityIndicator size="small" color="#0E8C8C" style={{ marginBottom: SPACING.md, alignSelf: 'flex-start' }} />
            )}
            {!enriching && venueDetail && (
              venueDetail.hours ||
              venueDetail.phone ||
              (venueDetail.menuHighlights && venueDetail.menuHighlights.length > 0) ||
              (venueDetail.reservationUrl && venueDetail.reservationUrl !== suggestion.sourceUrl)
            ) ? (
              <View
                style={{
                  backgroundColor: '#F5F5F5',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                {venueDetail.hours ? (
                  <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                    {'🕐 ' + venueDetail.hours}
                  </Text>
                ) : null}
                {venueDetail.phone ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${venueDetail.phone}`)}>
                    <Text style={{ fontSize: 14, color: '#0E8C8C', marginBottom: 4 }}>
                      {'📞 ' + venueDetail.phone}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {venueDetail.menuHighlights && venueDetail.menuHighlights.length > 0 ? (
                  <View style={{ marginBottom: 4 }}>
                    {venueDetail.menuHighlights.slice(0, 4).map((item, idx) => (
                      <Text key={idx} style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
                        {'• ' + item}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {venueDetail.reservationUrl && venueDetail.reservationUrl !== suggestion.sourceUrl ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(venueDetail.reservationUrl!)}
                    style={{
                      marginTop: 6,
                      backgroundColor: '#0E8C8C',
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Reserve a Table →</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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

            {/* Add to Date CTA */}
            {alreadyAdded ? (
              <AddToDateButton added onPress={() => {}} />
            ) : (
              <AddToDateButton onPress={() => onAdd(suggestion)} />
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

        {/* Add to Date button — full width, card bottom, 14px gap from distance line */}
        <View style={{ marginTop: 14 }}>
          <AddToDateButton added={alreadyAdded} onPress={onPress} />
        </View>
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
        flexDirection: 'column',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
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
        </View>
      </View>
      <AddToDateButton added={alreadyAdded} onPress={onAdd} />
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

// ── Search area controls — radius pills + zip override ────────────────────────
const RADIUS_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 10, label: 'Nearby 10' },
  { value: 25, label: '25' },
  { value: 60, label: '60' },
  { value: 150, label: 'Day trip 150' },
];

function AreaControls({
  radius,
  onRadius,
  zipOverride,
  onApplyZip,
  onClearZip,
  colors,
}: {
  radius: number;
  onRadius: (r: number) => void;
  zipOverride: string | null;
  onApplyZip: (zip: string) => void;
  onClearZip: () => void;
  colors: any;
}) {
  const [zipInputOpen, setZipInputOpen] = useState(false);
  const [zipDraft, setZipDraft] = useState('');

  return (
    <View style={{ marginBottom: SPACING.md }}>
      {/* Radius pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: SPACING.xs, alignItems: 'center' }}>
          <DNText variant="secondary" color={colors.ink2} style={{ marginRight: 4 }}>
            Search area
          </DNText>
          {RADIUS_OPTIONS.map((opt) => {
            const selected = radius === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onRadius(opt.value)}
                style={{
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.line,
                  borderRadius: 16,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <Text
                  style={{
                    color: selected ? colors.onPrimary : colors.ink,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <DNText variant="secondary" color={colors.ink2} style={{ marginLeft: 2 }}>
            mi
          </DNText>
        </View>
      </ScrollView>

      {/* Zip override affordance */}
      {zipOverride ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs }}>
          <DNText variant="secondary" color={colors.ink2}>
            📍 Showing {zipOverride} ·{' '}
          </DNText>
          <TouchableOpacity onPress={onClearZip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <DNText variant="secondary" color={colors.primary} style={{ fontWeight: '700' }}>
              back to my location ×
            </DNText>
          </TouchableOpacity>
        </View>
      ) : !zipInputOpen ? (
        <TouchableOpacity
          onPress={() => setZipInputOpen(true)}
          style={{ marginTop: SPACING.xs, alignSelf: 'flex-start' }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <DNText
            variant="secondary"
            color={colors.primary}
            style={{ textDecorationLine: 'underline' }}
          >
            Search another area
          </DNText>
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs, flexWrap: 'wrap' }}>
          <DNText variant="secondary" color={colors.ink2}>
            Planning a getaway?
          </DNText>
          <TextInput
            value={zipDraft}
            onChangeText={(t) => setZipDraft(t.replace(/\D/g, '').slice(0, 5))}
            placeholder="5-digit zip"
            placeholderTextColor={colors.ink2}
            keyboardType="number-pad"
            maxLength={5}
            autoFocus
            style={{
              borderWidth: 1.5,
              borderColor: colors.line,
              borderRadius: 12,
              paddingVertical: 6,
              paddingHorizontal: 10,
              width: 100,
              fontSize: 14,
              color: colors.ink,
              backgroundColor: colors.surface,
            }}
          />
          <TouchableOpacity
            disabled={zipDraft.length !== 5}
            onPress={() => {
              onApplyZip(zipDraft);
              setZipInputOpen(false);
              setZipDraft('');
            }}
            style={{
              backgroundColor: zipDraft.length === 5 ? colors.primary : colors.line,
              borderRadius: 14,
              paddingVertical: 6,
              paddingHorizontal: 14,
            }}
          >
            <DNText variant="buttonSm" color={colors.onPrimary}>
              Go
            </DNText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setZipInputOpen(false);
              setZipDraft('');
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <DNText variant="secondary" color={colors.ink2}>
              Cancel
            </DNText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Media Search Bar (Netflix/Movies) ────────────────────────────────────────
function MediaSearchBar({
  query,
  loading,
  onChangeText,
  onSubmit,
  onClear,
  colors,
}: {
  query: string;
  loading: boolean;
  onChangeText: (t: string) => void;
  onSubmit: (q: string) => void;
  onClear: () => void;
  colors: any;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.line,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
        marginBottom: SPACING.sm,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 16 }}>🔍</Text>
      <TextInput
        value={query}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit(query)}
        placeholder="Search movies & shows..."
        placeholderTextColor={colors.ink2}
        returnKeyType="search"
        style={{ flex: 1, color: colors.ink, fontSize: 14 }}
        autoCorrect={false}
      />
      {loading && <ActivityIndicator size="small" color={colors.primary} />}
      {!loading && query.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: colors.ink2, fontSize: 18, lineHeight: 22 }}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Date Filter Chips ─────────────────────────────────────────────────────────
function DateChipsRow({
  specificDate,
  onOpenPicker,
  onClearDate,
  colors,
}: {
  specificDate: Date | null;
  onOpenPicker: () => void;
  onClearDate: () => void;
  colors: any;
}) {
  const formatShortDate = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm }}>
      <TouchableOpacity
        onPress={specificDate ? onClearDate : onOpenPicker}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: specificDate ? colors.primary : colors.surface,
          borderWidth: 1.5,
          borderColor: specificDate ? colors.primary : colors.line,
          borderRadius: 16,
          paddingVertical: 6,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ fontSize: 14 }}>📅</Text>
        <Text
          style={{
            color: specificDate ? colors.onPrimary : colors.ink,
            fontSize: 13,
            fontWeight: '700',
          }}
        >
          {specificDate ? formatShortDate(specificDate) : 'Pick date'}
        </Text>
        {specificDate && (
          <Text style={{ color: colors.onPrimary, fontSize: 13, marginLeft: 2 }}>×</Text>
        )}
      </TouchableOpacity>
      {!specificDate && (
        <Text style={{ fontSize: 12, color: colors.ink2 }}>Choose a specific date</Text>
      )}
    </View>
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
  // Calendar date picker for specific date
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [specificDate, setSpecificDate] = useState<Date | null>(null);
  // Netflix/Movies search
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [mediaSearchResults, setMediaSearchResults] = useState<Suggestion[] | null>(null);
  const [mediaSearchLoading, setMediaSearchLoading] = useState(false);
  // Search area: radius (miles) + optional zip override for getaways.
  // Refs mirror state so the ref-based fetch callbacks never read stale values.
  const [radius, setRadiusState] = useState(25);
  const [zipOverride, setZipOverrideState] = useState<string | null>(null);
  const radiusRef = useRef(25);
  const zipRef = useRef<string | null>(null);
  const specificDateRef = useRef<string | null>(null);

  // Favorite categories (AsyncStorage) — grid shows favourites first.
  // Reloaded on every focus so Profile edits show up immediately.
  const [favIds, setFavIds] = useState<string[]>([]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadFavCategories().then(setFavIds);
    });
    loadFavCategories().then(setFavIds);
    return unsub;
  }, [navigation]);
  const orderedCategories = useMemo(() => CATEGORIES, []);

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
    dateFilter?: string,
  ) => {
    if (reset) {
      setLoading(true);
      pageRef.current = 0;
    } else {
      setLoadingMore(true);
    }
    try {
      const cat = category === 'All' ? undefined : category;
      const zip = zipRef.current ?? undefined;
      const res = await proposalsAPI.suggestions(
        zip ? undefined : lat,
        zip ? undefined : lng,
        cat,
        radiusRef.current,
        zip,
        dateFilter,
      );
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
        const zip = zipRef.current ?? undefined;
        const res = await api.get('/api/suggestions', {
          params: {
            lat: zip ? undefined : lat,
            lng: zip ? undefined : lng,
            dateFilter,
            radius: radiusRef.current,
            zip,
          },
        });
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

  // ── Search area handlers — update ref first so refetches see fresh values ──
  const refetchCurrent = useCallback(() => {
    if (tonightActive) {
      fetchTonight(coords?.lat, coords?.lng);
    } else {
      const dateFilter = specificDateRef.current ? `specific:${specificDateRef.current}` : undefined;
      fetchSuggestions(coords?.lat, coords?.lng, activeCategory?.id, true, dateFilter);
    }
  }, [tonightActive, coords, activeCategory, fetchTonight, fetchSuggestions]);

  const handleRadiusChange = useCallback((r: number) => {
    radiusRef.current = r;
    setRadiusState(r);
    refetchCurrent();
  }, [refetchCurrent]);

  const handleApplyZip = useCallback((zip: string) => {
    zipRef.current = zip;
    setZipOverrideState(zip);
    refetchCurrent();
  }, [refetchCurrent]);

  const handleClearZip = useCallback(() => {
    zipRef.current = null;
    setZipOverrideState(null);
    refetchCurrent();
  }, [refetchCurrent]);

  const handleDatePicked = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    specificDateRef.current = dateStr;
    setSpecificDate(date);
    setShowDatePicker(false);
    const dateFilter = `specific:${dateStr}`;
    fetchSuggestions(coords?.lat, coords?.lng, activeCategory?.id, true, dateFilter);
  }, [coords, activeCategory, fetchSuggestions]);

  const handleClearSpecificDate = useCallback(() => {
    specificDateRef.current = null;
    setSpecificDate(null);
    fetchSuggestions(coords?.lat, coords?.lng, activeCategory?.id, true);
  }, [coords, activeCategory, fetchSuggestions]);

  const handleMediaSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setMediaSearchResults(null);
      return;
    }
    setMediaSearchLoading(true);
    try {
      const res = await api.get('/api/suggestions/search', { params: { q: q.trim() } });
      const data: Suggestion[] = Array.isArray(res.data) ? res.data : [];
      setMediaSearchResults(data);
    } catch (e) {
      console.warn('Media search failed', e);
    } finally {
      setMediaSearchLoading(false);
    }
  }, []);

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
    // Reset media search when changing category
    setMediaSearchQuery('');
    setMediaSearchResults(null);
    const dateFilter = specificDateRef.current ? `specific:${specificDateRef.current}` : undefined;
    fetchSuggestions(coords?.lat, coords?.lng, cat?.id, true, dateFilter);
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

  // Whether the active category supports media search (Netflix/Movies)
  const isMediaCategory = activeCategory?.id === 'movies' || activeCategory?.id === 'netflix-shows';

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
  // If media search is active, use those results instead
  const effectiveRealResults = (isMediaCategory && mediaSearchResults !== null)
    ? mediaSearchResults.filter((s) => s.isIdea !== true)
    : displayedSuggestions.filter((s) => s.isIdea !== true);
  const realResults = effectiveRealResults;
  const ideaResults = (isMediaCategory && mediaSearchResults !== null)
    ? []
    : displayedSuggestions.filter((s) => s.isIdea === true);

  // Already-added key set
  const addedKeys = new Set(planOptions.map((o) => o.name + (o.address ?? '')));

  const isEmpty = !loading && displayedSuggestions.length === 0;

  if (locationGranted === false && isEmpty && !zipOverride) {
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
        subtitle={
          tonightActive
            ? '🌙 Events happening today'
            : zipOverride
            ? `📍 Searching ${zipOverride} · ${radius} mi`
            : `📍 Near ${city} · tonight`
        }
      />

      {loading ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.gutter, paddingTop: SPACING.gutter, paddingBottom: 200 }}>
          <TonightBanner active={tonightActive} weekendFallback={weekendFallback} city={city} onActivate={activateTonight} onClear={clearTonight} colors={colors} />
          <DateChipsRow specificDate={specificDate} onOpenPicker={() => setShowDatePicker(true)} onClearDate={handleClearSpecificDate} colors={colors} />
          <AreaControls radius={radius} onRadius={handleRadiusChange} zipOverride={zipOverride} onApplyZip={handleApplyZip} onClearZip={handleClearZip} colors={colors} />
          <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} categories={orderedCategories} favIds={favIds} />
          <View style={{ paddingVertical: SPACING.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        </ScrollView>
      ) : isEmpty ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.gutter, paddingTop: SPACING.gutter, paddingBottom: 200 }}>
          <TonightBanner active={tonightActive} weekendFallback={weekendFallback} city={city} onActivate={activateTonight} onClear={clearTonight} colors={colors} />
          <DateChipsRow specificDate={specificDate} onOpenPicker={() => setShowDatePicker(true)} onClearDate={handleClearSpecificDate} colors={colors} />
          <AreaControls radius={radius} onRadius={handleRadiusChange} zipOverride={zipOverride} onApplyZip={handleApplyZip} onClearZip={handleClearZip} colors={colors} />
          <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} categories={orderedCategories} favIds={favIds} />
          <EmptyState onUseLocation={requestLocation} colors={colors} />
        </ScrollView>
      ) : (
        <FlatList
          data={realResults}
          keyExtractor={(item, i) => `${item.name}-${item.address ?? ''}-${i}`}
          ListHeaderComponent={
            <>
              <TonightBanner active={tonightActive} weekendFallback={weekendFallback} city={city} onActivate={activateTonight} onClear={clearTonight} colors={colors} />
              <DateChipsRow specificDate={specificDate} onOpenPicker={() => setShowDatePicker(true)} onClearDate={handleClearSpecificDate} colors={colors} />
              <AreaControls radius={radius} onRadius={handleRadiusChange} zipOverride={zipOverride} onApplyZip={handleApplyZip} onClearZip={handleClearZip} colors={colors} />
              <CategoryGrid activeId={activeCategory?.id ?? null} onSelect={handleCategorySelect} colors={colors} categories={orderedCategories} favIds={favIds} />
              {isMediaCategory && (
                <MediaSearchBar
                  query={mediaSearchQuery}
                  loading={mediaSearchLoading}
                  onChangeText={(t) => setMediaSearchQuery(t)}
                  onSubmit={handleMediaSearch}
                  onClear={() => { setMediaSearchQuery(''); setMediaSearchResults(null); }}
                  colors={colors}
                />
              )}
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
          contentContainerStyle={{ paddingHorizontal: SPACING.gutter, paddingTop: SPACING.gutter, paddingBottom: 200 }}
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

      {/* Calendar date picker */}
      {showDatePicker && (
        <DateTimePicker
          value={specificDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(_event: any, date?: Date) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
              if (date) handleDatePicked(date);
            } else if (date) {
              handleDatePicked(date);
            }
          }}
        />
      )}
    </View>
  );
}
