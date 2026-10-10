#!/usr/bin/env python3
"""
DateMeUp — OSM Trails + NPS Parks + IMLS Museums ETL (Phase 2)
================================================================
Loads:
  1. OSM trails/parks via Overpass API → venues_osm table (ODbL isolation)
  2. NPS parks (public domain) → venues table
  3. IMLS museums (public domain) → venues table

Usage:
  python3 load-osm-trails.py [--source osm|nps|imls|all] [--dry-run]

ODbL isolation: OSM data goes ONLY to venues_osm, never to venues.
Government data (NPS, IMLS) goes to venues (public domain, no license conflict).
"""

import os
import sys
import json
import uuid
import time
import csv
import tempfile
import argparse
import subprocess
import urllib.request
import urllib.parse
import urllib.error

DATABASE_URL = os.environ.get('DATABASE_URL', '')
if not DATABASE_URL:
    DB_HOST = os.environ.get('DB_HOST', '34.56.29.20')
    DB_USER = os.environ.get('DB_USER', 'datenight')
    DB_PASS = os.environ.get('DB_PASS', '')
    DB_NAME = os.environ.get('DB_NAME', 'datenight')
    DATABASE_URL = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}'

NPS_API_KEY = os.environ.get('NPS_API_KEY', '')
OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
HEADERS = {'User-Agent': 'DateMeUp/1.0 (datemeup.app)'}

# ── Overpass → OSM trail/park query ──────────────────────────────────────────
# We query trails and parks via the Overpass API (not bulk OSM download)
# to avoid ODbL share-alike triggering from a derivative DB perspective.
# Overpass API results are placed ONLY in venues_osm (isolated ODbL table).

OVERPASS_TRAIL_QUERY = """
[out:json][timeout:300];
area["ISO3166-1"="US"]->.usa;
(
  way["highway"="path"]["name"](area.usa);
  way["highway"="footway"]["name"](area.usa);
  relation["route"="hiking"]["name"](area.usa);
  node["leisure"="park"]["name"](area.usa);
  way["leisure"="park"]["name"](area.usa);
  node["leisure"="nature_reserve"]["name"](area.usa);
  way["leisure"="nature_reserve"]["name"](area.usa);
);
out center tags 100000;
"""

# NPS API: free, public domain, no attribution required for data use
NPS_PARKS_URL = 'https://developer.nps.gov/api/v1/parks'

# IMLS Museum Data File: public domain, direct download
# https://www.imls.gov/research-evaluation/data-collection/museum-data-files
IMLS_CSV_URL = 'https://www.imls.gov/sites/default/files/research-tools/museums-in-the-united-states-csv.zip'


def psql_copy(rows: list[dict], table: str, columns: list[str]) -> int:
    """Bulk insert rows into table via psql COPY from CSV."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
        csvpath = f.name
        writer = csv.DictWriter(f, fieldnames=columns, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(rows)

    col_list = ', '.join(columns)
    upsert_set = ', '.join(
        f'{c} = EXCLUDED.{c}'
        for c in columns
        if c not in ('id', 'created_at')
    )

    cmd = ['psql', DATABASE_URL, '-c', f"""
        \\COPY {table}({col_list})
        FROM '{csvpath}' CSV HEADER
        ON CONFLICT (id) DO UPDATE SET {upsert_set}
    """]

    result = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(csvpath)

    if result.returncode != 0:
        print(f'    psql ERROR: {result.stderr[:500]}')
        return 0

    # Parse "COPY N" from output
    out = result.stdout.strip()
    try:
        return int(out.split(' ')[-1])
    except Exception:
        return len(rows)


def load_osm_trails(dry_run: bool = False) -> int:
    """
    Query Overpass API for US trails and parks.
    Results go to venues_osm (ODbL-isolated table).
    Uses chunked US bounding boxes to avoid Overpass timeout.
    """
    print('\n=== Phase 2a: OSM Trails + Parks (Overpass API) ===')
    print('  Data goes to venues_osm (ODbL isolated)')

    # US bounding boxes (chunked to avoid Overpass timeout)
    # Format: (name, south, west, north, east)
    US_CHUNKS = [
        # Northeast
        ('northeast', 40.0, -80.0, 47.5, -67.0),
        # Southeast
        ('southeast', 24.5, -88.0, 40.0, -74.0),
        # Midwest
        ('midwest', 36.0, -104.0, 49.5, -80.0),
        # South Central
        ('southcentral', 25.0, -106.0, 37.0, -88.0),
        # Mountain West
        ('mountain', 31.0, -116.0, 49.5, -104.0),
        # Pacific
        ('pacific', 32.0, -124.5, 49.5, -116.0),
        # Alaska (skip for now — very sparse)
        # Hawaii (skip for now)
    ]

    total = 0
    rows = []

    for chunk_name, south, west, north, east in US_CHUNKS:
        query = f"""
[out:json][timeout:180];
(
  way["highway"="path"]["name"]({south},{west},{north},{east});
  way["highway"="footway"]["name"]({south},{west},{north},{east});
  relation["route"="hiking"]["name"]({south},{west},{north},{east});
  node["leisure"="park"]["name"]({south},{west},{north},{east});
  way["leisure"="park"]["name"]["leisure"!="garden"]({south},{west},{north},{east});
  node["leisure"="nature_reserve"]["name"]({south},{west},{north},{east});
  way["leisure"="nature_reserve"]["name"]({south},{west},{north},{east});
);
out center tags 5000;
"""
        print(f'  Querying Overpass for {chunk_name}...')
        try:
            data = query.encode('utf-8')
            req = urllib.request.Request(
                OVERPASS_URL,
                data=data,
                headers={**HEADERS, 'Content-Type': 'application/x-www-form-urlencoded'},
                method='POST',
            )
            req_data = urllib.parse.urlencode({'data': query}).encode('utf-8')
            req = urllib.request.Request(OVERPASS_URL, data=req_data, headers=HEADERS, method='POST')
            with urllib.request.urlopen(req, timeout=200) as resp:
                result = json.loads(resp.read().decode('utf-8'))

            elements = result.get('elements', [])
            print(f'    {len(elements)} elements')

            for el in elements:
                tags = el.get('tags', {})
                name = tags.get('name', '')
                if not name:
                    continue

                # Get lat/lng from center or direct
                if 'center' in el:
                    lat = el['center']['lat']
                    lng = el['center']['lon']
                elif 'lat' in el:
                    lat = el['lat']
                    lng = el['lon']
                else:
                    continue

                # Determine category
                highway = tags.get('highway', '')
                leisure = tags.get('leisure', '')
                route = tags.get('route', '')

                if route == 'hiking' or highway in ('path', 'footway'):
                    cat = 'hiking-trails'
                elif leisure in ('park', 'nature_reserve'):
                    cat = 'hiking-trails'  # parks/reserves in the outdoors category
                else:
                    cat = 'hiking-trails'

                osm_id = el.get('id', 0)
                osm_type = el.get('type', 'node')
                rid = f'osm-{osm_type}-{osm_id}'

                rows.append({
                    'id': rid,
                    'osm_id': osm_id,
                    'osm_type': osm_type,
                    'name': name,
                    'category': cat,
                    'osm_tags': json.dumps(tags),
                    'address': tags.get('addr:full', ''),
                    'city': tags.get('addr:city', ''),
                    'state': tags.get('addr:state', ''),
                    'lat': lat,
                    'lng': lng,
                    'location': f'SRID=4326;POINT({lng} {lat})',
                })
                total += 1

            # Polite delay between chunks
            time.sleep(2)

        except Exception as e:
            print(f'    ERROR querying {chunk_name}: {e}')
            continue

    print(f'\n  Total OSM records collected: {total:,}')
    if not dry_run and rows:
        print('  Loading into venues_osm...')
        n = psql_copy(rows, 'venues_osm', [
            'id', 'osm_id', 'osm_type', 'name', 'category',
            'osm_tags', 'address', 'city', 'state', 'lat', 'lng', 'location',
        ])
        print(f'  Loaded {n:,} rows into venues_osm')

    return total


def load_nps_parks(dry_run: bool = False) -> int:
    """
    Load all NPS parks from the NPS API.
    Data is public domain — goes to venues table.
    """
    print('\n=== Phase 2b: NPS Parks (public domain) ===')

    if not NPS_API_KEY:
        print('  WARNING: NPS_API_KEY not set. Using demo key (low rate limit).')
        api_key = 'DEMO_KEY'
    else:
        api_key = NPS_API_KEY

    parks = []
    start = 0
    limit = 50

    while True:
        url = f'{NPS_PARKS_URL}?limit={limit}&start={start}&api_key={api_key}'
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode('utf-8'))

            batch = data.get('data', [])
            if not batch:
                break

            parks.extend(batch)
            total_avail = int(data.get('total', 0))
            start += len(batch)
            print(f'  Fetched {len(parks)}/{total_avail} parks...')

            if start >= total_avail:
                break

            time.sleep(0.5)

        except Exception as e:
            print(f'  Error fetching NPS parks at offset {start}: {e}')
            break

    print(f'  Total NPS parks: {len(parks)}')

    rows = []
    for park in parks:
        lat_s = park.get('latitude', '')
        lng_s = park.get('longitude', '')
        if not lat_s or not lng_s:
            continue

        try:
            lat = float(lat_s)
            lng = float(lng_s)
        except ValueError:
            continue

        name = park.get('fullName', park.get('name', ''))
        park_code = park.get('parkCode', '')
        description = park.get('description', '')
        state = park.get('states', '')  # comma-separated state codes

        rid = f'nps-{park_code}'
        rows.append({
            'id': rid,
            'overture_id': None,
            'name': name,
            'category': 'hiking-trails',
            'fsq_category': 'national_park',
            'address': '',
            'city': '',
            'state': state,
            'country': 'US',
            'lat': lat,
            'lng': lng,
            'location': f'SRID=4326;POINT({lng} {lat})',
            'source': 'nps',
            'confidence': 1.0,
            'website': f'https://www.nps.gov/{park_code}/',
        })

    print(f'  NPS parks with coordinates: {len(rows)}')

    if not dry_run and rows:
        print('  Loading into venues...')
        n = psql_copy(rows, 'venues', [
            'id', 'overture_id', 'name', 'category', 'fsq_category',
            'address', 'city', 'state', 'country', 'lat', 'lng',
            'location', 'source', 'confidence', 'website',
        ])
        print(f'  Loaded {n} NPS parks into venues')

    return len(rows)


def load_imls_museums(dry_run: bool = False) -> int:
    """
    Load IMLS museum data (public domain).
    Direct CSV download from IMLS website → venues table.
    """
    import io
    import zipfile

    print('\n=== Phase 2c: IMLS Museums (public domain) ===')

    # Try to download the IMLS CSV
    # The file URL may change; fall back to a known stable version
    IMLS_URLS = [
        'https://www.imls.gov/sites/default/files/research-tools/mus22q3_imls_museum_file_q3_fy2022.csv',
        'https://www.imls.gov/sites/default/files/research-tools/museums-in-the-united-states-csv.zip',
        # Direct CSV fallback URL from IMLS data portal
        'https://raw.githubusercontent.com/IMLS/museum-data/main/museums.csv',
    ]

    csv_content = None
    for url in IMLS_URLS:
        try:
            print(f'  Trying: {url}')
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read()

            if url.endswith('.zip'):
                with zipfile.ZipFile(io.BytesIO(raw)) as z:
                    # Find the CSV inside
                    csv_names = [n for n in z.namelist() if n.endswith('.csv')]
                    if csv_names:
                        csv_content = z.read(csv_names[0]).decode('utf-8', errors='replace')
                        break
            else:
                csv_content = raw.decode('utf-8', errors='replace')
                break
        except Exception as e:
            print(f'  Failed: {e}')
            continue

    if not csv_content:
        print('  WARNING: Could not download IMLS data. Skipping.')
        return 0

    reader = csv.DictReader(io.StringIO(csv_content))
    rows = []

    for row in reader:
        # IMLS columns vary by year; try common names
        name = (row.get('COMMONNAME') or row.get('LEGALNAME') or
                row.get('commonname') or row.get('museum_name') or '').strip()
        if not name:
            continue

        lat_s = (row.get('LATITUDE') or row.get('latitude') or '').strip()
        lng_s = (row.get('LONGITUDE') or row.get('longitude') or '').strip()

        try:
            lat = float(lat_s)
            lng = float(lng_s)
        except (ValueError, TypeError):
            continue

        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            continue

        city = (row.get('CITY') or row.get('city') or '').strip()
        state = (row.get('STATE') or row.get('state') or '').strip()
        address = (row.get('ADDRESS') or row.get('address') or '').strip()
        museum_id = (row.get('MID') or row.get('mid') or row.get('EIN') or
                     row.get('ein') or str(uuid.uuid4())).strip()
        website = (row.get('WEBURL') or row.get('weburl') or '').strip()
        discipline = (row.get('DISCIPL') or row.get('discipline') or '').strip()

        # Map discipline to category
        cat = 'arts-culture'
        if any(k in discipline.upper() for k in ('HIST', 'HISTORIC')):
            cat = 'arts-culture'
        elif any(k in discipline.upper() for k in ('SCI', 'SCIENCE', 'NAT')):
            cat = 'arts-culture'
        elif any(k in discipline.upper() for k in ('ART', 'GALLERY')):
            cat = 'arts-culture'
        elif any(k in discipline.upper() for k in ('ZOO', 'AQUAR')):
            cat = 'family-events'
        elif any(k in discipline.upper() for k in ('CHILD')):
            cat = 'family-events'

        rid = f'imls-{museum_id}'
        rows.append({
            'id': rid,
            'name': name,
            'category': cat,
            'fsq_category': f'museum_{discipline.lower()}' if discipline else 'museum',
            'address': address,
            'city': city,
            'state': state,
            'country': 'US',
            'lat': lat,
            'lng': lng,
            'location': f'SRID=4326;POINT({lng} {lat})',
            'source': 'imls',
            'confidence': 1.0,
            'website': website,
        })

    print(f'  IMLS museums with coordinates: {len(rows):,}')
    print(f'  arts-culture: {sum(1 for r in rows if r["category"] == "arts-culture"):,}')
    print(f'  family-events: {sum(1 for r in rows if r["category"] == "family-events"):,}')

    if not dry_run and rows:
        print('  Loading into venues...')
        n = psql_copy(rows, 'venues', [
            'id', 'name', 'category', 'fsq_category',
            'address', 'city', 'state', 'country', 'lat', 'lng',
            'location', 'source', 'confidence', 'website',
        ])
        print(f'  Loaded {n} IMLS museums into venues')

    return len(rows)


def main():
    parser = argparse.ArgumentParser(description='Load OSM/NPS/IMLS venues into DateMeUp DB')
    parser.add_argument('--source', choices=['osm', 'nps', 'imls', 'all'], default='all')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    totals = {}

    if args.source in ('osm', 'all'):
        totals['osm'] = load_osm_trails(dry_run=args.dry_run)

    if args.source in ('nps', 'all'):
        totals['nps'] = load_nps_parks(dry_run=args.dry_run)

    if args.source in ('imls', 'all'):
        totals['imls'] = load_imls_museums(dry_run=args.dry_run)

    print('\n=== Phase 2 ETL Complete ===')
    for src, cnt in totals.items():
        print(f'  {src}: {cnt:,} rows')
    print(f'  TOTAL: {sum(totals.values()):,}')


if __name__ == '__main__':
    main()
