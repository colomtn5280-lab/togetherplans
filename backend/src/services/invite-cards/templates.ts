/**
 * Invite Card Template Registry
 * 36 templates extracted from the DateMeUp design spec (Datemeup Design Pack 10.4.26)
 * Two modes per template: 'vote' ("Is it a date?") and 'official' ("It's on.")
 */

import fs from 'fs';
import path from 'path';

export interface CardTemplate {
  id: string;
  name: string;
}

export interface CardData {
  // Proposal fields
  title: string;         // proposal title e.g. "Date Night · Saturday"
  group: string;         // group name e.g. "Sam & Alex"
  activity: string;      // winning option name or "Vote now"
  address?: string;      // venue address
  date: string;          // formatted date e.g. "Sat, Oct 10 · 8 PM"
  note?: string;         // personal message from sender
  photoUrl?: string;     // user-uploaded photo URL
  // Sender info
  initiatorName: string;   // proposal creator's display name
  memberCount?: number;    // group member count (2 = couple, 3+ = crew)
  mode: 'vote' | 'official';
  kicker: string;        // "Is it a date?" | "It's on."
  cta: string;           // "Vote now" | "See the plan"
  ctaShort: string;      // short CTA for small templates
  result?: string;       // e.g. "2 voting" | "You both said yes"
  opt1?: string;         // option 1 name
  opt2?: string;         // option 2 name
  opt3?: string;         // option 3 name
}

// Top 6 templates biased for random selection on skip
export const TOP_TEMPLATE_IDS = ['1a', '1b', '1c', '1d', '1e', '1f'];

// All 36 template IDs in order
export const ALL_TEMPLATE_IDS = [
  '1a','1b','1c','1d','1e','1f','1g','1h','1i','1j','1k','1l',
  '2a','2b','2c','2d','2e','2f','2g','2h','2i','2j','2k','2l',
  '3a','3b','3c','3d','3e','3f','3g','3h','3i','3j','3k','3l',
];

let _templatesCache: { sharedCss: string; cards: Record<string, { vote: string; official: string }> } | null = null;

function loadTemplates() {
  if (_templatesCache) return _templatesCache;
  const p = path.join(__dirname, 'templates', 'cards.json');
  _templatesCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return _templatesCache!;
}

let _indexCache: CardTemplate[] | null = null;
export function getTemplateIndex(): CardTemplate[] {
  if (_indexCache) return _indexCache;
  const p = path.join(__dirname, 'templates', 'index.json');
  _indexCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return _indexCache!;
}

/**
 * Pick a deterministic random template from the top 6 based on proposalId seed.
 * 70% chance from top 6, 30% from remaining 30.
 */
export function pickRandomTemplate(proposalId: string): string {
  // Simple hash from proposalId for determinism
  let hash = 0;
  for (let i = 0; i < proposalId.length; i++) {
    hash = ((hash << 5) - hash) + proposalId.charCodeAt(i);
    hash |= 0;
  }
  const n = Math.abs(hash);
  // 70% top 6, 30% rest
  if (n % 10 < 7) {
    return TOP_TEMPLATE_IDS[n % TOP_TEMPLATE_IDS.length];
  }
  return ALL_TEMPLATE_IDS[n % ALL_TEMPLATE_IDS.length];
}

/**
 * Render a card template to standalone HTML (9:16 story format, 1080x1920).
 * Substitutes all {{ variable }} placeholders with real data.
 */
export function renderCardHtml(templateId: string, data: CardData): string {
  const { sharedCss, cards } = loadTemplates();
  const card = cards[templateId];
  if (!card) throw new Error(`Unknown template: ${templateId}`);

  const cardHtml = data.mode === 'official' ? card.official : card.vote;

  // Build substitution map
  const vars: Record<string, string> = {
    title: data.title,
    group: data.group,
    groupUpper: data.group.toUpperCase(),
    activity: data.activity,
    activityUpper: data.activity.toUpperCase(),
    address: data.address || '',
    date: data.date,
    note: data.note || '',
    noteLong: data.note || '',
    noteSentence: data.note || '',
    noteCount: String((data.note || '').length),
    kicker: data.kicker,
    kickerUpper: data.kicker.toUpperCase(),
    cta: data.cta,
    ctaUpper: data.cta.toUpperCase(),
    ctaLower: data.cta.toLowerCase(),
    ctaShort: data.ctaShort,
    ctaUpperMrz: data.ctaShort.toUpperCase(),
    result: data.result || '',
    resultSentence: data.result || '',
    opt1: data.opt1 || '',
    opt1Short: (data.opt1 || '').slice(0, 20),
    opt1Upper: (data.opt1 || '').toUpperCase(),
    opt2: data.opt2 || '',
    opt2Short: (data.opt2 || '').slice(0, 20),
    opt2Upper: (data.opt2 || '').toUpperCase(),
    opt3: data.opt3 || '',
    opt3Short: (data.opt3 || '').slice(0, 20),
    opt3Upper: (data.opt3 || '').toUpperCase(),
    photo: data.photoUrl ? `url(${data.photoUrl})` : 'none',
    photoFull: data.photoUrl || '',
    // App branding
    appBg: '#0E8C8C',
    appFg: '#ffffff',
    // Misc
    admit: 'ADMIT ONE',
    marqueeTop: data.activity.toUpperCase(),
    chalkTop: data.activity.toUpperCase(),
    confettiTop: data.kicker,
    gameTop: data.kicker,
    stampTop: data.kicker,
    stampMid: data.date,
    tagStatus: data.mode === 'vote' ? 'PENDING' : 'CONFIRMED',
    termStatus: data.mode === 'vote' ? 'PENDING' : 'CONFIRMED',
    scoreState: data.mode === 'vote' ? 'LIVE' : 'FINAL',
    newsHeadline: data.title,
    newsDeck: data.activity,
    forecastLabel: data.mode === 'vote' ? 'Voting' : 'Confirmed',
    forecastPct: data.mode === 'vote' ? '50%' : '100%',
    wantedFor: data.activity,
    tarotName: data.group,
    tarotReading: data.mode === 'vote' ? 'The stars say vote now.' : 'It is written.',
    formalLine: `${data.initiatorName} cordially invites you`,
    bingoCenter: '★',
    q1: data.opt1 || data.activity,
    q2: data.opt2 || '',
    q3: data.opt3 || '',
    moodCount: '3',
    cardRarity: 'RARE',
    boardTo: data.group,
    board1: data.opt1 || '',
    board2: data.opt2 || '',
    board3: data.opt3 || '',
    featuring: data.activity,
    reward: data.mode === 'vote' ? 'Your vote' : 'A great time',
    // Theme/state vars — leave as safe defaults
    themeClass: '',
    themeLabel: 'Light',
    selName: getTemplateIndex().find(t => t.id === templateId)?.name || templateId,
    dark: 'false',
    // UI interaction vars (not needed in static render)
    setLocked: '', setNote: '', setVote: '',
    shareBg: '#0E8C8C', shareFg: '#ffffff', shareTick: '✓',
    voteBg: '#D9F1F0', voteFg: '#0E8C8C', voteTick: '♥',
    emailBg: '#F4F6F8', emailFg: '#101820', emailTick: '✓',
    emailHeadline: data.title, emailSub: data.activity,
    emailSubject: data.kicker,
    lockBg: '#7CB518', lockFg: '#101820',
    statusBg: '#D9F1F0', statusFg: '#0E8C8C', statusText: data.mode === 'vote' ? 'Voting open' : 'Confirmed',
    pushTitle: data.kicker, pushBody: `${data.group}: ${data.activity}`,
    library: '', moods: '', people: '', templates: '',
    sent: 'false', sentVia: '', send: 'Send', sendLabel: 'Send',
    resetSent: '', sel: templateId,
    pickerTitle: 'Pick a Share Card',
    threadLabel: 'In-app', toggleApp: '', toggleEmail: '', toggleShare: '',
    toggleTheme: '', fw: '360', fh: '640',
    // Photo variants
    photoClimb: data.photoUrl || '', photoJazz: data.photoUrl || '', photoRamen: data.photoUrl || '',
    // Ring/selection state (unused in static)
    ...Object.fromEntries(
      ['arcade','badge','bento','bingo','boarding','calendar','chalk','collage','comic',
       'confetti','departures','formal','mag','map','marquee','neon','news','note',
       'passport','playbill','polaroid','postcard','poster','receipt','score','sticky',
       'swiss','tag','tape','tarot','terminal','ticket','trading','vinyl','wanted','weather']
        .map(n => [`ring_${n}`, 'none'])
    ),
    [`ring_${templateId.replace(/[^a-z]/g, '')}`]: '3px solid #0E8C8C',
  };

  // Replace {{ var }} placeholders
  let html = cardHtml;
  for (const [key, val] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val);
  }
  // Remove any remaining unresolved placeholders
  html = html.replace(/\{\{[^}]+\}\}/g, '');
  // Replace TOGETHERPLANS.APP with DATEMEUP.APP
  html = html.replace(/TOGETHERPLANS\.APP/gi, 'DATEMEUP.APP');
  html = html.replace(/togetherplans\.app/gi, 'datemeup.app');

  // Wrap in a full HTML document at 1080x1920 (9:16 story format)
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Caveat:wght@500;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;width:1080px;height:1920px;overflow:hidden;background:#F4F6F8}
:root{--bg:#F4F6F8;--surface:#FFFFFF;--ink:#101820;--ink2:#5D6B76;--line:#DDE3E8;--primary:#0E8C8C;--primary-deep:#086B6B;--primary-soft:#D9F1F0;--lime:#7CB518;--lime-soft:#EAF6D3;--on-lime:#101820;--on-primary:#FFFFFF;--success:#1E9A55;--success-soft:#DDF4E6;--error:#D63A3A;--warning:#E39B12;--shadow:0 8px 24px rgba(16,24,32,.07)}
.sc-card{width:1080px;height:1920px;border-radius:0;transform-origin:top left}
${sharedCss}
</style>
</head>
<body>
${html}
</body>
</html>`;
}
