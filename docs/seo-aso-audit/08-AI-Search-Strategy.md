# DateMeUp — AI Search & Generative Engine Visibility Strategy
**October 2026 | Evidence-based**

---

## Current AI Search Landscape

As of October 2026, AI-assisted search surfaces answers from:
- **Google AI Overviews** — embedded in Google Search for informational queries
- **Google AI Mode** — conversational search with cited sources
- **ChatGPT Search** — real-time web search via Bing partnership
- **Microsoft Copilot / Bing** — AI-generated answers with citations
- **Perplexity** — deep-research AI with strong source citation

---

## DateMeUp's Current AI Search Visibility: POOR

### Why
1. **No crawlable text content** — The site is a pure CSR SPA. All content is in JavaScript bundles. When AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Bingbot) visit datemeup.app, they receive a near-empty HTML shell: `<div id="root"></div>`. There is nothing to index, cite, or quote.

2. **No brand entity established** — DateMeUp has no Wikipedia page, no Wikidata entity, no authoritative third-party citations. AI models cannot reliably describe the product because there is no structured, crawlable source of truth.

3. **datemeup.blog is a spam/adult site** — This creates brand entity confusion. AI models referencing "Date Me Up" may cite the wrong property.

4. **No FAQ or question-answering content** — AI Overviews preferentially surface content that directly answers user questions. DateMeUp has no "What is DateMeUp?", "How does couples voting work?", or "How do I plan a date night?" pages.

5. **No structured entity data** — No Organization schema, no SoftwareApplication schema, no product description in machine-readable format.

---

## What AI Crawlers Need

| Crawler | Bot Name | Robots.txt Allow Needed |
|---|---|---|
| Google AI | Googlebot-Extended | Allowed by default |
| OpenAI / ChatGPT | GPTBot | Must explicitly allow |
| Perplexity | PerplexityBot | Must explicitly allow |
| Anthropic | ClaudeBot | Must explicitly allow |
| Microsoft/Bing | Bingbot | Allowed by default |
| Common Crawl | CCBot | Often blocked, low value |

**Current status:** robots.txt returns the SPA HTML (not a valid robots.txt). Technically all bots can crawl but find nothing. Once robots.txt is fixed, all major AI crawlers should be allowed.

---

## Recommended robots.txt for AI Visibility

```
User-agent: *
Allow: /
Allow: /privacy
Allow: /terms
Allow: /support
Allow: /suggestions
Allow: /discover
Disallow: /dashboard
Disallow: /groups
Disallow: /proposals
Disallow: /settings
Disallow: /notifications
Disallow: /api/

# Explicitly allow AI crawlers (important for AI search visibility)
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://datemeup.app/sitemap.xml
```

---

## Strategy: Crawlable Content First

AI models cite pages they can actually read. The priority is getting readable text in front of these crawlers.

### Tier 1: Fix the Foundation (Week 1)
1. **Pre-render public pages** — Landing page, /privacy, /terms, /support, /suggestions need to serve real HTML
2. **Fix robots.txt** — Allow AI crawlers explicitly  
3. **Add Organization + SoftwareApplication schema** — Machine-readable product description

### Tier 2: Brand Entity Content (Month 1)
Create a dedicated **About DateMeUp** page at `/about` with:
- Clear product description: "DateMeUp is a date night planning app for couples and groups"
- How it works (3 steps: propose, vote, decide)
- Key features list
- Founders/company information (builds trust signals)
- Link to privacy policy and terms

This page becomes the canonical entity page that AI models can cite when describing DateMeUp.

### Tier 3: Question-Answering Content (Month 1-2)
Add an FAQ section to the landing page (also Schema.org FAQPage markup):

```
Q: What is DateMeUp?
A: DateMeUp is a free app for couples and groups to plan date nights together. 
   You propose activity options, your partner votes, and the app automatically 
   decides when you both agree.

Q: How is DateMeUp different from a dating app?
A: DateMeUp is for couples who are already together. It's not for meeting 
   new people — it's for deciding what to do with the person you're already with.

Q: Does my partner need to install the app to vote?
A: No. You can send your partner a link and they can vote directly in their 
   browser without downloading anything.

Q: Is DateMeUp free?
A: Yes. DateMeUp is free for couples and groups. There are no ads.
```

These answers directly match what AI Overviews surface for queries like "what is datemeup" or "how does datemeup work".

### Tier 4: Third-Party Citations (Month 2-3)
AI models weight citations from authoritative third parties more heavily than self-published content. Target:
- **Product Hunt launch** — generates backlinks and indexed reviews
- **App review sites**: AppAdvice, MacStories, 9to5Mac (iOS), Android Police, 9to5Google (Android)
- **Lifestyle press**: Couples blogs, date night blogs, relationship advice sites
- **Tech press**: Brief outreach to TechCrunch, The Verge app coverage

Even 3-5 quality third-party citations dramatically improve AI model awareness.

---

## AI-Optimized Content Principles

1. **Answer questions directly** — AI models prefer content that states the answer in the first sentence
2. **Define the product clearly** — "DateMeUp is a [category] that [does what] for [who]"
3. **Be factually precise** — AI models can hallucinate; accurate, specific content corrects this
4. **Use structured headings** — H2/H3 headings help AI models chunk and cite specific answers
5. **Keep content current** — AI models favor recently updated pages
6. **Consistent brand naming** — Always "DateMeUp" (one word, capital D, M, U) across all properties

---

## AI Search Opportunity Score

| Query Type | Current Visibility | Potential | Effort |
|---|---|---|---|
| "what is datemeup" | ❌ None | High | Low (About page) |
| "date night planning app" | ❌ None | High | Medium (content) |
| "couples voting app" | ❌ None | Medium | Medium |
| "how to plan a date night" | ❌ None | High | Medium (FAQ/blog) |
| "best date night apps 2026" | ❌ None | High | Low (citations) |
| "app where couples vote on activities" | ❌ None | High | Low (entity page) |

**Overall AI search readiness: 4/100** (CSR SPA with no crawlable content)
**Potential within 90 days: 55/100** (with pre-rendering + entity content)
