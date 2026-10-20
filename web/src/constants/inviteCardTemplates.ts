/**
 * Invite card template HTML snippets — extracted from the DateNight Design Pack.
 * Each value is the sc-card div HTML with real sample data injected.
 * Rendered at 0.35x scale inside the picker thumbnails.
 * 
 * The shared CSS (from the design pack) is in CARD_SHARED_CSS.
 * Usage: dangerouslySetInnerHTML={ __html: CARD_HTML[templateId] }
 *        wrapped in a scaled container.
 */

export const CARD_SHARED_CSS = `
body{margin:0;background:#E8ECEF;font-family:'DM Sans',system-ui,sans-serif;color:#101820}
a{color:#0E8C8C}a:hover{color:#086B6B}
.dn{--bg:#F4F6F8;--surface:#FFFFFF;--ink:#101820;--ink2:#5D6B76;--line:#DDE3E8;--primary:#0E8C8C;--primary-deep:#086B6B;--primary-soft:#D9F1F0;--lime:#7CB518;--lime-soft:#EAF6D3;--on-lime:#101820;--on-primary:#FFFFFF;--success:#1E9A55;--success-soft:#DDF4E6;--error:#D63A3A;--warning:#E39B12;--warning-soft:#FBEFD3;--shadow:0 8px 24px rgba(16,24,32,.07);--dock:0 12px 32px rgba(16,24,32,.16)}
.dn-dark{--bg:#0F1519;--surface:#18212A;--ink:#EEF3F6;--ink2:#93A3AF;--line:#2A3641;--primary:#2FC4C1;--primary-deep:#5AD6D3;--primary-soft:#154243;--lime:#A8E04B;--lime-soft:#2B4412;--on-lime:#101820;--on-primary:#0F1519;--success:#3FC77A;--success-soft:#173B27;--error:#FF6B6B;--warning:#F3B84A;--warning-soft:#3D2E12;--shadow:0 8px 24px rgba(0,0,0,.4);--dock:0 16px 40px rgba(0,0,0,.65)}
.dv-turn{padding:40px 44px 32px;border-bottom:1px solid rgba(0,0,0,.08);scroll-margin-top:16px}
.dv-thd{display:flex;align-items:baseline;gap:10px;margin:0 0 20px}
.dv-tid{font:600 10px ui-monospace,Menlo,monospace;padding:3px 7px;background:#1a1a1a;color:#fff;border-radius:4px;text-decoration:none}
.dv-tname{font:600 13px/1.2 system-ui,sans-serif;color:#1a1a1a}
.dv-opts{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}
.dv-opt{flex:none;display:flex;flex-direction:column;gap:9px;scroll-margin-top:16px}
.dv-oid{font:600 10.5px ui-monospace,Menlo,monospace;padding:3px 7px;background:rgba(0,0,0,.08);color:#1a1a1a;border-radius:5px;text-decoration:none}
.dv-olabel{display:flex;align-items:baseline;gap:8px;font:400 11px/1.3 system-ui,sans-serif;color:rgba(0,0,0,.55)}
.dn-dark .dv-oid{background:rgba(255,255,255,.14);color:#F8F2EC}.dn-dark .dv-tid{background:#F8F2EC;color:#1a1a1a}.dn-dark .dv-turn{border-bottom-color:rgba(255,255,255,.1)}
.dv-opt:target .dv-oid{background:#0E8C8C;color:#fff}
.dv-next{margin:22px 0 0;font:12px/1.5 system-ui,sans-serif;color:rgba(0,0,0,.5)}
.dv-row{font:700 11px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);margin:34px 0 14px}
.sc-card{width:360px;height:640px;position:relative;overflow:hidden;border-radius:28px;flex:none;box-sizing:border-box;font-family:'DM Sans',sans-serif;color:#101820}
.sc-clone{position:relative;overflow:hidden;border-radius:14px;flex:none;box-sizing:border-box}
.sc-clone .sc-card{border-radius:28px}
@keyframes dn-rise{0%{transform:translateY(40px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes dn-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}
@keyframes dn-neon{0%,100%{opacity:1}92%{opacity:1}94%{opacity:.55}96%{opacity:1}}
`;

export const CARD_HTML: Record<string, string> = {
  "3a": `<div class="sc-card" data-card="tag" onClick="#0E8C8C" style="background:#EAF6D3;padding:36px 40px 30px;display:flex;flex-direction:column;align-items:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="width:110px;height:70px;border:3px solid #9C8F78;border-bottom:0;border-radius:60px 60px 0 0;margin-bottom:-30px;position:relative;z-index:0"></div>
  <div style="width:280px;background:#C9A57A;border-radius:22px 22px 18px 18px;padding:30px 22px 22px;position:relative;box-shadow:0 18px 44px rgba(16,24,32,.18);color:#3B2A14;display:flex;flex-direction:column;flex:1;box-sizing:border-box;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 2px,transparent 2px 6px)">
    <div style="width:26px;height:26px;border-radius:50%;background:#EAF6D3;border:5px solid #8B6A3E;position:absolute;left:50%;top:14px;transform:translateX(-50%);box-sizing:border-box"></div>
    <div style="font:800 10px 'Sora',sans-serif;letter-spacing:.24em;text-transform:uppercase;text-align:center;margin-top:24px;color:#6B4E24">DECIDED</div>
    <div style="font:800 32px/1 'Sora',sans-serif;letter-spacing:-.04em;text-align:center;margin-top:12px;text-wrap:balance">Saturday Night Out</div>
    <div style="margin-top:22px;display:flex;flex-direction:column;gap:12px;font:600 12px 'DM Sans',sans-serif">
      <div><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#6B4E24">Name</div><div style="border-bottom:1.5px solid #6B4E24;padding:4px 0;font:700 15px 'Caveat',cursive;font-size:22px">Jake & Sarah</div></div>
      <div><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#6B4E24">Destination</div><div style="border-bottom:1.5px solid #6B4E24;padding:4px 0;font:500 22px 'Caveat',cursive">Jazz at Blue Room</div></div>
      <div><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#6B4E24">Address</div><div style="border-bottom:1.5px solid #6B4E24;padding:4px 0;font:500 22px 'Caveat',cursive">2051 Welton St, Denver CO</div></div>
      <div><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#6B4E24">Departs</div><div style="border-bottom:1.5px solid #6B4E24;padding:4px 0;font:500 22px 'Caveat',cursive">Saturday, Oct 4 · 8:00 PM</div></div>
      <div><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#6B4E24">Party</div><div style="border-bottom:1.5px solid #6B4E24;padding:4px 0;font:500 22px 'Caveat',cursive">Locked In ✓</div></div>
    </div>
    <div style="margin-top:auto;font:500 18px/1.25 'Caveat',cursive">“It's happening 🎉” — Jo</div>
    <div style="height:44px;margin-top:12px;border-radius:10px;background:#3B2A14;color:#EAF6D3;font:800 12px 'Sora',sans-serif;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;justify-content:center">View Plan →</div>
  </div>
</div>`,
  "3b": `<div class="sc-card" data-card="tape" onClick="#0E8C8C" style="background:#FF8A5B;padding:34px 26px 26px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="font:700 12px 'Sora',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4A1F0E">Jake & Sarah · mixtape vol. 27</div>
  <div style="margin-top:18px;background:#1B1F24;border-radius:14px;padding:16px;box-shadow:0 18px 44px rgba(16,24,32,.25)">
    <div style="background:#F6F1E7;border-radius:6px;padding:10px 12px"><div style="font:700 26px/1.1 'Caveat',cursive;color:#101820;border-bottom:1.5px solid #101820;padding-bottom:4px">Saturday Night Out</div><div style="display:flex;justify-content:space-between;font:500 16px 'Caveat',cursive;color:#5D6B76;margin-top:4px"><span>SIDE A · It's a Match!</span><span>Saturday, Oct 4 · 8:00 PM</span></div></div>
    <div style="margin:14px 22px 0;height:70px;border-radius:40px;background:#2A3641;display:flex;align-items:center;justify-content:space-between;padding:0 18px"><div style="width:44px;height:44px;border-radius:50%;background:#F6F1E7;border:12px solid #93A3AF;box-sizing:border-box"></div><div style="flex:1;height:22px;margin:0 12px;background:repeating-linear-gradient(90deg,#0B0F14 0 3px,#22282F 3px 6px)"></div><div style="width:44px;height:44px;border-radius:50%;background:#F6F1E7;border:12px solid #93A3AF;box-sizing:border-box"></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:12px;padding:0 6px"><span style="width:8px;height:8px;border-radius:50%;background:#93A3AF"></span><span style="font:700 9px 'Sora',sans-serif;letter-spacing:.2em;color:#93A3AF">C-90 · TOGETHER PLANS</span><span style="width:8px;height:8px;border-radius:50%;background:#93A3AF"></span></div>
  </div>
  <div style="margin-top:22px;font:500 20px/1.55 'Caveat',cursive;color:#4A1F0E"><div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1.5px dashed rgba(74,31,14,.4)"><span>1. Jazz at Blue Room</span><span>Dinner or drinks?</span></div><div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1.5px dashed rgba(74,31,14,.4)"><span>2. Dinner at Nobu</span><span>Jazz or comedy?</span></div><div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1.5px dashed rgba(74,31,14,.4)"><span>3. Comedy Works</span><span>Stay out?</span></div></div>
  <div style="font:800 20px/1.2 'Sora',sans-serif;letter-spacing:-.03em;margin-top:18px;color:#101820">Jazz at Blue Room</div>
  <div style="font-size:13px;color:#4A1F0E;margin-top:3px">2051 Welton St, Denver CO · Locked In ✓</div>
  <div style="margin-top:auto;font:500 20px/1.25 'Caveat',cursive;color:#4A1F0E">“It's happening 🎉” — Jo</div>
  <div style="height:50px;margin-top:12px;border-radius:12px;background:#1B1F24;color:#FF8A5B;font:800 13px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;display:flex;align-items:center;justify-content:center">▶ View Plan →</div>
</div>`,
  "3c": `<div class="sc-card" data-card="trading" onClick="#0E8C8C" style="background:#2B1B4D;padding:22px;display:flex;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="flex:1;border-radius:18px;background:#F6F1E7;border:8px solid #E39B12;box-shadow:inset 0 0 0 3px #2B1B4D;display:flex;flex-direction:column;padding:14px;box-sizing:border-box;color:#101820">
    <div style="display:flex;justify-content:space-between;align-items:center;font:800 11px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase"><span>Jake & Sarah</span><span style="padding:4px 8px;border-radius:6px;background:#2B1B4D;color:#F7D98A">★★★★★</span></div>
    <div style="margin-top:10px;height:210px;border-radius:10px;overflow:hidden;border:3px solid #2B1B4D;background:url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80) center/cover;position:relative"><span style="position:absolute;left:10px;bottom:10px;padding:5px 10px;background:#F7D98A;color:#2B1B4D;font:800 11px 'Sora',sans-serif;letter-spacing:.1em;text-transform:uppercase">It's a Match!</span></div>
    <div style="font:800 26px/1 'Sora',sans-serif;letter-spacing:-.04em;margin-top:12px;text-transform:uppercase">Saturday Night Out</div>
    <div style="font:700 13px 'DM Sans',sans-serif;color:#5D6B76;margin-top:2px">Jazz at Blue Room</div>
    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font:600 11px 'DM Sans',sans-serif"><div style="display:flex;justify-content:space-between;border-bottom:1px solid #DDD6C6;padding-bottom:3px"><span style="color:#5D6B76">DATE</span><span>SEP 27</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid #DDD6C6;padding-bottom:3px"><span style="color:#5D6B76">TIME</span><span>2:00 PM</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid #DDD6C6;padding-bottom:3px"><span style="color:#5D6B76">HYPE</span><span>98</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid #DDD6C6;padding-bottom:3px"><span style="color:#5D6B76">PARTY</span><span>Locked In ✓</span></div></div>
    <div style="font-size:11px;color:#5D6B76;margin-top:8px">2051 Welton St, Denver CO</div>
    <div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#EAE3D3;font:italic 500 11px/1.4 'DM Sans',sans-serif">Special move — “It's happening 🎉”</div>
    <div style="margin-top:auto;display:flex;align-items:center;gap:8px"><div style="display:flex;padding-left:6px"><span style="width:22px;height:22px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 9px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #F6F1E7;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><div style="margin-left:auto;height:38px;padding:0 14px;border-radius:8px;background:#2B1B4D;color:#F7D98A;font:800 11px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center">View Plan →</div></div>
  </div>
</div>`,
  "3d": `<div class="sc-card" data-card="formal" onClick="#0E8C8C" style="background:#FBF8F2;color:#101820;padding:30px;display:flex;flex-direction:column;align-items:center;text-align:center;font-family:Georgia,'Times New Roman',serif;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="position:absolute;inset:14px;border:1px solid #C9BFA8"></div><div style="position:absolute;inset:20px;border:1px solid #C9BFA8"></div>
  <div style="width:64px;height:64px;border-radius:50%;border:1.5px solid #0E8C8C;display:flex;align-items:center;justify-content:center;font:400 26px Georgia,serif;color:#0E8C8C;margin-top:14px;position:relative">SC</div>
  <div style="font:400 11px Georgia,serif;letter-spacing:.3em;text-transform:uppercase;color:#5D6B76;margin-top:22px;position:relative">Jake & Sarah</div>
  <div style="font:italic 400 15px/1.5 Georgia,serif;color:#5D6B76;margin-top:22px;position:relative;max-width:240px">Jake & Sarah · Saturday, October 4th, 2026</div>
  <div style="font:400 40px/1.05 Georgia,serif;letter-spacing:-.01em;margin-top:12px;position:relative;text-wrap:balance">Saturday Night Out</div>
  <div style="width:40px;height:1px;background:#0E8C8C;margin-top:20px;position:relative"></div>
  <div style="font:italic 400 18px/1.35 Georgia,serif;margin-top:18px;position:relative">Jazz at Blue Room</div>
  <div style="font:400 13px/1.7 Georgia,serif;color:#5D6B76;margin-top:10px;position:relative">2051 Welton St, Denver CO<br>Sunday, the twenty-seventh of September<br>at two o'clock in the afternoon</div>
  <div style="font:400 10px Georgia,serif;letter-spacing:.24em;text-transform:uppercase;color:#5D6B76;margin-top:20px;position:relative">Locked In ✓</div>
  <div style="margin-top:auto;font:italic 400 13px/1.45 Georgia,serif;color:#5D6B76;position:relative">“It's happening 🎉” — Jo</div>
  <div style="width:100%;height:46px;margin-top:14px;border:1px solid #101820;font:400 11px Georgia,serif;letter-spacing:.26em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;position:relative;box-sizing:border-box">View Plan →</div>
</div>`,
  "3e": `<div class="sc-card" data-card="passport" onClick="#0E8C8C" style="background:#EFE9DA;color:#1E2A3A;padding:26px 24px 24px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px;background-image:repeating-linear-gradient(45deg,rgba(30,42,58,.04) 0 1px,transparent 1px 9px)">
  <div style="display:flex;justify-content:space-between;font:700 10px 'Sora',sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#5D6B76"><span>DateMeUp · Passport</span><span>P. 27</span></div>
  <div style="display:flex;gap:14px;margin-top:22px"><div style="width:96px;height:120px;border:2px solid #1E2A3A;background:url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80) center/cover;filter:grayscale(1) contrast(1.1)"></div><div style="flex:1;font:600 11px/1.5 'DM Sans',sans-serif"><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.16em;color:#5D6B76">HOLDER</div><div style="font:700 14px 'Sora',sans-serif">Jake & Sarah</div><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.16em;color:#5D6B76;margin-top:8px">EVENT</div><div>Saturday Night Out</div><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.16em;color:#5D6B76;margin-top:8px">DATE OF ENTRY</div><div>27 SEP 2026 · 14:00</div></div></div>
  <div style="position:relative;margin-top:22px;height:150px">
    <div style="position:absolute;left:10px;top:6px;width:150px;height:150px;border-radius:50%;border:4px double #D63A3A;color:#D63A3A;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font:800 11px/1.25 'Sora',sans-serif;letter-spacing:.14em;text-transform:uppercase;transform:rotate(-14deg);opacity:.85;padding:14px;box-sizing:border-box"><span>DENVER</span><span style="font-size:20px;letter-spacing:0;margin:6px 0">CO</span><span>SEP 27 · SF</span></div>
    <div style="position:absolute;right:0;top:40px;width:120px;height:80px;border:3px solid #0E8C8C;color:#0E8C8C;display:flex;flex-direction:column;align-items:center;justify-content:center;font:800 10px/1.3 'Sora',sans-serif;letter-spacing:.14em;text-transform:uppercase;transform:rotate(8deg);opacity:.85;text-align:center"><span>Admitted</span><span style="font-size:14px">Locked In ✓</span><span>Mission Cliffs</span></div>
  </div>
  <div style="font:800 22px/1.15 'Sora',sans-serif;letter-spacing:-.03em;margin-top:6px">Jazz at Blue Room</div>
  <div style="font-size:13px;color:#5D6B76;margin-top:3px">2051 Welton St, Denver CO</div>
  <div style="margin-top:auto;font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#5D6B76">Remarks: “It's happening 🎉” — Jo</div>
  <div style="margin-top:10px;font:500 12px/1.4 ui-monospace,Menlo,monospace;color:#1E2A3A;letter-spacing:.06em;word-break:break-all">P&lt;DTNSUNDAY&lt;&lt;CREW&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>0927&lt;&lt;1400&lt;&lt;6PAX&lt;&lt;VIEW PLAN&lt;&lt;&lt;&lt;&lt;</div>
</div>`,
  "3f": `<div class="sc-card" data-card="bento" onClick="#0E8C8C" style="background:#F4F6F8;padding:18px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 110px 110px 1fr auto;gap:10px;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;padding:4px 6px"><span style="font:700 12px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Jake & Sarah</span><span style="padding:5px 10px;border-radius:999px;background:#7CB518;color:#101820;font:800 10px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase">It's a Match!</span></div>
  <div style="grid-column:1/-1;background:#0E8C8C;color:#fff;border-radius:22px;padding:18px 20px;display:flex;flex-direction:column;justify-content:flex-end"><div style="font:800 34px/1 'Sora',sans-serif;letter-spacing:-.04em">Saturday Night Out</div></div>
  <div style="background:#fff;border-radius:22px;padding:16px;display:flex;flex-direction:column;justify-content:space-between"><div style="font:700 10px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">When</div><div><div style="font:800 40px/1 'Sora',sans-serif;letter-spacing:-.05em">27</div><div style="font:600 12px 'DM Sans',sans-serif;color:#5D6B76">Sun Sep · 2:00 PM</div></div></div>
  <div style="background:#101820;color:#fff;border-radius:22px;padding:16px;display:flex;flex-direction:column;justify-content:space-between"><div style="font:700 10px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#93A3AF">Who</div><div><div style="display:flex;padding-left:6px"><span style="width:24px;height:24px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 9px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #101820;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><div style="font:600 12px 'DM Sans',sans-serif;margin-top:6px">Locked In ✓</div></div></div>
  <div style="grid-column:1/-1;background:#fff;border-radius:22px;padding:16px 18px;display:flex;flex-direction:column"><div style="font:700 10px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">What</div><div style="font:800 20px/1.15 'Sora',sans-serif;letter-spacing:-.03em;margin-top:6px">Jazz at Blue Room</div><div style="font-size:13px;color:#5D6B76;margin-top:3px">2051 Welton St, Denver CO</div><div style="margin-top:auto;padding:10px 12px;border-radius:14px;background:#EAF6D3;font:italic 500 12px/1.4 'DM Sans',sans-serif">“It's happening 🎉” — Jo</div></div>
  <div style="grid-column:1/-1;height:52px;border-radius:22px;background:#101820;color:#fff;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div>
</div>`,
  "3g": `<div class="sc-card" data-card="sticky" onClick="#0E8C8C" style="background:#8FA3AD;padding:26px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px;background-image:linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px);background-size:24px 24px">
  <div style="font:700 12px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fff">Jake & Sarah · the fridge</div>
  <div style="position:relative;flex:1;margin-top:10px">
    <div style="position:absolute;left:0;top:10px;width:200px;height:200px;background:#FFE9A8;padding:18px;box-sizing:border-box;transform:rotate(-4deg);box-shadow:0 12px 28px rgba(16,24,32,.2)"><span style="position:absolute;top:-8px;left:70px;width:60px;height:18px;background:rgba(255,255,255,.55)"></span><div style="font:700 15px 'Caveat',cursive;color:#8B6A00">It's a Match!!</div><div style="font:700 40px/1 'Caveat',cursive;margin-top:6px">Saturday Night Out</div><div style="font:500 20px/1.2 'Caveat',cursive;margin-top:10px">Saturday, Oct 4 · 8:00 PM</div></div>
    <div style="position:absolute;right:0;top:150px;width:180px;height:180px;background:#D9F1F0;padding:16px;box-sizing:border-box;transform:rotate(5deg);box-shadow:0 12px 28px rgba(16,24,32,.2)"><span style="position:absolute;top:-8px;left:60px;width:60px;height:18px;background:rgba(255,255,255,.55)"></span><div style="font:700 24px/1.1 'Caveat',cursive;color:#086B6B">Jazz at Blue Room</div><div style="font:500 17px/1.25 'Caveat',cursive;margin-top:8px">2051 Welton St, Denver CO</div><div style="font:700 17px 'Caveat',cursive;margin-top:8px;color:#086B6B">Locked In ✓</div></div>
    <div style="position:absolute;left:10px;top:300px;width:170px;height:150px;background:#EAF6D3;padding:16px;box-sizing:border-box;transform:rotate(2deg);box-shadow:0 12px 28px rgba(16,24,32,.2)"><span style="position:absolute;top:-8px;left:56px;width:60px;height:18px;background:rgba(255,255,255,.55)"></span><div style="font:500 19px/1.25 'Caveat',cursive">“It's happening 🎉”</div><div style="font:700 20px 'Caveat',cursive;margin-top:8px">— Jo</div></div>
    <div style="position:absolute;right:4px;top:478px;display:flex;padding-left:6px;transform:rotate(-6deg)"><span style="width:30px;height:30px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 11px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:3px solid #fff;margin-left:-8px;opacity:{{ p.op }}">{{ p.i }}</span></div>
  </div>
  <div style="height:50px;border-radius:14px;background:#101820;color:#fff;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;transform:rotate(-1deg);box-shadow:0 12px 28px rgba(16,24,32,.2)">View Plan →</div>
</div>`,
  "3h": `<div class="sc-card" data-card="bingo" onClick="#0E8C8C" style="background:#fff;padding:28px 24px 24px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:700 12px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Jake & Sarah</span><span style="padding:5px 10px;border-radius:12px 6px 14px 6px;background:#E39B12;color:#101820;font:800 10px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(4deg)">It's a Match!</span></div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:16px">
    <div style="height:40px;background:#0E8C8C;color:#fff;font:800 22px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border-radius:8px 0 0 0">S</div><div style="height:40px;background:#0E8C8C;color:#fff;font:800 22px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">U</div><div style="height:40px;background:#0E8C8C;color:#fff;font:800 22px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">N</div><div style="height:40px;background:#0E8C8C;color:#fff;font:800 22px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">D</div><div style="height:40px;background:#0E8C8C;color:#fff;font:800 22px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border-radius:0 8px 0 0">A</div>
    <div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Ramen</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Late show</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px;background:#EAF6D3">Dim sum</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Karaoke</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Picnic</div>
    <div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Jazz</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px;background:#EAF6D3">SFMOMA</div><div style="height:56px;border:2px solid #0E8C8C;background:#0E8C8C;color:#fff;font:800 10px/1.15 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px;border-radius:50%">🎉</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Bowling</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Hike</div>
    <div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Brunch</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Arcade</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px;background:#EAF6D3">Tacos</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Trivia</div><div style="height:56px;border:1.5px solid #DDE3E8;font:600 9px/1.2 'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">Beach</div>
  </div>
  <div style="font:800 30px/1 'Sora',sans-serif;letter-spacing:-.04em;margin-top:18px">Saturday Night Out</div>
  <div style="font:700 15px/1.25 'Sora',sans-serif;margin-top:8px;color:#086B6B">Jazz at Blue Room</div>
  <div style="font-size:13px;color:#5D6B76;margin-top:3px">2051 Welton St, Denver CO · Saturday, Oct 4 · 8:00 PM</div>
  <div style="display:flex;align-items:center;gap:10px;margin-top:12px"><div style="display:flex;padding-left:6px"><span style="width:24px;height:24px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 9px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="font-size:12px;color:#5D6B76">Locked In ✓</span></div>
  <div style="margin-top:auto;font:italic 400 12px/1.4 'DM Sans',sans-serif;color:#5D6B76">“It's happening 🎉” — Jo</div>
  <div style="height:48px;margin-top:10px;border-radius:26px 18px 26px 18px;background:#0E8C8C;color:#fff;font:700 14px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div>
</div>`,
  "3i": `<div class="sc-card" data-card="arcade" onClick="#0E8C8C" style="background:#12102A;color:#fff;padding:30px 26px 26px;display:flex;flex-direction:column;align-items:center;text-align:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:16px 16px">
  <div style="display:flex;justify-content:space-between;width:100%;font:800 11px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#F7D98A"><span>1UP JAKE & SARAH</span><span>HI 000927</span></div>
  <div style="font:800 13px ui-monospace,Menlo,monospace;letter-spacing:.2em;color:#A8E04B;margin-top:40px;animation:dn-neon 1.4s steps(1) infinite">🎉 PLAN UNLOCKED</div>
  <div style="font:800 44px/1 'Sora',sans-serif;letter-spacing:-.02em;text-transform:uppercase;margin-top:14px;text-shadow:4px 4px 0 #FF4FA3,8px 8px 0 #2FC4C1;text-wrap:balance">Saturday Night Out</div>
  <div style="display:flex;gap:6px;margin-top:26px"><span style="width:16px;height:16px;background:#FF4FA3"></span><span style="width:16px;height:16px;background:#FF4FA3"></span><span style="width:16px;height:16px;background:#FF4FA3"></span><span style="width:16px;height:16px;background:#FF4FA3;opacity:.3"></span><span style="width:16px;height:16px;background:#FF4FA3;opacity:.3"></span><span style="width:16px;height:16px;background:#FF4FA3;opacity:.3"></span></div>
  <div style="font:800 11px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#93A3AF;margin-top:8px">Locked In ✓</div>
  <div style="width:100%;margin-top:26px;border:4px solid #2FC4C1;padding:14px;box-shadow:6px 6px 0 #FF4FA3;text-align:left;font:700 12px/1.8 ui-monospace,Menlo,monospace"><div><span style="color:#F7D98A">STAGE </span>Jazz at Blue Room</div><div><span style="color:#F7D98A">MAP   </span>2051 Welton St, Denver CO</div><div><span style="color:#F7D98A">TIME  </span>SUN 27 · 14:00</div><div><span style="color:#F7D98A">ITEMS </span>Jazz Night · Nobu · Comedy</div></div>
  <div style="margin-top:auto;font:700 12px/1.5 ui-monospace,Menlo,monospace;color:#93A3AF">JO SAYS: “It's happening 🎉”</div>
  <div style="width:100%;height:50px;margin-top:12px;background:#A8E04B;color:#12102A;font:800 13px ui-monospace,Menlo,monospace;letter-spacing:.2em;display:flex;align-items:center;justify-content:center;box-shadow:5px 5px 0 #2FC4C1">▶ VIEW PLAN</div>
</div>`,
  "3j": `<div class="sc-card" data-card="tarot" onClick="#0E8C8C" style="background:#1D1A3A;color:#F1E3B8;padding:20px;display:flex;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="flex:1;border:2px solid #C9A85A;border-radius:14px;padding:14px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative"><div style="position:absolute;inset:6px;border:1px solid rgba(201,168,90,.5);border-radius:10px"></div>
    <div style="font:700 12px Georgia,serif;letter-spacing:.3em;color:#C9A85A;margin-top:10px">XXVII</div>
    <div style="width:210px;height:250px;margin-top:14px;border:1.5px solid #C9A85A;border-radius:110px 110px 12px 12px;background:radial-gradient(circle at 50% 35%,#3B3470,#1D1A3A 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden"><div style="width:90px;height:90px;border-radius:50%;background:#F1E3B8;box-shadow:0 0 30px rgba(241,227,184,.6)"></div><div style="width:150px;height:14px;border-radius:50%;background:rgba(201,168,90,.4);margin-top:40px"></div><div style="position:absolute;bottom:22px;display:flex;padding-left:6px"><span style="width:24px;height:24px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 9px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #1D1A3A;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="position:absolute;top:18px;left:22px;color:#C9A85A;font-size:14px">✦</span><span style="position:absolute;top:40px;right:26px;color:#C9A85A;font-size:10px">✦</span><span style="position:absolute;top:80px;left:40px;color:#C9A85A;font-size:8px">✦</span></div>
    <div style="font:400 30px/1 Georgia,serif;letter-spacing:.1em;text-transform:uppercase;margin-top:16px">The Matched</div>
    <div style="font:italic 400 13px/1.5 Georgia,serif;color:#C9A85A;margin-top:8px;max-width:240px">Two hearts aligned. The night was written.</div>
    <div style="font:400 14px/1.6 Georgia,serif;margin-top:10px">Jazz at Blue Room<br><span style="color:#C9A85A;font-size:12px">2051 Welton St, Denver CO · Saturday, Oct 4 · 8:00 PM</span></div>
    <div style="margin-top:auto;font:italic 400 12px/1.4 Georgia,serif;color:#C9A85A">“It's happening 🎉” — Jo</div>
    <div style="width:100%;height:44px;margin-top:10px;border:1.5px solid #C9A85A;color:#F1E3B8;font:400 11px Georgia,serif;letter-spacing:.26em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;box-sizing:border-box">View Plan →</div>
  </div>
</div>`,
  "3k": `<div class="sc-card" data-card="departures" onClick="#0E8C8C" style="background:#0F1519;color:#F7D98A;padding:30px 20px 24px;display:flex;flex-direction:column;font:700 12px ui-monospace,Menlo,monospace;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="display:flex;justify-content:space-between;letter-spacing:.2em;color:#93A3AF"><span>DEPARTURES</span><span>JAKE & SARAH</span></div>
  <div style="margin-top:18px;display:flex;flex-direction:column;gap:6px">
    <div style="display:grid;grid-template-columns:52px 1fr 70px;gap:6px;color:#93A3AF;letter-spacing:.1em;font-size:9px;padding:0 4px"><span>TIME</span><span>DESTINATION</span><span>STATUS</span></div>
    <div style="display:grid;grid-template-columns:52px 1fr 70px;gap:6px"><span style="background:#1B232B;padding:9px 6px;border-radius:3px;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641">14:00</span><span style="background:#1B232B;padding:9px 6px;border-radius:3px;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">JAZZ AT BLUE ROOM</span><span style="background:#1B232B;padding:9px 6px;border-radius:3px;color:#A8E04B;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641">Jazz at Blue Room</span></div>
    <div style="display:grid;grid-template-columns:52px 1fr 70px;gap:6px"><span style="background:#1B232B;padding:9px 6px;border-radius:3px;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641">18:00</span><span style="background:#1B232B;padding:9px 6px;border-radius:3px;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">DINNER AT NOBU</span><span style="background:#1B232B;padding:9px 6px;border-radius:3px;color:#93A3AF;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641">Dinner at Nobu</span></div>
    <div style="display:grid;grid-template-columns:52px 1fr 70px;gap:6px"><span style="background:#1B232B;padding:9px 6px;border-radius:3px;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641">12:30</span><span style="background:#1B232B;padding:9px 6px;border-radius:3px;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">COMEDY WORKS</span><span style="background:#1B232B;padding:9px 6px;border-radius:3px;color:#FF6B6B;box-shadow:inset 0 -1px 0 #0F1519,inset 0 1px 0 #2A3641">Comedy Works</span></div>
  </div>
  <div style="font:800 34px/1 'Sora',sans-serif;letter-spacing:-.03em;color:#fff;margin-top:30px;text-transform:uppercase">Saturday Night Out</div>
  <div style="margin-top:12px;color:#fff;line-height:1.8"><div><span style="color:#93A3AF">GATE   </span>JAZZ AT BLUE ROOM</div><div><span style="color:#93A3AF">ADDR   </span>2051 Welton St, Denver CO</div><div><span style="color:#93A3AF">DEPARTS</span> SUN 27 SEP · 14:00</div><div><span style="color:#93A3AF">PAX    </span>Locked In ✓</div></div>
  <div style="margin-top:auto;color:#93A3AF;font-weight:500;font-style:italic;line-height:1.5">CAPTAIN JO: “It's happening 🎉”</div>
  <div style="height:48px;margin-top:12px;background:#F7D98A;color:#0F1519;letter-spacing:.2em;display:flex;align-items:center;justify-content:center;border-radius:4px">VIEW PLAN</div>
</div>`,
  "3l": `<div class="sc-card" data-card="wanted" onClick="#0E8C8C" style="background:#E8D9B5;color:#3B2A14;padding:26px 24px 22px;display:flex;flex-direction:column;align-items:center;text-align:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px;background-image:radial-gradient(circle at 20% 30%,rgba(120,80,20,.12),transparent 40%),radial-gradient(circle at 80% 70%,rgba(120,80,20,.14),transparent 45%)">
  <div style="position:absolute;inset:12px;border:3px double #3B2A14"></div>
  <div style="font:800 58px/1 'Sora',sans-serif;letter-spacing:.06em;margin-top:14px;position:relative">WANTED</div>
  <div style="font:700 11px 'Sora',sans-serif;letter-spacing:.3em;text-transform:uppercase;margin-top:4px;position:relative">Planning the perfect date night</div>
  <div style="width:200px;height:170px;margin-top:16px;border:3px solid #3B2A14;background:url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80) center/cover;filter:sepia(.8) contrast(1.1);position:relative"></div>
  <div style="font:800 30px/1 'Sora',sans-serif;letter-spacing:-.03em;margin-top:14px;position:relative;text-transform:uppercase">JAKE & SARAH</div>
  <div style="font:700 13px 'DM Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase;margin-top:4px;position:relative;color:#6B4E24">last seen planning “Saturday Night Out”</div>
  <div style="font:800 18px/1.2 'Sora',sans-serif;margin-top:14px;position:relative">Jazz at Blue Room</div>
  <div style="font:600 12px/1.5 'DM Sans',sans-serif;position:relative;color:#6B4E24">2051 Welton St, Denver CO<br>Saturday, Oct 4 · 8:00 PM</div>
  <div style="display:flex;justify-content:center;padding-left:8px;margin-top:12px;position:relative"><span style="width:26px;height:26px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 10px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #E8D9B5;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div>
  <div style="font:800 22px/1 'Sora',sans-serif;letter-spacing:.06em;margin-top:14px;position:relative">REWARD: 🎉 Plan Unlocked</div>
  <div style="margin-top:auto;font:italic 500 12px/1.4 'DM Sans',sans-serif;position:relative;color:#6B4E24">Sheriff Jo: “It's happening 🎉”</div>
  <div style="width:100%;height:46px;margin-top:10px;background:#3B2A14;color:#E8D9B5;font:800 12px 'Sora',sans-serif;letter-spacing:.2em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;position:relative">View Plan →</div>
</div>`,
  "2a": `<div class="sc-card" data-card="boarding" onClick="#0E8C8C" style="background:#D9F1F0;padding:30px 24px;display:flex;align-items:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 14px 34px rgba(16,24,32,.12);display:flex;flex-direction:column">
    <div style="background:#0E8C8C;color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center"><span style="font:800 13px 'Sora',sans-serif;letter-spacing:.14em">TOGETHER PLANS AIR</span><span style="font:700 11px 'Sora',sans-serif;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.18)">It's a Match!</span></div>
    <div style="padding:20px 20px 16px">
      <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">From</div><div style="font:800 34px/1 'Sora',sans-serif;letter-spacing:-.04em;margin-top:4px">SOFA</div></div><div style="font-size:26px;color:#0E8C8C">✈</div><div style="flex:1;text-align:right"><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">To</div><div style="font:800 34px/1 'Sora',sans-serif;letter-spacing:-.04em;margin-top:4px">DATE NIGHT</div></div></div>
      <div style="font:700 15px/1.3 'Sora',sans-serif;margin-top:14px">Saturday Night Out · Jazz at Blue Room</div>
      <div style="font-size:13px;color:#5D6B76;margin-top:2px">2051 Welton St, Denver CO</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:18px">
        <div><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Passenger</div><div style="font:700 14px 'Sora',sans-serif;margin-top:3px">Jake & Sarah</div></div>
        <div><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Date</div><div style="font:700 14px 'Sora',sans-serif;margin-top:3px">27 SEP</div></div>
        <div><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Boarding</div><div style="font:700 14px 'Sora',sans-serif;margin-top:3px">2:00 PM</div></div>
        <div><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Gate</div><div style="font:700 14px 'Sora',sans-serif;margin-top:3px">SF</div></div>
        <div><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Seats</div><div style="font:700 14px 'Sora',sans-serif;margin-top:3px">6</div></div>
        <div><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Status</div><div style="font:700 14px 'Sora',sans-serif;margin-top:3px;color:#0E8C8C">Locked In ✓</div></div>
      </div>
      <div style="font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#5D6B76;margin-top:16px">“It's happening 🎉” — Jo</div>
    </div>
    <div style="position:relative;height:0;border-top:2px dashed #DDE3E8"><span style="position:absolute;left:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:#D9F1F0"></span><span style="position:absolute;right:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:#D9F1F0"></span></div>
    <div style="padding:16px 20px 20px;display:flex;align-items:center;gap:14px"><div style="flex:1;height:44px;background:repeating-linear-gradient(90deg,#101820 0 2px,transparent 2px 5px,#101820 5px 6px,transparent 6px 9px,#101820 9px 12px,transparent 12px 14px)"></div><div style="height:44px;padding:0 16px;border-radius:12px;background:#0E8C8C;color:#fff;font:700 13px 'Sora',sans-serif;display:flex;align-items:center">View Plan →</div></div>
  </div>
</div>`,
  "2b": `<div class="sc-card" data-card="swiss" onClick="#0E8C8C" style="background:#fff;padding:0;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:2px solid #101820;font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase"><div style="padding:16px 18px;border-right:2px solid #101820">Jake & Sarah</div><div style="padding:16px 18px;border-right:2px solid #101820">It's a Match!</div><div style="padding:16px 18px;color:#0E8C8C">№ 27</div></div>
  <div style="padding:26px 22px 0;flex:1"><div style="font:800 54px/.95 'Sora',sans-serif;letter-spacing:-.06em;text-wrap:balance">Saturday Night Out</div><div style="width:64px;height:64px;background:#7CB518;margin-top:22px"></div><div style="font:700 20px/1.2 'Sora',sans-serif;letter-spacing:-.02em;margin-top:22px">Jazz at Blue Room</div><div style="font-size:14px;color:#5D6B76;margin-top:4px;line-height:1.4">2051 Welton St, Denver CO<br>Saturday, Oct 4 · 8:00 PM</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #101820;font-size:12px;line-height:1.45"><div style="padding:14px 18px;border-right:2px solid #101820"><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Party</div><div style="display:flex;padding-left:6px;margin-top:8px"><span style="width:22px;height:22px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 9px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><div style="margin-top:6px">Locked In ✓</div></div><div style="padding:14px 18px"><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Note</div><div style="margin-top:8px;font-style:italic">“It's happening 🎉”</div></div></div>
  <div style="height:56px;background:#101820;color:#fff;font:700 14px 'Sora',sans-serif;display:flex;align-items:center;justify-content:space-between;padding:0 22px"><span>View Plan →</span><span>→</span></div>
</div>`,
  "2c": `<div class="sc-card" data-card="vinyl" onClick="#0E8C8C" style="background:#1B1F24;color:#fff;padding:32px 28px 28px;display:flex;flex-direction:column;align-items:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="align-self:stretch;display:flex;justify-content:space-between;font:700 11px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#93A3AF"><span>Jake & Sarah records</span><span style="color:#A8E04B">It's a Match!</span></div>
  <div style="width:270px;height:270px;border-radius:50%;margin-top:26px;background:repeating-radial-gradient(circle,#0B0F14 0 2px,#22282F 2px 4px);box-shadow:0 20px 50px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;position:relative"><div style="width:110px;height:110px;border-radius:50%;background:#7CB518;color:#101820;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px;box-sizing:border-box"><div style="font:800 10px 'Sora',sans-serif;letter-spacing:.1em">SIDE A</div><div style="font:800 13px/1.1 'Sora',sans-serif;margin-top:4px">Saturday Night Out</div><div style="width:8px;height:8px;border-radius:50%;background:#1B1F24;margin-top:6px"></div></div></div>
  <div style="align-self:stretch;margin-top:26px"><div style="font:800 28px/1 'Sora',sans-serif;letter-spacing:-.04em">Jazz at Blue Room</div><div style="font-size:13px;color:#93A3AF;margin-top:6px">2051 Welton St, Denver CO · Saturday, Oct 4 · 8:00 PM</div></div>
  <div style="align-self:stretch;margin-top:16px;font:500 12px/1.7 ui-monospace,Menlo,monospace;color:#DDE3E8"><div style="display:flex;justify-content:space-between;border-bottom:1px solid #2A3641"><span>A1 Jazz at Blue Room</span><span>Dinner or drinks?</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid #2A3641"><span>A2 Dinner at Nobu</span><span>Jazz or comedy?</span></div><div style="display:flex;justify-content:space-between"><span>A3 Comedy Works</span><span>Stay out?</span></div></div>
  <div style="align-self:stretch;margin-top:auto;display:flex;align-items:center;gap:12px"><div style="flex:1;font:italic 400 12px/1.4 'DM Sans',sans-serif;color:#93A3AF">“It's happening 🎉” — Jo</div><div style="height:46px;padding:0 18px;border-radius:999px;background:#A8E04B;color:#101820;font:800 13px 'Sora',sans-serif;display:flex;align-items:center;white-space:nowrap">▶ View Plan →</div></div>
</div>`,
  "2d": `<div class="sc-card" data-card="comic" onClick="#0E8C8C" style="background:radial-gradient(circle,#E39B12 1.6px,transparent 2px) 0 0/12px 12px,#FFE9A8;padding:22px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="flex:1;border:5px solid #101820;background:#fff;position:relative;display:flex;flex-direction:column;padding:22px 20px 20px;box-shadow:8px 8px 0 #101820">
    <div style="font:800 12px 'Sora',sans-serif;letter-spacing:.14em;text-transform:uppercase;background:#101820;color:#fff;align-self:flex-start;padding:5px 10px;transform:rotate(-2deg)">Jake & Sarah</div>
    <div style="position:relative;margin-top:22px;border:4px solid #101820;border-radius:30px;padding:20px 18px;background:#fff"><div style="font:800 31px/1 'Sora',sans-serif;letter-spacing:-.04em;text-transform:uppercase;text-wrap:balance;padding-right:70px">Saturday Night Out!</div><div style="font:700 16px/1.25 'Sora',sans-serif;margin-top:10px">Jazz at Blue Room</div><div style="font-size:13px;color:#5D6B76;margin-top:4px">2051 Welton St, Denver CO · Saturday, Oct 4 · 8:00 PM</div><span style="position:absolute;left:40px;bottom:-22px;width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:24px solid #101820"></span><span style="position:absolute;left:44px;bottom:-14px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:18px solid #fff"></span></div>
    <div style="position:absolute;right:-6px;top:30px;width:96px;height:96px;display:flex;align-items:center;justify-content:center;transform:rotate(12deg);z-index:2"><span style="position:absolute;inset:0;background:#0E8C8C;transform:rotate(0deg);clip-path:polygon(50% 0,61% 20%,82% 10%,80% 32%,100% 40%,84% 55%,96% 76%,74% 74%,68% 96%,50% 82%,32% 96%,26% 74%,4% 76%,16% 55%,0 40%,20% 32%,18% 10%,39% 20%)"></span><span style="position:relative;color:#fff;font:800 13px/1.05 'Sora',sans-serif;text-transform:uppercase;text-align:center;letter-spacing:.02em;padding:0 14px">It's a Match!</span></div>
    <div style="margin-top:auto"><div style="display:flex;align-items:center;gap:10px"><div style="display:flex;padding-left:6px"><span style="width:26px;height:26px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 10px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #101820;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="font:700 13px 'Sora',sans-serif">Locked In ✓</span></div><div style="margin-top:12px;border:3px solid #101820;background:#FFE9A8;padding:8px 12px;font:italic 500 13px/1.35 'DM Sans',sans-serif">Meanwhile, Jo: “It's happening 🎉”</div><div style="height:48px;margin-top:12px;background:#101820;color:#fff;font:800 14px 'Sora',sans-serif;letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;justify-content:center">View Plan → →</div></div>
  </div>
</div>`,
  "2e": `<div class="sc-card" data-card="chalk" onClick="#0E8C8C" style="background:#8B5A2B;padding:14px;display:flex;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="flex:1;background:radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.06),transparent 50%),#22423A;color:#F4F1E6;padding:26px 24px 22px;display:flex;flex-direction:column;font-family:'Caveat',cursive;box-shadow:inset 0 0 40px rgba(0,0,0,.35)">
    <div style="font:700 18px 'Caveat',cursive;letter-spacing:.08em;text-transform:uppercase;text-align:center;color:#CDE9E2">☆ Jake & Sarah ☆</div>
    <div style="font:700 26px/1 'Caveat',cursive;text-align:center;margin-top:10px;color:#F7D98A">Tonight's Special</div>
    <div style="font:700 56px/1 'Caveat',cursive;text-align:center;margin-top:8px;text-wrap:balance">Saturday Night Out</div>
    <div style="height:2px;background:rgba(244,241,230,.5);margin:14px 30px 0;border-radius:2px"></div>
    <div style="margin-top:16px;font:500 24px/1.45 'Caveat',cursive"><div style="display:flex;justify-content:space-between;gap:10px"><span>Jazz at Blue Room</span><span style="color:#A8E04B">Dinner or drinks?</span></div><div style="display:flex;justify-content:space-between;gap:10px"><span>Dinner at Nobu</span><span style="color:#A8E04B">Jazz or comedy?</span></div><div style="display:flex;justify-content:space-between;gap:10px"><span>Comedy Works</span><span style="color:#A8E04B">Stay out?</span></div></div>
    <div style="height:2px;background:rgba(244,241,230,.5);margin:14px 30px 0;border-radius:2px"></div>
    <div style="font:700 28px/1.15 'Caveat',cursive;text-align:center;margin-top:16px;color:#F7D98A">Jazz at Blue Room</div>
    <div style="font:500 20px/1.3 'Caveat',cursive;text-align:center;color:#CDE9E2">2051 Welton St, Denver CO<br>Saturday, Oct 4 · 8:00 PM · Locked In ✓</div>
    <div style="margin-top:auto;font:500 21px/1.3 'Caveat',cursive;text-align:center">“It's happening 🎉” — Jo</div>
    <div style="margin:14px 20px 0;height:46px;border:3px solid #F4F1E6;border-radius:8px;font:700 22px 'Caveat',cursive;display:flex;align-items:center;justify-content:center;transform:rotate(-1deg)">View Plan →</div>
  </div>
</div>`,
  "2f": `<div class="sc-card" data-card="score" onClick="#0E8C8C" style="background:#0D1B2A;color:#fff;padding:30px 24px 26px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="display:flex;justify-content:space-between;font:700 11px 'Sora',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#93A3AF"><span>Jake & Sarah</span><span style="color:#FF6B6B">● FINAL</span></div>
  <div style="font:800 30px/1 'Sora',sans-serif;letter-spacing:-.03em;margin-top:22px;text-transform:uppercase">Saturday Night Out</div>
  <div style="margin-top:20px;border:2px solid #2A3641;border-radius:12px;padding:16px;background:#111F30">
    <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><div style="font:700 10px 'Sora',sans-serif;letter-spacing:.14em;color:#93A3AF">HOME</div><div style="font:700 14px/1.2 'Sora',sans-serif;margin-top:4px">Jazz at Blue Room</div></div><div style="font:800 54px/1 ui-monospace,Menlo,monospace;color:#A8E04B;text-shadow:0 0 12px rgba(168,224,75,.7)">Dinner or drinks?</div></div>
    <div style="height:1px;background:#2A3641;margin:14px 0"></div>
    <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><div style="font:700 10px 'Sora',sans-serif;letter-spacing:.14em;color:#93A3AF">AWAY</div><div style="font:700 14px/1.2 'Sora',sans-serif;margin-top:4px">Dinner at Nobu</div></div><div style="font:800 54px/1 ui-monospace,Menlo,monospace;color:#F7D98A;text-shadow:0 0 12px rgba(247,217,138,.6)">Jazz or comedy?</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px;text-align:center"><div style="padding:10px 6px;border-radius:10px;background:#111F30"><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.14em;color:#93A3AF">DATE</div><div style="font:800 15px ui-monospace,Menlo,monospace;margin-top:4px">SEP 27</div></div><div style="padding:10px 6px;border-radius:10px;background:#111F30"><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.14em;color:#93A3AF">KICKOFF</div><div style="font:800 15px ui-monospace,Menlo,monospace;margin-top:4px">2:00 PM</div></div><div style="padding:10px 6px;border-radius:10px;background:#111F30"><div style="font:700 9px 'Sora',sans-serif;letter-spacing:.14em;color:#93A3AF">ROSTER</div><div style="font:800 15px ui-monospace,Menlo,monospace;margin-top:4px">Locked In ✓</div></div></div>
  <div style="font:700 16px/1.25 'Sora',sans-serif;margin-top:18px;color:#A8E04B">Jazz at Blue Room</div><div style="font-size:13px;color:#93A3AF;margin-top:3px">2051 Welton St, Denver CO</div>
  <div style="margin-top:auto;font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#93A3AF">Coach Jo: “It's happening 🎉”</div>
  <div style="height:50px;margin-top:14px;border-radius:10px;background:#A8E04B;color:#0D1B2A;font:800 14px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center">View Plan →</div>
</div>`,
  "2g": `<div class="sc-card" data-card="news" onClick="#0E8C8C" style="background:#F3EEE3;color:#101820;padding:26px 24px 22px;display:flex;flex-direction:column;font-family:Georgia,'Times New Roman',serif;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="text-align:center;font:700 30px/1 Georgia,serif;letter-spacing:-.01em;border-bottom:3px double #101820;padding-bottom:10px">The Jake & Sarah Times</div>
  <div style="display:flex;justify-content:space-between;font:700 9px 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:6px 0;border-bottom:1px solid #101820"><span>Vol. 1 · No. 27</span><span>Saturday, Oct 4 · 8:00 PM</span><span>Free</span></div>
  <div style="font:700 38px/1.02 Georgia,serif;margin-top:16px;letter-spacing:-.02em;text-wrap:balance">COUPLE DECIDES ON SATURDAY NIGHT PLANS</div>
  <div style="font:italic 400 14px/1.35 Georgia,serif;color:#5D6B76;margin-top:8px">Jazz concert and dinner locked in after record 4-minute vote.</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;border-top:1px solid #101820;padding-top:12px;font:400 12px/1.5 Georgia,serif">
    <div><b style="font:700 9px 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase">San Francisco —</b> Jazz at Blue Room at 2051 Welton St, Denver CO. Doors at 2:00 PM. Organiser Jo, reached by text, said: “It's happening 🎉”</div>
    <div><div style="height:96px;background:repeating-linear-gradient(135deg,#DDD6C6 0 8px,#EDE7D9 8px 16px);display:flex;align-items:center;justify-content:center;font:500 9px ui-monospace,Menlo,monospace;color:#5D6B76">venue photo</div><div style="font:italic 400 10px/1.3 Georgia,serif;color:#5D6B76;margin-top:4px">Pictured: the crew, Locked In ✓.</div></div>
  </div>
  <div style="margin-top:auto;border-top:3px double #101820;padding-top:10px;display:flex;align-items:center;gap:10px"><div style="display:flex;padding-left:6px"><span style="width:24px;height:24px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 9px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #F3EEE3;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><div style="margin-left:auto;height:40px;padding:0 16px;background:#101820;color:#F3EEE3;font:700 12px 'Sora',sans-serif;display:flex;align-items:center">View Plan →</div></div>
</div>`,
  "2h": `<div class="sc-card" data-card="confetti" onClick="#0E8C8C" style="background:#fff;padding:30px;display:flex;flex-direction:column;align-items:center;text-align:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <span style="position:absolute;left:30px;top:60px;width:14px;height:14px;border-radius:50%;background:#0E8C8C"></span><span style="position:absolute;left:300px;top:90px;width:16px;height:16px;background:#7CB518;transform:rotate(20deg)"></span><span style="position:absolute;left:60px;top:200px;width:10px;height:22px;background:#E39B12;transform:rotate(-30deg);border-radius:3px"></span><span style="position:absolute;left:320px;top:260px;width:12px;height:12px;border-radius:50%;background:#E39B12"></span><span style="position:absolute;left:24px;top:400px;width:18px;height:8px;background:#0E8C8C;transform:rotate(35deg);border-radius:3px"></span><span style="position:absolute;left:310px;top:470px;width:14px;height:14px;background:#0E8C8C;transform:rotate(45deg)"></span><span style="position:absolute;left:150px;top:36px;width:8px;height:18px;background:#7CB518;transform:rotate(15deg);border-radius:3px"></span><span style="position:absolute;left:270px;top:560px;width:12px;height:12px;border-radius:50%;background:#7CB518"></span><span style="position:absolute;left:44px;top:560px;width:12px;height:24px;background:#E39B12;transform:rotate(50deg);border-radius:3px"></span>
  <div style="font:700 12px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#5D6B76;margin-top:20px">Jake & Sarah</div>
  <div style="font:500 30px/1 'Caveat',cursive;color:#0E8C8C;margin-top:40px">It's a Match!</div>
  <div style="font:800 50px/.98 'Sora',sans-serif;letter-spacing:-.05em;margin-top:8px;text-wrap:balance">Saturday Night Out</div>
  <div style="width:56px;height:4px;border-radius:2px;background:#7CB518;margin-top:22px"></div>
  <div style="font:700 19px/1.25 'Sora',sans-serif;letter-spacing:-.02em;margin-top:22px">Jazz at Blue Room</div>
  <div style="font-size:14px;color:#5D6B76;margin-top:6px;line-height:1.5">2051 Welton St, Denver CO<br>Saturday, Oct 4 · 8:00 PM</div>
  <div style="display:flex;justify-content:center;padding-left:8px;margin-top:20px"><span style="width:30px;height:30px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 11px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:3px solid #fff;margin-left:-8px;opacity:{{ p.op }}">{{ p.i }}</span></div>
  <div style="font-size:12px;color:#5D6B76;margin-top:6px">Locked In ✓</div>
  <div style="margin-top:auto;font:500 21px/1.25 'Caveat',cursive;color:#101820">“It's happening 🎉” — Jo</div>
  <div style="width:100%;height:52px;margin-top:14px;border-radius:999px;background:#0E8C8C;color:#fff;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div>
</div>`,
  "2i": `<div class="sc-card" data-card="weather" onClick="#0E8C8C" style="background:linear-gradient(180deg,#BFE3F4,#E9F5FB 60%,#fff);color:#101820;padding:30px 26px 26px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="display:flex;justify-content:space-between;font:700 12px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#3C5A6B"><span>Jake & Sarah</span><span>Sun, Sep 27</span></div>
  <div style="display:flex;align-items:center;gap:18px;margin-top:26px"><div style="width:96px;height:96px;border-radius:50%;background:#F7D98A;box-shadow:0 0 0 14px rgba(247,217,138,.35),0 0 0 28px rgba(247,217,138,.15);flex:none"></div><div><div style="font:800 64px/1 'Sora',sans-serif;letter-spacing:-.06em">100%</div><div style="font:700 13px 'DM Sans',sans-serif;color:#3C5A6B;margin-top:2px">Perfect Night</div></div></div>
  <div style="font:800 34px/1 'Sora',sans-serif;letter-spacing:-.04em;margin-top:30px">Saturday Night Out</div>
  <div style="font:700 17px/1.25 'Sora',sans-serif;margin-top:10px">Jazz at Blue Room</div>
  <div style="font-size:13px;color:#3C5A6B;margin-top:3px">2051 Welton St, Denver CO · high of good times</div>
  <div style="margin-top:22px;background:rgba(255,255,255,.7);border-radius:20px;padding:14px 16px"><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#3C5A6B">Hourly</div><div style="display:flex;justify-content:space-between;margin-top:10px;text-align:center;font:600 11px 'DM Sans',sans-serif"><div>1 PM<br><span style="font-size:18px">🚗</span><br>Leave</div><div>2 PM<br><span style="font-size:18px">🧗</span><br>Start</div><div>4 PM<br><span style="font-size:18px">🌮</span><br>Tacos</div><div>6 PM<br><span style="font-size:18px">🌇</span><br>Home</div></div></div>
  <div style="display:flex;align-items:center;gap:10px;margin-top:16px"><div style="display:flex;padding-left:6px"><span style="width:26px;height:26px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 10px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="font-size:13px;color:#3C5A6B">Locked In ✓</span></div>
  <div style="margin-top:auto;font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#3C5A6B">“It's happening 🎉” — Jo</div>
  <div style="height:50px;margin-top:12px;border-radius:26px 18px 26px 18px;background:#0E8C8C;color:#fff;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div>
</div>`,
  "2j": `<div class="sc-card" data-card="terminal" onClick="#0E8C8C" style="background:#0B0F14;color:#A8E04B;padding:0;display:flex;flex-direction:column;font:500 13px/1.7 ui-monospace,Menlo,monospace;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="height:40px;background:#18212A;display:flex;align-items:center;padding:0 16px;gap:8px"><span style="width:12px;height:12px;border-radius:50%;background:#FF5F57"></span><span style="width:12px;height:12px;border-radius:50%;background:#FEBC2E"></span><span style="width:12px;height:12px;border-radius:50%;background:#28C840"></span><span style="margin-left:auto;font-size:11px;color:#93A3AF">jo@togetherplans — zsh</span></div>
  <div style="padding:22px 22px 24px;flex:1;display:flex;flex-direction:column;overflow:hidden">
    <div><span style="color:#2FC4C1">$</span> datenight plan --group "Jake & Sarah"</div>
    <div style="color:#93A3AF">→ SUCCESS</div>
    <div style="font:800 34px/1.1 'Sora',sans-serif;letter-spacing:-.04em;color:#fff;margin:14px 0 10px;text-wrap:balance">Saturday Night Out</div>
    <div><span style="color:#93A3AF">what  </span>Jazz at Blue Room</div>
    <div><span style="color:#93A3AF">where </span>2051 Welton St, Denver CO</div>
    <div><span style="color:#93A3AF">when  </span>Saturday, Oct 4 · 8:00 PM</div>
    <div><span style="color:#93A3AF">who   </span>Locked In ✓</div>
    <div style="margin-top:12px;color:#DDE3E8"><span style="color:#93A3AF">  [1] </span>Jazz at Blue Room <span style="color:#F7D98A">Dinner or drinks?</span></div>
    <div style="color:#DDE3E8"><span style="color:#93A3AF">  [2] </span>Dinner at Nobu <span style="color:#F7D98A">Jazz or comedy?</span></div>
    <div style="color:#DDE3E8"><span style="color:#93A3AF">  [3] </span>Comedy Works <span style="color:#F7D98A">Stay out?</span></div>
    <div style="margin-top:12px;color:#DDE3E8"><span style="color:#2FC4C1">$</span> echo "It's happening 🎉"</div>
    <div style="margin-top:auto;display:flex;gap:8px;align-items:center"><span style="color:#2FC4C1">$</span><span style="padding:8px 14px;border:2px solid #A8E04B;color:#A8E04B;font-weight:700">[ view plan → ]</span><span style="width:9px;height:18px;background:#A8E04B;animation:dn-neon 1s steps(1) infinite"></span></div>
  </div>
</div>`,
  "2k": `<div class="sc-card" data-card="badge" onClick="#0E8C8C" style="background:#F6F1E7;padding:30px 26px 26px;display:flex;flex-direction:column;align-items:center;text-align:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="font:700 12px 'Sora',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#5D6B76">Jake & Sarah · est. 2026</div>
  <div style="width:270px;height:270px;border-radius:50%;background:#0E8C8C;margin-top:26px;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 18px 44px rgba(14,140,140,.3)"><div style="position:absolute;inset:10px;border-radius:50%;border:3px dashed rgba(255,255,255,.7)"></div><div style="width:200px;height:200px;border-radius:50%;background:#F6F1E7;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box"><div style="font:800 10px 'Sora',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#0E8C8C">It's a Match!</div><div style="font:800 26px/1 'Sora',sans-serif;letter-spacing:-.04em;margin-top:8px;text-wrap:balance">Saturday Night Out</div><div style="font:700 11px 'Sora',sans-serif;letter-spacing:.1em;margin-top:8px;color:#5D6B76">SEP 27 · 2 PM</div></div></div>
  <div style="margin-top:-18px;padding:9px 22px;background:#101820;color:#F6F1E7;font:800 12px 'Sora',sans-serif;letter-spacing:.14em;text-transform:uppercase;position:relative;clip-path:polygon(0 0,100% 0,94% 50%,100% 100%,0 100%,6% 50%)">Locked In ✓</div>
  <div style="font:800 22px/1.15 'Sora',sans-serif;letter-spacing:-.03em;margin-top:26px">Jazz at Blue Room</div>
  <div style="font-size:14px;color:#5D6B76;margin-top:6px">2051 Welton St, Denver CO</div>
  <div style="display:flex;justify-content:center;padding-left:8px;margin-top:16px"><span style="width:28px;height:28px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 10px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:3px solid #F6F1E7;margin-left:-8px;opacity:{{ p.op }}">{{ p.i }}</span></div>
  <div style="margin-top:auto;font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#5D6B76">“It's happening 🎉” — Jo</div>
  <div style="width:100%;height:50px;margin-top:12px;border-radius:12px;border:2.5px solid #101820;font:800 13px 'Sora',sans-serif;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;justify-content:center">View Plan →</div>
</div>`,
  "2l": `<div class="sc-card" data-card="mag" onClick="#0E8C8C" style="background:#101820;color:#fff;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="position:absolute;inset:0;background:url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80) center/cover"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,24,32,.35),rgba(16,24,32,0) 30%,rgba(16,24,32,0) 50%,rgba(16,24,32,.85))"></div>
  <div style="position:absolute;left:0;right:0;top:26px;text-align:center;font:800 58px/1 'Sora',sans-serif;letter-spacing:-.04em;text-transform:uppercase">DateMeUp</div>
  <div style="position:absolute;left:24px;top:96px;font:700 11px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;padding:6px 10px;background:#7CB518;color:#101820">It's a Match!</div>
  <div style="position:absolute;right:24px;top:96px;font:700 11px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.6)">Jake & Sarah issue</div>
  <div style="position:absolute;left:24px;right:24px;bottom:120px"><div style="font:700 13px 'Sora',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#A8E04B">Saturday, Oct 4 · 8:00 PM</div><div style="font:800 52px/.95 'Sora',sans-serif;letter-spacing:-.05em;margin-top:8px;text-wrap:balance">Saturday Night Out</div><div style="font:700 18px/1.25 'Sora',sans-serif;margin-top:12px">Jazz at Blue Room</div><div style="font-size:13px;opacity:.85;margin-top:4px">2051 Welton St, Denver CO · Locked In ✓</div><div style="font:italic 400 13px/1.4 'DM Sans',sans-serif;opacity:.85;margin-top:10px">Inside: Jo on “It's happening 🎉”</div></div>
  <div style="position:absolute;left:24px;right:24px;bottom:28px;display:flex;align-items:center;gap:12px"><div style="height:50px;flex:1;border-radius:999px;background:#fff;color:#101820;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div><div style="width:64px;height:38px;background:repeating-linear-gradient(90deg,#fff 0 2px,transparent 2px 4px,#fff 4px 5px,transparent 5px 8px)"></div></div>
  <div style="position:absolute;left:24px;bottom:12px;font-size:8px;opacity:.7">Photo: Corentin Bruneau / Unsplash</div>
</div>`,
  "1a": `<div class="sc-card" data-card="poster" onClick="#0E8C8C" style="background:#0E8C8C;color:#fff;padding:36px 30px 30px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="position:absolute;right:-90px;bottom:-110px;width:320px;height:300px;border-radius:48% 52% 45% 55%/55% 45% 55% 45%;background:rgba(255,255,255,.08)"></div>
  <div style="display:flex;align-items:center;justify-content:space-between;position:relative"><span style="font:700 12px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.85">Jake & Sarah</span><span style="padding:6px 12px;border-radius:12px 6px 14px 6px;background:#7CB518;color:#101820;font:800 11px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(4deg)">It's a Match!</span></div>
  <div style="font:800 66px/.95 'Sora',sans-serif;letter-spacing:-.05em;margin-top:56px;position:relative;text-wrap:balance">Saturday Night Out<span style="display:inline-block;transform:rotate(10deg);color:#A8E04B">!</span></div>
  <div style="font:700 22px/1.2 'Sora',sans-serif;letter-spacing:-.02em;margin-top:22px;position:relative">Jazz at Blue Room</div>
  <div style="font-size:14px;opacity:.85;margin-top:6px;position:relative">2051 Welton St, Denver CO</div>
  <div style="display:inline-flex;align-self:flex-start;align-items:center;gap:8px;padding:9px 14px;border-radius:18px 24px 20px 26px;background:rgba(255,255,255,.16);font:600 14px 'DM Sans',sans-serif;margin-top:18px;position:relative">🗓 Saturday, Oct 4 · 8:00 PM</div>
  <div style="margin-top:auto;position:relative">
    <div style="font:italic 400 15px/1.4 'DM Sans',sans-serif;opacity:.9">“It's happening 🎉” <span style="opacity:.7">— Jo</span></div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:16px"><div style="display:flex;padding-left:6px"><span style="width:26px;height:26px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 10px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #0E8C8C;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="font-size:13px;font-weight:600">Locked In ✓</span></div>
    <div style="height:52px;margin-top:14px;border-radius:26px 18px 26px 18px;background:#fff;color:#086B6B;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">View Plan → →</div>
  </div>
</div>`,
  "1b": `<div class="sc-card" data-card="ticket" onClick="#0E8C8C" style="background:#EAF6D3;padding:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="width:300px;height:580px;background:#fff;border-radius:18px;position:relative;display:flex;flex-direction:column;box-shadow:0 14px 34px rgba(16,24,32,.12)">
    <div style="padding:24px 22px 18px;flex:1;display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font:800 11px 'Sora',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#0E8C8C">ADMIT TWO</span><span style="font:700 11px ui-monospace,Menlo,monospace;color:#5D6B76">№ 0927</span></div>
      <div style="font:700 12px 'DM Sans',sans-serif;color:#5D6B76;margin-top:22px;letter-spacing:.08em;text-transform:uppercase">Jake & Sarah presents</div>
      <div style="font:800 40px/1 'Sora',sans-serif;letter-spacing:-.04em;margin-top:8px;text-wrap:balance">Saturday Night Out</div>
      <div style="font:700 16px/1.25 'Sora',sans-serif;margin-top:14px;color:#086B6B">Jazz at Blue Room</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 10px;margin-top:22px;font-size:13px">
        <div><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Date</div><div style="font:700 15px 'Sora',sans-serif;margin-top:3px">Sun, Sep 27</div></div>
        <div><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Time</div><div style="font:700 15px 'Sora',sans-serif;margin-top:3px">2:00 PM</div></div>
        <div style="grid-column:1/-1"><div style="font:700 10px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Where</div><div style="font:600 14px 'DM Sans',sans-serif;margin-top:3px">2051 Welton St, Denver CO</div></div>
      </div>
      <div style="margin-top:auto;font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#5D6B76">“It's happening 🎉”</div>
    </div>
    <div style="position:relative;height:0;border-top:2px dashed #DDE3E8"><span style="position:absolute;left:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:#EAF6D3"></span><span style="position:absolute;right:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:#EAF6D3"></span></div>
    <div style="padding:18px 22px 22px">
      <div style="display:flex;align-items:center;gap:10px"><div style="display:flex;padding-left:6px"><span style="width:24px;height:24px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 9px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="font-size:12px;font-weight:600;color:#5D6B76">Locked In ✓</span></div>
      <div style="height:34px;margin-top:14px;background:repeating-linear-gradient(90deg,#101820 0 2px,transparent 2px 5px,#101820 5px 6px,transparent 6px 9px,#101820 9px 12px,transparent 12px 14px)"></div>
      <div style="display:flex;justify-content:space-between;font:700 10px ui-monospace,Menlo,monospace;color:#5D6B76;margin-top:6px"><span>TOGETHERPLANS.APP</span><span>View</span></div>
    </div>
  </div>
</div>`,
  "1c": `<div class="sc-card" data-card="polaroid" onClick="#0E8C8C" style="background:#F4F6F8;padding:34px 30px 30px;display:flex;flex-direction:column;align-items:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="position:absolute;left:-80px;top:-60px;width:260px;height:240px;border-radius:52% 48% 45% 55%/55% 45% 55% 45%;background:#D9F1F0"></div>
  <div style="align-self:flex-start;font:700 12px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76;position:relative">Jake & Sarah</div>
  <div style="width:288px;background:#fff;padding:14px 14px 20px;box-shadow:0 16px 40px rgba(16,24,32,.16);transform:rotate(-2.5deg);margin-top:22px;position:relative">
    <span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%) rotate(2deg);width:90px;height:26px;background:rgba(232,220,160,.75)"></span>
    <div style="width:260px;height:260px;overflow:hidden;background:#DDE3E8"><div style="width:100%;height:100%;background:url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80) center/cover"></div></div>
    <div style="font:700 30px/1.05 'Caveat',cursive;margin-top:14px;color:#101820">Saturday Night Out</div>
    <div style="font:500 18px/1.2 'Caveat',cursive;color:#5D6B76;margin-top:2px">Saturday, Oct 4 · 8:00 PM</div>
  </div>
  <span style="padding:7px 13px;border-radius:12px 6px 14px 6px;background:#7CB518;color:#101820;font:800 12px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(-5deg);margin-top:-14px;position:relative;box-shadow:0 8px 24px rgba(16,24,32,.12)">It's a Match!</span>
  <div style="margin-top:auto;width:100%;position:relative">
    <div style="font:800 18px/1.2 'Sora',sans-serif;letter-spacing:-.02em">Jazz at Blue Room</div>
    <div style="font-size:13px;color:#5D6B76;margin-top:3px">2051 Welton St, Denver CO · Locked In ✓</div>
    <div style="font:500 22px/1.2 'Caveat',cursive;margin-top:10px">“It's happening 🎉” — Jo</div>
    <div style="height:50px;margin-top:14px;border-radius:26px 18px 26px 18px;background:#0E8C8C;color:#fff;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div>
    <div style="font-size:8px;color:#93A3AF;margin-top:8px">Photo: Corentin Bruneau / Unsplash</div>
  </div>
</div>`,
  "1d": `<div class="sc-card" data-card="postcard" onClick="#0E8C8C" style="background:#F6F1E7;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="height:300px;position:relative;overflow:hidden"><div style="width:100%;height:100%;background:url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80) center/cover;filter:saturate(1.15) contrast(1.05)"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,24,32,0) 40%,rgba(16,24,32,.55))"></div>
    <div style="position:absolute;left:22px;bottom:18px;color:#fff"><div style="font:700 26px/1 'Caveat',cursive;color:#FFE9A8">Greetings from</div><div style="font:800 44px/.95 'Sora',sans-serif;letter-spacing:-.04em;text-shadow:3px 3px 0 #0E8C8C;margin-top:4px">Saturday Night Out</div></div>
    <span style="position:absolute;top:16px;right:16px;padding:6px 12px;border-radius:12px 6px 14px 6px;background:#E39B12;color:#101820;font:800 11px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(5deg)">It's a Match!</span>
  </div>
  <div style="flex:1;display:grid;grid-template-columns:1fr 1px 132px;gap:0 14px;padding:20px 20px 18px">
    <div style="display:flex;flex-direction:column">
      <div style="font:500 21px/1.25 'Caveat',cursive;color:#101820">Dear Jake & Sarah,<br>We finally decided. Jazz at Blue Room, Saturday, 8pm.</div>
      <div style="font:700 24px 'Caveat',cursive;margin-top:auto">— Jo</div>
      <div style="font-size:8px;color:#93A3AF;margin-top:6px">Photo: Corentin Bruneau / Unsplash</div>
    </div>
    <div style="background:#CFC4B0"></div>
    <div style="display:flex;flex-direction:column">
      <div style="align-self:flex-end;width:52px;height:62px;background:#0E8C8C;border:4px dashed #F6F1E7;outline:2px solid #0E8C8C;display:flex;align-items:center;justify-content:center;color:#fff;font:800 20px 'Sora',sans-serif;box-sizing:border-box">♥</div>
      <div style="position:absolute;right:88px;bottom:214px;width:74px;height:74px;border-radius:50%;border:2px solid rgba(16,24,32,.35);display:flex;align-items:center;justify-content:center;text-align:center;font:700 9px/1.2 ui-monospace,Menlo,monospace;color:rgba(16,24,32,.5);transform:rotate(-12deg)">SEP 27<br>2:00 PM<br>SF · CA</div>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:12px;font:600 11px/1.25 'DM Sans',sans-serif;color:#101820"><div style="border-bottom:1px solid #9C8F78;padding-bottom:3px">Jazz at Blue Room</div><div style="border-bottom:1px solid #9C8F78;padding-bottom:3px;color:#5D6B76">2051 Welton St, Denver CO</div><div style="border-bottom:1px solid #9C8F78;padding-bottom:3px;color:#5D6B76">Locked In ✓</div></div>
      <div style="height:34px;margin-top:12px;border-radius:12px;background:#101820;color:#fff;font:700 11px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div>
    </div>
  </div>
</div>`,
  "1e": `<div class="sc-card" data-card="marquee" onClick="#0E8C8C" style="background:radial-gradient(circle,#FFE9A8 3px,rgba(255,233,168,.25) 4px,transparent 5px) 12px 12px/24px 24px,#7A4A08;padding:24px;display:flex;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="flex:1;min-width:0;box-sizing:border-box;background:#101820;border-radius:12px;padding:26px 18px 22px;display:flex;flex-direction:column;color:#fff;text-align:center;border:3px solid #E39B12">
    <div style="font:700 11px 'Sora',sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#FFE9A8">JAZZ ✦ DINNER ✦ DECIDED</div>
    <div style="font:700 12px 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#93A3AF;margin-top:22px">Jake & Sarah presents</div>
    <div style="font:800 38px/1 'Sora',sans-serif;letter-spacing:-.03em;text-transform:uppercase;margin-top:12px;text-wrap:balance">Saturday Night Out</div>
    <div style="height:2px;background:#E39B12;margin:20px 30px 0"></div>
    <div style="font:700 20px/1.2 'Sora',sans-serif;color:#FFE9A8;margin-top:18px;text-transform:uppercase;letter-spacing:.02em">Jazz at Blue Room</div>
    <div style="font-size:14px;color:#93A3AF;margin-top:6px">2051 Welton St, Denver CO</div>
    <div style="font:800 22px 'Sora',sans-serif;margin-top:20px;letter-spacing:.04em">SUN SEP 27 · 2 PM</div>
    <div style="font:700 12px 'Sora',sans-serif;letter-spacing:.2em;color:#E39B12;margin-top:6px">ADMIT TWO · Locked In ✓</div>
    <div style="margin-top:auto;font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#93A3AF">“It's happening 🎉”</div>
    <div style="height:48px;margin-top:14px;border-radius:8px;background:#E39B12;color:#101820;font:800 14px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center">View Plan →</div>
  </div>
</div>`,
  "1f": `<div class="sc-card" data-card="calendar" onClick="#0E8C8C" style="background:#fff;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="background:#0E8C8C;color:#fff;padding:18px 28px;display:flex;justify-content:space-between;align-items:center;font:700 12px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase"><span>Jake & Sarah</span><span style="opacity:.8">It's a Match!</span></div>
  <div style="padding:26px 28px 0;display:flex;align-items:flex-end;gap:14px"><div style="font:800 168px/.85 'Sora',sans-serif;letter-spacing:-.08em;color:#101820">27</div><div style="padding-bottom:12px"><div style="font:800 26px/1 'Sora',sans-serif;letter-spacing:-.02em">SEP</div><div style="font:600 14px 'DM Sans',sans-serif;color:#5D6B76;margin-top:4px">Sunday</div><div style="font:600 14px 'DM Sans',sans-serif;color:#0E8C8C;margin-top:2px">2:00 PM</div></div></div>
  <div style="height:2px;background:#101820;margin:20px 28px 0"></div>
  <div style="padding:20px 28px 0"><div style="font:800 30px/1.05 'Sora',sans-serif;letter-spacing:-.04em">Saturday Night Out</div><div style="font:600 17px/1.3 'DM Sans',sans-serif;margin-top:10px">Jazz at Blue Room</div><div style="font-size:14px;color:#5D6B76;margin-top:3px">2051 Welton St, Denver CO</div></div>
  <div style="padding:22px 28px 0;display:flex;align-items:center;gap:10px"><div style="display:flex;padding-left:6px"><span style="width:26px;height:26px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 10px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="font-size:13px;color:#5D6B76">Locked In ✓</span></div>
  <div style="margin-top:auto;padding:0 28px 28px"><div style="font:italic 400 14px/1.4 'DM Sans',sans-serif;color:#5D6B76">“It's happening 🎉” — Jo</div><div style="height:50px;margin-top:16px;border:2px solid #101820;border-radius:12px;font:700 14px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div></div>
</div>`,
  "1g": `<div class="sc-card" data-card="note" onClick="#0E8C8C" style="background:repeating-linear-gradient(180deg,transparent 0 33px,#CFE0EA 33px 34px) 0 14px,#FFFDF7;padding:44px 28px 28px 56px;display:flex;flex-direction:column;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="position:absolute;left:42px;top:0;bottom:0;width:2px;background:#F2B8B8"></div>
  <span style="position:absolute;top:22px;right:22px;padding:7px 13px;border-radius:12px 6px 14px 6px;background:#0E8C8C;color:#fff;font:800 11px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(6deg);box-shadow:0 8px 24px rgba(16,24,32,.15)">It's a Match!</span>
  <div style="font:500 26px/34px 'Caveat',cursive;color:#1B2B6B">Hey Jake & Sarah,</div>
  <div style="font:700 52px/68px 'Caveat',cursive;color:#101820;letter-spacing:-.01em">Saturday Night Out</div>
  <div style="font:500 26px/34px 'Caveat',cursive;color:#1B2B6B">Jazz night locked in.</div>
  <div style="font:700 26px/34px 'Caveat',cursive;color:#0E8C8C;margin-top:34px">Jazz at Blue Room</div>
  <div style="font:500 26px/34px 'Caveat',cursive;color:#1B2B6B">2051 Welton St, Denver CO</div>
  <div style="font:500 26px/34px 'Caveat',cursive;color:#1B2B6B">Saturday, Oct 4 · 8:00 PM</div>
  <div style="font:500 26px/34px 'Caveat',cursive;color:#1B2B6B;margin-top:34px">Both voted Jazz at Blue Room.</div>
  <div style="font:700 30px/34px 'Caveat',cursive;color:#101820;margin-top:34px">xo, Jo</div>
  <div style="margin-top:auto;height:50px;border-radius:26px 18px 26px 18px;background:#101820;color:#fff;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;transform:rotate(-1.5deg)">View Plan →</div>
</div>`,
  "1h": `<div class="sc-card" data-card="collage" onClick="#0E8C8C" style="background:#F4F6F8;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="position:absolute;left:-70px;top:-60px;width:280px;height:250px;border-radius:52% 48% 45% 55%/55% 45% 55% 45%;background:#D9F1F0"></div>
  <div style="position:absolute;right:-90px;bottom:60px;width:260px;height:240px;border-radius:48% 52% 45% 55%/55% 45% 55% 45%;background:#EAF6D3"></div>
  <div style="position:absolute;left:30px;top:34px;font:700 12px 'Sora',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5D6B76">Jake & Sarah</div>
  <div style="position:absolute;right:26px;top:60px;width:190px;height:190px;border-radius:48% 52% 45% 55%/55% 45% 55% 45%;overflow:hidden;transform:rotate(6deg);box-shadow:0 16px 40px rgba(16,24,32,.16)"><div style="width:100%;height:100%;background:url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80) center/cover"></div></div>
  <span style="position:absolute;left:24px;top:96px;padding:8px 14px;border-radius:14px 8px 16px 8px;background:#7CB518;color:#101820;font:800 13px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(-7deg);box-shadow:0 8px 24px rgba(16,24,32,.12)">It's a Match!</span>
  <span style="position:absolute;left:42px;top:150px;padding:8px 14px;border-radius:8px 16px 8px 14px;background:#fff;font:600 13px 'DM Sans',sans-serif;transform:rotate(4deg);box-shadow:0 8px 24px rgba(16,24,32,.12)">🗓 Saturday, Oct 4 · 8:00 PM</span>
  <div style="position:absolute;left:30px;right:30px;top:276px;font:800 56px/.95 'Sora',sans-serif;letter-spacing:-.05em;text-wrap:balance">Saturday Night Out</div>
  <div style="position:absolute;left:30px;right:165px;top:400px;font:700 18px/1.2 'Sora',sans-serif;letter-spacing:-.02em">Jazz at Blue Room<div style="font:400 13px 'DM Sans',sans-serif;color:#5D6B76;margin-top:4px">2051 Welton St, Denver CO</div></div>
  <span style="position:absolute;right:18px;top:410px;padding:8px 12px;border-radius:12px 6px 14px 6px;background:#0E8C8C;color:#fff;font:800 12px 'Sora',sans-serif;transform:rotate(8deg);box-shadow:0 8px 24px rgba(16,24,32,.12)">Locked In ✓</span>
  <div style="position:absolute;left:30px;top:478px;display:flex;padding-left:6px"><span style="width:34px;height:34px;border-radius:50% 45% 55% 50%;background:{{ p.bg }};color:{{ p.fg }};font:800 12px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:3px solid #F4F6F8;margin-left:-8px;opacity:{{ p.op }}">{{ p.i }}</span></div>
  <div style="position:absolute;left:30px;right:30px;top:524px;font:italic 400 13px/1.35 'DM Sans',sans-serif;color:#5D6B76">“It's happening 🎉” — Jo</div>
  <div style="position:absolute;left:30px;right:30px;bottom:26px;height:50px;border-radius:26px 18px 26px 18px;background:#101820;color:#fff;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div>
  <div style="position:absolute;right:30px;bottom:10px;font-size:8px;color:#93A3AF">Photo: Corentin Bruneau / Unsplash</div>
</div>`,
  "1i": `<div class="sc-card" data-card="map" onClick="#0E8C8C" style="background:repeating-linear-gradient(0deg,rgba(255,255,255,.9) 0 7px,transparent 7px 64px),repeating-linear-gradient(90deg,rgba(255,255,255,.9) 0 7px,transparent 7px 78px),#E3E9EC;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="position:absolute;left:-60px;top:70px;width:200px;height:170px;border-radius:52% 48% 45% 55%/55% 45% 55% 45%;background:#DCEFC4;transform:rotate(-12deg)"></div>
  <div style="position:absolute;right:-90px;top:-40px;width:230px;height:200px;border-radius:48% 52% 45% 55%/55% 45% 55% 45%;background:#CFE7E7;transform:rotate(20deg)"></div>
  <div style="position:absolute;left:0;right:0;top:120px;height:26px;background:#F7D98A;transform:rotate(-9deg)"></div>
  <div style="position:absolute;left:26px;top:28px;padding:8px 14px;border-radius:999px;background:#fff;font:700 12px 'Sora',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#5D6B76;box-shadow:0 8px 24px rgba(16,24,32,.1)">Jake & Sarah</div>
  <div style="position:absolute;left:150px;top:196px;width:60px;height:60px;border-radius:50%;background:#0E8C8C;border:5px solid #fff;box-shadow:0 12px 30px rgba(14,140,140,.4);display:flex;align-items:center;justify-content:center;color:#fff;font:800 24px 'Sora',sans-serif;z-index:2">♥</div>
  <div style="position:absolute;left:167px;top:246px;width:26px;height:26px;background:#0E8C8C;transform:rotate(45deg);border-right:5px solid #fff;border-bottom:5px solid #fff;z-index:1"></div>
  <div style="position:absolute;left:150px;top:284px;width:60px;height:14px;border-radius:50%;background:rgba(16,24,32,.18);filter:blur(3px)"></div>
  <span style="position:absolute;left:226px;top:186px;padding:7px 12px;border-radius:12px 6px 14px 6px;background:#7CB518;color:#101820;font:800 11px 'Sora',sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(6deg);box-shadow:0 8px 24px rgba(16,24,32,.12)">It's a Match!</span>
  <div style="position:absolute;left:20px;right:20px;bottom:20px;background:#fff;border-radius:30px 22px 34px 20px;padding:22px 22px 20px;box-shadow:0 18px 44px rgba(16,24,32,.16)">
    <div style="font:800 34px/1 'Sora',sans-serif;letter-spacing:-.04em">Saturday Night Out</div>
    <div style="font:700 17px/1.25 'Sora',sans-serif;margin-top:12px;color:#086B6B">Jazz at Blue Room</div>
    <div style="font-size:14px;color:#5D6B76;margin-top:3px">📍 2051 Welton St, Denver CO</div>
    <div style="font-size:14px;color:#5D6B76;margin-top:3px">🗓 Saturday, Oct 4 · 8:00 PM</div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:14px"><div style="display:flex;padding-left:6px"><span style="width:26px;height:26px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 10px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="font-size:13px;color:#5D6B76">Locked In ✓</span></div>
    <div style="font:italic 400 13px/1.35 'DM Sans',sans-serif;color:#5D6B76;margin-top:12px">“It's happening 🎉” — Jo</div>
    <div style="height:50px;margin-top:14px;border-radius:26px 18px 26px 18px;background:#0E8C8C;color:#fff;font:700 15px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center">View Plan →</div>
  </div>
</div>`,
  "1j": `<div class="sc-card" data-card="neon" onClick="#0E8C8C" style="background:radial-gradient(ellipse at 50% 30%,#14282E,#0B0F14 70%);padding:34px 28px 28px;display:flex;flex-direction:column;align-items:center;text-align:center;color:#fff;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="font:700 12px 'Sora',sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#93A3AF">Jake & Sarah</div>
  <div style="margin-top:44px;padding:30px 22px;border:3px solid #2FC4C1;border-radius:26px;box-shadow:0 0 12px #2FC4C1,inset 0 0 12px rgba(47,196,193,.5);width:100%;box-sizing:border-box">
    <div style="font:800 14px 'Sora',sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#A8E04B;text-shadow:0 0 6px #A8E04B,0 0 18px #A8E04B;animation:dn-neon 4s infinite">It's a Match!</div>
    <div style="font:800 52px/1 'Sora',sans-serif;letter-spacing:-.03em;color:#fff;text-shadow:0 0 8px #2FC4C1,0 0 22px #2FC4C1,0 0 50px #0E8C8C;margin-top:16px;text-wrap:balance">Saturday Night Out</div>
    <div style="font:700 18px/1.25 'Sora',sans-serif;color:#2FC4C1;text-shadow:0 0 10px #2FC4C1;margin-top:18px">Jazz at Blue Room</div>
    <div style="font-size:13px;color:#93A3AF;margin-top:6px">2051 Welton St, Denver CO</div>
    <div style="font:800 20px 'Sora',sans-serif;color:#FFE9A8;text-shadow:0 0 8px #FFE9A8,0 0 20px #E39B12;margin-top:18px;letter-spacing:.04em">SUN 27 · 2 PM</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;margin-top:22px"><div style="display:flex;padding-left:6px"><span style="width:26px;height:26px;border-radius:50%;background:{{ p.bg }};color:{{ p.fg }};font:800 10px 'Sora',sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #0B0F14;margin-left:-6px;opacity:{{ p.op }}">{{ p.i }}</span></div><span style="font-size:13px;color:#93A3AF">Locked In ✓</span></div>
  <div style="margin-top:auto;font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#93A3AF">“It's happening 🎉” — Jo</div>
  <div style="width:100%;height:50px;margin-top:14px;border-radius:999px;border:2px solid #A8E04B;color:#A8E04B;text-shadow:0 0 8px #A8E04B;box-shadow:0 0 10px rgba(168,224,75,.6);font:800 14px 'Sora',sans-serif;letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;box-sizing:border-box">View Plan →</div>
</div>`,
  "1k": `<div class="sc-card" data-card="receipt" onClick="#0E8C8C" style="background:#DDE3E8;padding:24px 40px;display:flex;justify-content:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="width:280px;align-self:flex-start;background:#fff;padding:26px 22px 26px;font:500 12px/1.6 ui-monospace,Menlo,monospace;color:#101820;box-shadow:0 14px 34px rgba(16,24,32,.14);position:relative;transform:rotate(1deg)">
    <div style="text-align:center;font:800 20px 'Sora',sans-serif;letter-spacing:.06em">TOGETHER PLANS</div>
    <div style="text-align:center;font-size:11px;color:#5D6B76">Jake & Sarah · datemeup.app</div>
    <div style="text-align:center;margin-top:12px;font-weight:700;letter-spacing:.06em">*** IT'S A MATCH! ***</div>
    <div style="border-top:1px dashed #101820;margin:14px 0 10px"></div>
    <div style="display:flex;justify-content:space-between"><span>PLAN</span><span style="font-weight:700">Saturday Night Out</span></div>
    <div style="display:flex;justify-content:space-between"><span>DATE</span><span>SUN SEP 27</span></div>
    <div style="display:flex;justify-content:space-between"><span>TIME</span><span>2:00 PM</span></div>
    <div style="border-top:1px dashed #101820;margin:10px 0"></div>
    <div style="display:flex;justify-content:space-between;gap:10px"><span style="flex:1">Jazz at Blue Room</span><span>Dinner or drinks?</span></div>
    <div style="display:flex;justify-content:space-between;gap:10px"><span style="flex:1">Dinner at Nobu</span><span>Jazz or comedy?</span></div>
    <div style="display:flex;justify-content:space-between;gap:10px"><span style="flex:1">Comedy Works</span><span>Stay out?</span></div>
    <div style="border-top:1px dashed #101820;margin:10px 0"></div>
    <div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px"><span>TOTAL</span><span>JAZZ AT BLUE ROOM</span></div>
    <div style="display:flex;justify-content:space-between;color:#5D6B76"><span>WHERE</span><span style="text-align:right">2051 Welton St, Denver CO</span></div>
    <div style="display:flex;justify-content:space-between;color:#5D6B76"><span>PARTY</span><span>Locked In ✓</span></div>
    <div style="border-top:1px dashed #101820;margin:10px 0"></div>
    <div style="font-style:italic;color:#5D6B76">NOTE: It's happening 🎉</div>
    <div style="height:38px;margin-top:14px;background:repeating-linear-gradient(90deg,#101820 0 2px,transparent 2px 5px,#101820 5px 6px,transparent 6px 9px,#101820 9px 12px,transparent 12px 14px)"></div>
    <div style="text-align:center;font-size:10px;margin-top:4px;color:#5D6B76">0927 2000 4006 0001</div>
    <div style="text-align:center;font-weight:700;margin-top:12px;letter-spacing:.06em">VIEW PLAN ▸</div>
    <div style="text-align:center;font-size:10px;color:#5D6B76">THANK YOU · COME AGAIN</div>
    <div style="position:absolute;left:0;right:0;bottom:-10px;height:10px;background:linear-gradient(-45deg,transparent 7px,#fff 0) 0 0/14px 14px,linear-gradient(45deg,transparent 7px,#fff 0) 7px 0/14px 14px"></div>
  </div>
</div>`,
  "1l": `<div class="sc-card" data-card="playbill" onClick="#0E8C8C" style="background:#F6F1E7;padding:28px 26px 26px;display:flex;flex-direction:column;text-align:center;cursor:pointer;outline:3px solid #0E8C8C;outline-offset:4px">
  <div style="border-top:4px solid #101820;border-bottom:1.5px solid #101820;padding:8px 0;font:800 11px 'Sora',sans-serif;letter-spacing:.32em;text-transform:uppercase">JAZZ ✦ DINNER ✦ DECIDED</div>
  <div style="font:700 13px 'DM Sans',sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#5D6B76;margin-top:22px">Jake & Sarah proudly presents</div>
  <div style="font:800 46px/.95 'Sora',sans-serif;letter-spacing:-.05em;text-transform:uppercase;margin-top:12px;text-wrap:balance">Saturday Night Out</div>
  <div style="font:italic 500 16px 'DM Sans',sans-serif;margin-top:16px">Live Jazz · Downtown Denver</div>
  <div style="font:800 24px/1.1 'Sora',sans-serif;letter-spacing:-.02em;text-transform:uppercase;margin-top:6px;color:#0E8C8C">Jazz at Blue Room</div>
  <div style="display:flex;align-items:center;gap:10px;margin:18px 0 0"><div style="flex:1;height:1.5px;background:#101820"></div><span style="font:800 12px 'Sora',sans-serif;letter-spacing:.2em">WITH</span><div style="flex:1;height:1.5px;background:#101820"></div></div>
  <div style="font:700 13px/1.5 'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;margin-top:10px">Jazz at Blue Room<br>Dinner at Nobu<br>Comedy Works</div>
  <div style="display:flex;justify-content:center;gap:20px;margin-top:22px;font:800 13px 'Sora',sans-serif;letter-spacing:.1em;text-transform:uppercase"><span>Sun Sep 27</span><span>·</span><span>Doors 2 PM</span></div>
  <div style="font-size:13px;color:#5D6B76;margin-top:4px">2051 Welton St, Denver CO · Locked In ✓</div>
  <div style="margin-top:auto;font:italic 400 13px/1.4 'DM Sans',sans-serif;color:#5D6B76">“It's happening 🎉” — Jo</div>
  <div style="height:48px;margin-top:14px;background:#101820;color:#F6F1E7;font:800 13px 'Sora',sans-serif;letter-spacing:.2em;text-transform:uppercase;display:flex;align-items:center;justify-content:center">View Plan →</div>
  <div style="border-top:1.5px solid #101820;border-bottom:4px solid #101820;padding:6px 0;margin-top:14px;font:700 9px ui-monospace,Menlo,monospace;letter-spacing:.2em;color:#5D6B76">TOGETHERPLANS.APP</div>
</div>`
};

/** ID → friendly display name */
export const CARD_NAMES: Record<string, string> = {
  "3a": "Luggage Tag", "3b": "Mixtape / Tape", "3c": "Trading Card",
  "3d": "Formal Invitation", "3e": "Passport Page", "3f": "Bento Tiles",
  "3g": "Sticky Notes", "3h": "Bingo Card", "3i": "8-bit Arcade",
  "3j": "Tarot Card", "3k": "Departures Board", "3l": "Wanted Poster",
  "2a": "Boarding Pass", "2b": "Swiss Grid", "2c": "Vinyl Sleeve",
  "2d": "Comic Panel", "2e": "Chalkboard", "2f": "Scoreboard",
  "2g": "Newspaper", "2h": "Confetti Invite", "2i": "Forecast Card",
  "2j": "Terminal", "2k": "Badge / Seal", "2l": "Magazine Cover",
  "1a": "Bold Poster", "1b": "Ticket Stub", "1c": "Polaroid",
  "1d": "Retro Postcard", "1e": "Movie Marquee", "1f": "Minimal Calendar",
  "1g": "Handwritten Note", "1h": "Collage / Sticker", "1i": "Map Pin",
  "1j": "Neon Sign", "1k": "Receipt", "1l": "Playbill / Gig Poster",
};
