/**
 * Cloudflare Pages Function: /vote/:token
 *
 * Social crawlers (iMessage, WhatsApp, Facebook, Twitter/X, Slack, Telegram,
 * LinkedIn, Discord) don't execute the SPA's JavaScript, so they can't see
 * OG tags rendered client-side. This function sniffs known crawler
 * User-Agents and proxies them to the backend preview endpoint
 * (GET /api/share/:token/preview) which serves crawler-readable HTML with
 * og:title / og:description / og:image. Everyone else gets the SPA as usual.
 */

const CRAWLER_UA_RE =
  /facebookexternalhit|whatsapp|twitterbot|slackbot|telegrambot|linkedinbot|discordbot|applebot|pinterest|redditbot|skypeuripreview|vkshare|snapchat|iframely|embedly/i;

const API_ORIGIN = "https://datenight-api-mh74edz3ja-uc.a.run.app";
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

interface PagesContext {
  request: Request;
  params: { token: string };
  next: () => Promise<Response>;
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const { request, params, next } = context;
  const ua = request.headers.get("user-agent") || "";
  const token = params.token;

  if (CRAWLER_UA_RE.test(ua) && TOKEN_RE.test(token)) {
    try {
      const upstream = await fetch(`${API_ORIGIN}/api/share/${token}/preview`, {
        headers: { "user-agent": ua },
      });
      if (upstream.ok) {
        return new Response(upstream.body, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      }
    } catch {
      // fall through to the SPA on any upstream failure
    }
  }

  // Humans (and anything unrecognized) get the SPA
  return next();
};
