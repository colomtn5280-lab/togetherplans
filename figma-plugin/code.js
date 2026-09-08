// DateNight Design System — Figma Plugin
// Run this once inside your DateNight — Design System file.
// It creates: all 10 screen frames, color styles, text styles, and spacing guides.

figma.showUI(__html__, { width: 400, height: 500 });

const COLORS = {
  "primary":          { r: 1.000, g: 0.251, b: 0.506 }, // #FF4081
  "primary-dark":     { r: 0.776, g: 0.000, b: 0.333 }, // #C60055
  "purple":           { r: 0.486, g: 0.227, b: 0.929 }, // #7c3aed
  "purple-dark":      { r: 0.357, g: 0.129, b: 0.714 }, // #5b21b6
  "background":       { r: 1.000, g: 1.000, b: 1.000 }, // #FFFFFF
  "surface":          { r: 0.973, g: 0.973, b: 0.973 }, // #F8F8F8
  "text-primary":     { r: 0.102, g: 0.102, b: 0.102 }, // #1A1A1A
  "text-secondary":   { r: 0.400, g: 0.400, b: 0.400 }, // #666666
  "border":           { r: 0.878, g: 0.878, b: 0.878 }, // #E0E0E0
  "success":          { r: 0.298, g: 0.686, b: 0.314 }, // #4CAF50
  "error":            { r: 0.957, g: 0.263, b: 0.212 }, // #F44336
  "warning":          { r: 1.000, g: 0.596, b: 0.000 }, // #FF9800
  "consensus-green":  { r: 0.180, g: 0.490, b: 0.196 }, // #2E7D32
};

const SCREENS = [
  "Login", "Register", "Groups", "Group Detail",
  "Create Group", "Invite Members", "Proposal Detail",
  "Create Proposal", "Suggestions", "Profile"
];

const TEXT_STYLES = [
  { name: "Heading/XL",    size: 32, weight: 700 },
  { name: "Heading/LG",    size: 28, weight: 700 },
  { name: "Heading/MD",    size: 24, weight: 600 },
  { name: "Heading/SM",    size: 22, weight: 600 },
  { name: "Body/LG",       size: 18, weight: 400 },
  { name: "Body/MD",       size: 16, weight: 400 },
  { name: "Body/SM",       size: 14, weight: 400 },
  { name: "Caption/MD",    size: 13, weight: 400 },
  { name: "Caption/SM",    size: 12, weight: 400 },
  { name: "Label/MD",      size: 16, weight: 600 },
  { name: "Label/SM",      size: 14, weight: 600 },
];

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "build") return;

  const page = figma.currentPage;
  page.name = "DateNight — Screens";
  let report = [];

  // 1. Color styles
  figma.ui.postMessage({ type: "status", text: "Creating color styles..." });
  for (const [name, rgb] of Object.entries(COLORS)) {
    const style = figma.createPaintStyle();
    style.name = `Colors/${name}`;
    style.paints = [{ type: "SOLID", color: rgb }];
  }
  report.push(`✅ ${Object.keys(COLORS).length} color styles created`);

  // 2. Text styles
  figma.ui.postMessage({ type: "status", text: "Creating text styles..." });
  for (const ts of TEXT_STYLES) {
    const style = figma.createTextStyle();
    style.name = ts.name;
    style.fontSize = ts.size;
    style.fontName = { family: "Inter", style: ts.weight >= 600 ? "Semi Bold" : "Regular" };
  }
  report.push(`✅ ${TEXT_STYLES.length} text styles created`);

  // 3. Screen frames — 390x844 (iPhone 14/15), arranged in a grid
  figma.ui.postMessage({ type: "status", text: "Creating screen frames..." });
  const FRAME_W = 390, FRAME_H = 844, GAP = 80;
  const COLS = 5;

  for (let i = 0; i < SCREENS.length; i++) {
    const frame = figma.createFrame();
    frame.name = SCREENS[i];
    frame.resize(FRAME_W, FRAME_H);
    frame.x = (i % COLS) * (FRAME_W + GAP);
    frame.y = Math.floor(i / COLS) * (FRAME_H + GAP);
    frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    frame.clipsContent = true;

    // Status bar placeholder
    const bar = figma.createRectangle();
    bar.resize(390, 44);
    bar.fills = [{ type: "SOLID", color: { r: 0.973, g: 0.973, b: 0.973 } }];
    frame.appendChild(bar);

    // Screen label
    const label = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    label.fontName = { family: "Inter", style: "Semi Bold" };
    label.characters = SCREENS[i];
    label.fontSize = 18;
    label.fills = [{ type: "SOLID", color: { r: 0.102, g: 0.102, b: 0.102 } }];
    label.x = 24;
    label.y = 60;
    frame.appendChild(label);

    // Pink accent bar at top (brand indicator)
    const accent = figma.createRectangle();
    accent.resize(390, 4);
    accent.y = 44;
    accent.fills = [{ type: "SOLID", color: COLORS["primary"] }];
    frame.appendChild(accent);

    page.appendChild(frame);
  }
  report.push(`✅ ${SCREENS.length} screen frames created (390×844)`);

  // 4. Spacing reference frame
  figma.ui.postMessage({ type: "status", text: "Creating spacing guide..." });
  const spacingFrame = figma.createFrame();
  spacingFrame.name = "📐 Spacing Reference";
  spacingFrame.resize(600, 200);
  spacingFrame.x = 0;
  spacingFrame.y = FRAME_H * 2 + GAP * 2 + 80;
  spacingFrame.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 1.0 } }];

  const spacings = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
  let xPos = 24;
  for (const [name, val] of Object.entries(spacings)) {
    const box = figma.createRectangle();
    box.resize(val, val);
    box.x = xPos;
    box.y = 80;
    box.fills = [{ type: "SOLID", color: COLORS["primary"] }];
    spacingFrame.appendChild(box);

    const lbl = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    lbl.fontName = { family: "Inter", style: "Regular" };
    lbl.characters = `${name}\n${val}px`;
    lbl.fontSize = 11;
    lbl.x = xPos;
    lbl.y = 140;
    spacingFrame.appendChild(lbl);

    xPos += val + 48;
  }
  page.appendChild(spacingFrame);
  report.push("✅ Spacing reference guide created");

  // Zoom to fit
  figma.viewport.scrollAndZoomIntoView(page.children);

  figma.ui.postMessage({ type: "done", report });
};
