#!/usr/bin/env python3
"""
DateMeUp — Overture Maps Places ETL
====================================
Loads US venue POIs from Overture Maps (CDLA-Permissive-2.0, free/open)
into the PostgreSQL venues table via COPY.

Usage:
  python3 load-fsq-venues.py [--dry-run] [--state TX] [--category restaurants-dining]

Data source: s3://overturemaps-us-west-2/release/<RELEASE>/theme=places/type=place/*
No AWS credentials required (public bucket).

Run once after migration, then monthly via venue-refresh job.
"""

import os
import sys
import csv
import json
import uuid
import argparse
import subprocess
import tempfile
from datetime import date

# ── Overture release to use ──────────────────────────────────────────────────
OVERTURE_RELEASE = os.environ.get('OVERTURE_RELEASE', '2026-09-23.1')
OVERTURE_BASE = f's3://overturemaps-us-west-2/release/{OVERTURE_RELEASE}/theme=places/type=place/*'

# ── Database connection ───────────────────────────────────────────────────────
# Use DATABASE_URL env (same as Cloud Run) or compose from parts
DATABASE_URL = os.environ.get('DATABASE_URL', '')
if not DATABASE_URL:
    DB_HOST = os.environ.get('DB_HOST', '34.56.29.20')
    DB_USER = os.environ.get('DB_USER', 'datenight')
    DB_PASS = os.environ.get('DB_PASS', '')
    DB_NAME = os.environ.get('DB_NAME', 'datenight')
    DATABASE_URL = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}'

# ── Overture taxonomy → DateMeUp category slug ───────────────────────────────
# Overture uses snake_case taxonomy names (taxonomy.primary field).
# Maps to DateMeUp's 15 category slugs.
# Note: some categories overlap (e.g. brewery is both after-dark and experiences)
# — we pick the most user-facing mapping.
OVERTURE_TO_DATEMEUP: dict[str, str] = {
    # ── Restaurants & Dining ──────────────────────────────────────────────
    'restaurant': 'restaurants-dining',
    'fast_food_restaurant': 'restaurants-dining',
    'coffee_shop': 'restaurants-dining',
    'cafe': 'restaurants-dining',
    'bakery': 'restaurants-dining',
    'pizza_restaurant': 'restaurants-dining',
    'burger_restaurant': 'restaurants-dining',
    'ice_cream_shop': 'restaurants-dining',
    'donut_shop': 'restaurants-dining',
    'sandwich_shop': 'restaurants-dining',
    'seafood_restaurant': 'restaurants-dining',
    'steakhouse': 'restaurants-dining',
    'breakfast_restaurant': 'restaurants-dining',
    'food_truck': 'restaurants-dining',
    'diner': 'restaurants-dining',
    'mexican_restaurant': 'restaurants-dining',
    'italian_restaurant': 'restaurants-dining',
    'chinese_restaurant': 'restaurants-dining',
    'japanese_restaurant': 'restaurants-dining',
    'thai_restaurant': 'restaurants-dining',
    'indian_restaurant': 'restaurants-dining',
    'american_restaurant': 'restaurants-dining',
    'brunch_restaurant': 'restaurants-dining',
    'dessert_shop': 'restaurants-dining',
    'juice_bar': 'restaurants-dining',
    'tea_room': 'restaurants-dining',
    'food_court': 'restaurants-dining',
    'buffet_restaurant': 'restaurants-dining',
    'bbq_restaurant': 'restaurants-dining',
    'sushi_restaurant': 'restaurants-dining',
    'greek_restaurant': 'restaurants-dining',
    'french_restaurant': 'restaurants-dining',
    'mediterranean_restaurant': 'restaurants-dining',
    'vietnamese_restaurant': 'restaurants-dining',
    'korean_restaurant': 'restaurants-dining',
    'taco_restaurant': 'restaurants-dining',
    'ramen_restaurant': 'restaurants-dining',

    # ── After Dark ────────────────────────────────────────────────────────
    'bar': 'after-dark',
    'pub': 'after-dark',
    'nightclub': 'after-dark',
    'night_club': 'after-dark',
    'cocktail_bar': 'after-dark',
    'wine_bar': 'after-dark',
    'karaoke_bar': 'after-dark',
    'lounge': 'after-dark',
    'sports_bar': 'after-dark',
    'dive_bar': 'after-dark',
    'irish_pub': 'after-dark',
    'gay_bar': 'after-dark',
    'hookah_bar': 'after-dark',
    'beer_garden': 'after-dark',
    'taproom': 'after-dark',

    # ── Wellness & Spa ────────────────────────────────────────────────────
    'spa': 'wellness-spa',
    'day_spa': 'wellness-spa',
    'yoga_studio': 'wellness-spa',
    'pilates_studio': 'wellness-spa',
    'massage_therapy': 'wellness-spa',
    'massage_studio': 'wellness-spa',
    'nail_salon': 'wellness-spa',
    'sauna': 'wellness-spa',
    'meditation_center': 'wellness-spa',
    'wellness_center': 'wellness-spa',
    'float_spa': 'wellness-spa',
    'health_spa': 'wellness-spa',

    # ── Sports & Active ───────────────────────────────────────────────────
    'bowling_alley': 'sports-active',
    'climbing_gym': 'sports-active',
    'rock_climbing_gym': 'sports-active',
    'golf_course': 'sports-active',
    'miniature_golf': 'sports-active',
    'mini_golf': 'sports-active',
    'go_kart_track': 'sports-active',
    'skating_rink': 'sports-active',
    'ice_skating_rink': 'sports-active',
    'roller_rink': 'sports-active',
    'trampoline_park': 'sports-active',
    'escape_room': 'sports-active',
    'axe_throwing': 'sports-active',
    'laser_tag': 'sports-active',
    'paintball_field': 'sports-active',
    'arcade': 'sports-active',
    'billiards': 'sports-active',
    'batting_cage': 'sports-active',
    'tennis_court': 'sports-active',
    'racquetball_court': 'sports-active',
    'swimming_pool': 'sports-active',
    'crossfit_gym': 'sports-active',
    'fitness_center': 'sports-active',
    'gym': 'sports-active',

    # ── Hotel Stays ───────────────────────────────────────────────────────
    'hotel': 'hotel-stays',
    'motel': 'hotel-stays',
    'resort': 'hotel-stays',
    'bed_and_breakfast': 'hotel-stays',
    'hostel': 'hotel-stays',
    'inn': 'hotel-stays',
    'lodge': 'hotel-stays',
    'vacation_rental': 'hotel-stays',
    'campground': 'hotel-stays',
    'glamping': 'hotel-stays',
    'boutique_hotel': 'hotel-stays',

    # ── Arts & Culture ────────────────────────────────────────────────────
    'museum': 'arts-culture',
    'art_museum': 'arts-culture',
    'history_museum': 'arts-culture',
    'science_museum': 'arts-culture',
    'art_gallery': 'arts-culture',
    'theater': 'arts-culture',
    'performing_arts_venue': 'arts-culture',
    'opera_house': 'arts-culture',
    'cultural_center': 'arts-culture',
    'ballet': 'arts-culture',

    # ── Live Music & Concerts ─────────────────────────────────────────────
    'music_venue': 'live-music-concerts',
    'concert_hall': 'live-music-concerts',
    'amphitheater': 'live-music-concerts',
    'amphitheatre': 'live-music-concerts',
    'jazz_club': 'live-music-concerts',
    'blues_club': 'live-music-concerts',
    'rock_club': 'live-music-concerts',

    # ── Comedy ────────────────────────────────────────────────────────────
    'comedy_club': 'comedy',
    'comedy_theater': 'comedy',
    'improv_theater': 'comedy',

    # ── Movies ────────────────────────────────────────────────────────────
    'movie_theater': 'movies',
    'cinema': 'movies',
    'drive_in_theater': 'movies',
    'imax_theater': 'movies',

    # ── Experiences ───────────────────────────────────────────────────────
    'winery': 'experiences',
    'vineyard': 'experiences',
    'brewery': 'experiences',
    'distillery': 'experiences',
    'craft_brewery': 'experiences',
    'cooking_school': 'experiences',
    'pottery_studio': 'experiences',
    'paint_bar': 'experiences',
    'art_class': 'experiences',
    'shooting_range': 'experiences',

    # ── Family Events ─────────────────────────────────────────────────────
    'zoo': 'family-events',
    'aquarium': 'family-events',
    "children_s_museum": 'family-events',
    'childrens_museum': 'family-events',
    'amusement_park': 'family-events',
    'theme_park': 'family-events',
    'water_park': 'family-events',
}

# Phase 1 categories — load these first
PHASE1_CATEGORIES = {
    'restaurants-dining',
    'after-dark',
    'wellness-spa',
    'sports-active',
    'hotel-stays',
}

# Phase 2 categories (arts-culture is loaded from IMLS; others from Overture too)
PHASE2_CATEGORIES = {
    'arts-culture',
    'live-music-concerts',
    'comedy',
    'movies',
    'experiences',
    'family-events',
}

ALL_CATEGORIES = PHASE1_CATEGORIES | PHASE2_CATEGORIES


def run_etl(
    categories: set[str] | None = None,
    dry_run: bool = False,
    state_filter: str | None = None,
) -> dict[str, int]:
    """
    Main ETL:
    1. Use DuckDB to scan Overture Maps S3 parquet
    2. Filter to US, map categories, deduplicate
    3. Write CSV temp file
    4. COPY into venues table via psql
    Returns dict of {category: count}.
    """
    import duckdb

    target_cats = categories or ALL_CATEGORIES
    cat_sql_list = ', '.join(f"'{c}'" for c in OVERTURE_TO_DATEMEUP.keys())

    print(f'=== Overture Maps ETL ===')
    print(f'  Release:    {OVERTURE_RELEASE}')
    print(f'  Categories: {sorted(target_cats)}')
    print(f'  State:      {state_filter or "ALL"}')
    print(f'  Dry run:    {dry_run}')
    print()

    con = duckdb.connect()
    con.execute('INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial;')
    con.execute("SET s3_region='us-west-2';")
    con.execute('SET enable_object_cache=true;')

    # Build category mapping as inline VALUES for SQL
    # Use double-dollar quoting to avoid apostrophe issues
    cat_map_values = []
    for ov, dm in OVERTURE_TO_DATEMEUP.items():
        # Escape single quotes in values (SQL standard)
        ov_safe = ov.replace("'", "''")
        dm_safe = dm.replace("'", "''")
        cat_map_values.append(f"('{ov_safe}', '{dm_safe}')")
    cat_map_sql = ',\n    '.join(cat_map_values)

    state_clause = f"AND addresses[1].region ILIKE '%{state_filter}%'" if state_filter else ''

    # US regional bounding boxes for chunked processing
    # Without bbox filter, DuckDB must scan all parquet files (very slow).
    # With bbox filter, it can prune partitions — each chunk takes ~20-30s.
    US_REGIONS = [
        # (name, min_lat, max_lat, min_lng, max_lng)
        ('northeast',   39.5, 47.5, -80.0,  -66.5),
        ('midatlantic',  36.0, 42.0, -82.0,  -72.0),
        ('southeast',    24.5, 38.0, -92.0,  -74.0),
        ('midwest_n',    41.5, 49.5, -104.0, -80.0),
        ('midwest_s',    36.0, 42.0, -104.0, -80.0),
        ('south',        25.5, 37.0, -106.0, -88.0),
        ('mountain',     31.0, 49.5, -116.0, -104.0),
        ('pacific',      32.0, 49.5, -124.5, -116.0),
        ('alaska',       51.0, 71.5, -180.0, -130.0),
        ('hawaii',       18.5, 22.5, -161.0, -154.0),
    ]

    # If state_filter given, map it to a single bbox instead of scanning all regions
    STATE_BBOX = {
        'AL': (30.1, 35.0, -88.5, -84.9), 'AK': (51.0, 71.5, -180.0, -130.0),
        'AZ': (31.3, 37.0, -114.8, -109.0), 'AR': (33.0, 36.5, -94.6, -89.6),
        'CA': (32.5, 42.0, -124.5, -114.1), 'CO': (37.0, 41.0, -109.1, -102.0),
        'CT': (41.0, 42.1, -73.7, -71.8), 'DE': (38.4, 39.8, -75.8, -75.0),
        'FL': (24.5, 31.0, -87.6, -80.0), 'GA': (30.4, 35.0, -85.6, -80.8),
        'HI': (18.5, 22.5, -161.0, -154.0), 'ID': (42.0, 49.0, -117.2, -111.0),
        'IL': (37.0, 42.5, -91.5, -87.0), 'IN': (37.8, 41.8, -88.1, -84.8),
        'IA': (40.4, 43.5, -96.6, -90.1), 'KS': (37.0, 40.0, -102.1, -94.6),
        'KY': (36.5, 39.1, -89.6, -81.9), 'LA': (28.9, 33.0, -94.0, -88.8),
        'ME': (43.1, 47.5, -71.1, -66.9), 'MD': (37.9, 39.7, -79.5, -74.9),
        'MA': (41.2, 42.9, -73.5, -69.9), 'MI': (41.7, 48.3, -90.4, -82.4),
        'MN': (43.5, 49.4, -97.2, -89.5), 'MS': (30.2, 35.0, -91.7, -88.1),
        'MO': (36.0, 40.6, -95.8, -89.1), 'MT': (44.4, 49.0, -116.1, -104.0),
        'NE': (40.0, 43.0, -104.1, -95.3), 'NV': (35.0, 42.0, -120.0, -114.0),
        'NH': (42.7, 45.3, -72.6, -70.6), 'NJ': (38.9, 41.4, -75.6, -73.9),
        'NM': (31.3, 37.0, -109.1, -103.0), 'NY': (40.5, 45.0, -79.8, -71.9),
        'NC': (33.8, 36.6, -84.3, -75.5), 'ND': (45.9, 49.0, -104.1, -96.6),
        'OH': (38.4, 42.0, -84.8, -80.5), 'OK': (33.6, 37.0, -103.0, -94.4),
        'OR': (42.0, 46.3, -124.6, -116.5), 'PA': (39.7, 42.3, -80.5, -74.7),
        'RI': (41.1, 42.0, -71.9, -71.1), 'SC': (32.0, 35.2, -83.4, -78.5),
        'SD': (42.5, 45.9, -104.1, -96.4), 'TN': (35.0, 36.7, -90.3, -81.6),
        'TX': (25.8, 36.5, -106.7, -93.5), 'UT': (37.0, 42.0, -114.1, -109.0),
        'VT': (42.7, 45.0, -73.4, -71.5), 'VA': (36.5, 39.5, -83.7, -75.2),
        'WA': (45.5, 49.0, -124.7, -116.9), 'WV': (37.2, 40.6, -82.6, -77.7),
        'WI': (42.5, 47.1, -92.9, -86.8), 'WY': (41.0, 45.0, -111.1, -104.1),
    }

    if state_filter and state_filter.upper() in STATE_BBOX:
        s = state_filter.upper()
        b = STATE_BBOX[s]
        regions_to_process = [(s, b[0], b[1], b[2], b[3])]
    else:
        regions_to_process = [(n, s, n2, w, e) for n, s, n2, w, e in US_REGIONS]

    # Register the category mapping as a temp table
    con.execute(f"""
        CREATE TEMP TABLE cat_map AS
        SELECT col0 AS overture_cat, col1 AS datemeup_cat
        FROM (VALUES {cat_map_sql}) t
    """)

    all_rows = []
    cat_counts: dict[str, int] = {}

    for region_name, min_lat, max_lat, min_lng, max_lng in regions_to_process:
        print(f'  Querying region: {region_name} (lat {min_lat}-{max_lat}, lng {min_lng}-{max_lng})...')

        region_clause = f"""
            AND bbox.xmin BETWEEN {min_lng} AND {max_lng}
            AND bbox.ymin BETWEEN {min_lat} AND {max_lat}
        """

        query = f"""
            SELECT
                id                                         AS overture_id,
                names.primary                              AS name,
                cm.datemeup_cat                            AS category,
                taxonomy.primary                           AS fsq_category,
                COALESCE(addresses[1].freeform, '')        AS address,
                COALESCE(addresses[1].locality, '')        AS city,
                COALESCE(addresses[1].region, '')          AS state,
                COALESCE(addresses[1].country, 'US')       AS country,
                websites[1]                                AS website,
                phones[1]                                  AS phone,
                confidence,
                ST_Y(geometry)                             AS lat,
                ST_X(geometry)                             AS lng
            FROM read_parquet('{OVERTURE_BASE}', hive_partitioning=1) p
            JOIN cat_map cm ON cm.overture_cat = taxonomy.primary
            WHERE addresses[1].country = 'US'
              AND names.primary IS NOT NULL
              AND names.primary != ''
              AND confidence >= 0.6
              {region_clause}
              {state_clause}
              AND cm.datemeup_cat IN ({','.join(f"'{c}'" for c in target_cats)})
        """

        try:
            rows = con.execute(query).fetchall()
            all_rows.extend(rows)
            r_count = len(rows)
            for row in rows:
                cat = row[2]
                cat_counts[cat] = cat_counts.get(cat, 0) + 1
            print(f'    {r_count:,} rows')
        except Exception as e:
            print(f'    ERROR in {region_name}: {e}')
            continue

    if dry_run:
        print('\n[DRY RUN] Skipping database load.')
        print('\n  Counts by category:')
        for cat, cnt in sorted(cat_counts.items()):
            print(f'    {cat}: {cnt:,}')
        print(f'  TOTAL: {sum(cat_counts.values()):,}')
        return cat_counts

    # Write to temp CSV
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
        csvpath = f.name
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        # CSV header
        writer.writerow([
            'id', 'overture_id', 'name', 'category', 'fsq_category',
            'address', 'city', 'state', 'country',
            'website', 'phone', 'confidence', 'lat', 'lng',
            'source', 'location',
        ])
        for row in all_rows:
            (overture_id, name, category, fsq_category,
             address, city, state, country,
             website, phone, confidence, lat, lng) = row

            if not lat or not lng:
                continue

            rid = f'ov-{overture_id}' if overture_id else f'ov-{uuid.uuid4()}'
            loc = f'SRID=4326;POINT({lng} {lat})'
            writer.writerow([
                rid, overture_id or '', name, category, fsq_category or '',
                address or '', city or '', state or '', country or 'US',
                website or '', phone or '', confidence or 1.0, lat, lng,
                'overture', loc,
            ])

    print(f'\n  CSV written: {csvpath} ({len(all_rows):,} rows)')

    # COPY into DB via psql
    psql_cmd = ['psql', DATABASE_URL, '-c', f"""
        \\COPY venues(id, overture_id, name, category, fsq_category,
                      address, city, state, country, website, phone,
                      confidence, lat, lng, source, location)
        FROM '{csvpath}' CSV HEADER
        ON CONFLICT (id) DO UPDATE SET
          name        = EXCLUDED.name,
          fsq_category = EXCLUDED.fsq_category,
          address     = EXCLUDED.address,
          city        = EXCLUDED.city,
          state       = EXCLUDED.state,
          website     = EXCLUDED.website,
          phone       = EXCLUDED.phone,
          confidence  = EXCLUDED.confidence,
          lat         = EXCLUDED.lat,
          lng         = EXCLUDED.lng,
          location    = EXCLUDED.location,
          updated_at  = NOW()
    """]

    print('\n  Loading into PostgreSQL...')
    result = subprocess.run(psql_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'  ERROR: {result.stderr}')
        raise RuntimeError(f'psql COPY failed: {result.stderr}')
    print(f'  psql output: {result.stdout.strip()}')

    # Record in refresh log
    subprocess.run([
        'psql', DATABASE_URL, '-c',
        f"""
        INSERT INTO venue_refresh_log(source, started_at, completed_at, rows_upserted)
        VALUES ('overture', NOW() - INTERVAL '5 minutes', NOW(), {sum(cat_counts.values())})
        """
    ], capture_output=True)

    # Cleanup temp file
    os.unlink(csvpath)

    print('\n=== ETL complete ===')
    return cat_counts


def main():
    parser = argparse.ArgumentParser(description='Load Overture Maps venues into DateMeUp DB')
    parser.add_argument('--dry-run', action='store_true', help='Query only, do not write to DB')
    parser.add_argument('--state', help='Filter to a single US state abbreviation (e.g. CO)')
    parser.add_argument('--category', help='Single category slug to load (e.g. restaurants-dining)')
    parser.add_argument('--phase', choices=['1', '2', 'all'], default='1', help='Which phase of categories to load')
    args = parser.parse_args()

    if args.category:
        cats = {args.category}
    elif args.phase == '1':
        cats = PHASE1_CATEGORIES
    elif args.phase == '2':
        cats = PHASE2_CATEGORIES
    else:
        cats = ALL_CATEGORIES

    counts = run_etl(
        categories=cats,
        dry_run=args.dry_run,
        state_filter=args.state,
    )

    print('\nFinal counts:')
    for cat, cnt in sorted(counts.items()):
        print(f'  {cat}: {cnt:,}')
    print(f'  GRAND TOTAL: {sum(counts.values()):,}')


if __name__ == '__main__':
    main()
