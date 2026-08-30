import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { proposalsAPI } from '@/services/api';
import { Proposal, ActivityOption, RootStackParamList } from '@/types';
import { COLORS, SPACING } from '@/constants';

type Props = { route: RouteProp<RootStackParamList, 'ProposalDetail'> };

export default function ProposalDetailScreen({ route }: Props) {
  const { proposalId } = route.params;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);

  const fetchProposal = async () => {
    try {
      const res = await proposalsAPI.get(proposalId);
      setProposal(res.data.proposal);
      // Detect existing vote from votes array if present
      if (res.data.myVoteOptionId) setMyVote(res.data.myVoteOptionId);
    } catch {
      Alert.alert('Error', 'Could not load proposal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProposal(); }, [proposalId]);

  const handleVote = async (optionId: string) => {
    setVoting(optionId);
    try {
      await proposalsAPI.vote(proposalId, optionId);
      setMyVote(optionId);
      await fetchProposal(); // refresh for updated consensus
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not cast vote');
    } finally {
      setVoting(null);
    }
  };

  if (loading || !proposal) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const { consensus } = proposal;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>{proposal.title}</Text>
      {proposal.description && <Text style={styles.description}>{proposal.description}</Text>}
      {proposal.scheduledFor && (
        <Text style={styles.meta}>📅 {new Date(proposal.scheduledFor).toLocaleDateString()}</Text>
      )}

      {consensus?.reached && (
        <View style={styles.consensusBanner}>
          <Text style={styles.consensusText}>🎉 Consensus reached! The group chose:</Text>
          <Text style={styles.consensusWinner}>{consensus.winningOption?.title}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Activity Options</Text>
      {proposal.options.map((opt: ActivityOption) => {
        const voteData = consensus?.votes.find((v) => v.optionId === opt.id);
        const isMyVote = myVote === opt.id;
        const isWinner = consensus?.winningOptionId === opt.id;

        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.optionCard, isMyVote && styles.optionCardVoted, isWinner && styles.optionCardWinner]}
            onPress={() => !myVote && handleVote(opt.id)}
            disabled={!!myVote || proposal.status !== 'ACTIVE'}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              {isMyVote && <Text style={styles.myVoteBadge}>✓ Your vote</Text>}
              {isWinner && !isMyVote && <Text style={styles.winnerBadge}>🏆 Winner</Text>}
            </View>
            {opt.description && <Text style={styles.optionDesc}>{opt.description}</Text>}
            {opt.location && <Text style={styles.optionMeta}>📍 {opt.location}</Text>}
            {opt.estimatedCost && <Text style={styles.optionMeta}>💰 {opt.estimatedCost}</Text>}
            {opt.estimatedDuration && <Text style={styles.optionMeta}>⏱ {opt.estimatedDuration}</Text>}
            {voteData && (
              <View style={styles.voteBar}>
                <View style={[styles.voteBarFill, { width: `${voteData.percentage}%` }]} />
                <Text style={styles.voteCount}>{voteData.count} vote{voteData.count !== 1 ? 's' : ''} ({Math.round(voteData.percentage)}%)</Text>
              </View>
            )}
            {!myVote && proposal.status === 'ACTIVE' && (
              voting === opt.id
                ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.sm }} />
                : <Text style={styles.tapToVote}>Tap to vote</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { padding: SPACING.md },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  description: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  meta: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.md },
  consensusBanner: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md },
  consensusText: { fontSize: 14, color: '#2E7D32' },
  consensusWinner: { fontSize: 18, fontWeight: '700', color: '#1B5E20', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  optionCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 2, borderColor: COLORS.border },
  optionCardVoted: { borderColor: COLORS.primary },
  optionCardWinner: { borderColor: COLORS.success, backgroundColor: '#F1F8E9' },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  optionDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  optionMeta: { fontSize: 13, color: COLORS.textSecondary },
  myVoteBadge: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  winnerBadge: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  voteBar: { marginTop: SPACING.sm, height: 20, backgroundColor: COLORS.border, borderRadius: 10, overflow: 'hidden', justifyContent: 'center' },
  voteBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: COLORS.primary + '40', borderRadius: 10 },
  voteCount: { fontSize: 12, color: COLORS.text, paddingLeft: SPACING.sm, zIndex: 1 },
  tapToVote: { fontSize: 12, color: COLORS.primary, marginTop: SPACING.sm, textAlign: 'right' },
});
