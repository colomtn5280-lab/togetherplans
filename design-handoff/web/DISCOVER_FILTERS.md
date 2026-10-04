# Discover filters · option 4b (blob tiles)

Replaces the browser-default category, time and radius buttons on **/discover**.
Design: `DateNight Web.dc.html` → turn 4 → **4b**. CSS: `web/discover-filters.css`. Data: `web/discover-filters.json`.

## Structure
```html
<div class="tp-filter-label">Category</div>
<div class="tp-tiles" role="radiogroup" aria-label="Category">
  <button class="tp-tile" role="radio" aria-checked="true"><span class="tp-dot" aria-hidden="true"></span>All categories</button>
  <button class="tp-tile" role="radio" aria-checked="false"><span class="tp-dot" aria-hidden="true"></span>Comedy</button>
  <!-- …one per category, in the order below -->
</div>
<div class="tp-filter-rows">
  <div><div class="tp-filter-label">When</div>
    <div class="tp-seg" role="radiogroup" aria-label="When">
      <button role="radio" aria-checked="true">Tonight</button><button role="radio" aria-checked="false">This weekend</button>
      <button role="radio" aria-checked="false">This week</button><button role="radio" aria-checked="false">Anytime</button>
    </div></div>
  <div><div class="tp-filter-label">How far</div>
    <div class="tp-seg" role="radiogroup" aria-label="How far">
      <button role="radio" aria-checked="true">Nearby · 10 mi</button><button role="radio" aria-checked="false">25 mi</button>
      <button role="radio" aria-checked="false">60 mi</button><button role="radio" aria-checked="false">Day trip · 150 mi</button>
    </div></div>
</div>
```

## Rules
- **Remove the emoji icons.** Each tile shows a 28px coloured blob dot only.
- **Dot colours** rotate by position through five colours: teal #0E8C8C → amber #E39B12 → blue #2D6CDB → lime #7CB518 → ink #101820 (dark mode: #2FC4C1, #F3B84A, #5B8CF0, #A8E04B, #EEF3F6). With 4 columns, no two neighbours share a colour. The CSS does this with `:nth-child`, so keep the tiles in one flat list.
- **Selected tile**: teal background, white text, lime dot, trailing ✓. Single select; "All categories" is the default and clears the others.
- **Tile shape**: 64px tall, radius cycles through 22/30/20/26 → 30/22/26/20 → 20/26/30/22 → 26/20/22/30 (asymmetric blobs). Don't rotate the tiles; only stickers rotate.
- **When / How far** are segmented controls (single select), selected segment in teal.
- **Grid**: 4 columns desktop, 2 columns under 768px (tiles 56px).
- **Accessibility**: `role="radiogroup"` + `role="radio"` + `aria-checked`; arrow keys move within a group; visible focus ring (3px teal).
- **Fonts**: Sora 700 for tile and segment labels; section labels Sora 700 11px uppercase.

## Categories (order matters for colours)
1. All categories · id `all` · dot lime · default
2. Comedy · id `comedy` · dot amber
3. Concerts · id `concerts` · dot blue
4. Couples Events · id `couples-events` · dot lime
5. Family Events · id `family-events` · dot ink
6. Sports & Active · id `sports-and-active` · dot teal
7. Hiking Trails · id `hiking-trails` · dot amber
8. Hotel Stays · id `hotel-stays` · dot blue
9. Local Experiences · id `local-experiences` · dot lime
10. Movies · id `movies` · dot ink
11. Netflix Shows · id `netflix-shows` · dot teal
12. Performing Arts · id `performing-arts` · dot amber
13. Restaurants & Dining · id `restaurants-and-dining` · dot blue
14. Volunteering · id `volunteering` · dot lime
15. Wellness & Spa · id `wellness-and-spa` · dot ink
16. Wine & Drinks · id `wine-and-drinks` · dot teal
