import argparse
import hashlib
import io
import json
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--offline', action='store_true')
args = parser.parse_args()
cache = root / '.cache'
output = root / 'dist' / 'media'
cache.mkdir(exist_ok=True)
output.mkdir(parents=True, exist_ok=True)
items = json.loads((root / 'data' / 'media.json').read_text())
processed = []
Image.MAX_IMAGE_PIXELS = 35_000_000

for item in items:
    identity = hashlib.sha256(item['url'].encode()).hexdigest()[:16]
    cached = cache / f"{item['id']}-{identity}.source"
    legacy = cache / f"{item['id']}.source"
    if cached.exists():
        raw = cached.read_bytes()
    elif args.offline and legacy.exists():
        raw = legacy.read_bytes()
    elif args.offline:
        raise RuntimeError(f"Offline source missing: {item['id']}")
    else:
        for attempt in range(3):
            try:
                req = urllib.request.Request(item['url'], headers={'User-Agent': 'Mozilla/5.0 (CQUPT-Running-Website; public source attribution in sources.html)'})
                with urllib.request.urlopen(req, timeout=25) as response:
                    raw = response.read(15_000_001)
                if len(raw) > 15_000_000 or len(raw) < 100:
                    raise ValueError(f"Invalid image size: {item['id']}")
                with Image.open(io.BytesIO(raw)) as probe:
                    probe.verify()
                cached.write_bytes(raw)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(1 + attempt)
    with Image.open(io.BytesIO(raw)) as source:
        image = ImageOps.exif_transpose(source)
        if item['format'] == 'png':
            image = image.convert('RGBA')
            image.save(output / f"{item['id']}.png", optimize=True)
        else:
            image = image.convert('RGB')
            image.thumbnail((1920, 1440), Image.Resampling.LANCZOS)
            image.save(output / f"{item['id']}.webp", quality=84, method=6)
        metadata = dict(item, width=image.width, height=image.height)
        if image.width > 700 and item['format'] == 'webp':
            smaller = image.copy()
            smaller.thumbnail((640, 640), Image.Resampling.LANCZOS)
            smaller.save(output / f"{item['id']}-small.webp", quality=81, method=6)
            metadata['smallWidth'] = smaller.width
        processed.append(metadata)
        print(f"Media {item['id']}: {image.width}x{image.height}")
(output / 'credits.json').write_text(json.dumps(processed, ensure_ascii=False, indent=2))
