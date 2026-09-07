import argparse
import hashlib
import io
import json
import time
import urllib.request
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--offline', action='store_true')
args = parser.parse_args()
cache = root / '.cache' / 'science'
output = root / 'dist' / 'media' / 'science'
cache.mkdir(parents=True, exist_ok=True)
output.mkdir(parents=True, exist_ok=True)
Image.MAX_IMAGE_PIXELS = 12_000_000
items = json.loads((root / 'data' / 'science-media.json').read_text())
for item in items:
    cached = cache / item['filename']
    if cached.exists():
        raw = cached.read_bytes()
    elif args.offline:
        raise RuntimeError('Missing offline movement: ' + item['id'])
    else:
        for attempt in range(3):
            try:
                req = urllib.request.Request(item['url'], headers={'User-Agent': 'CQUPT-Running-Education/1.0 (https://github.com/yhan-sun/cqupt-zyfx)'})
                with urllib.request.urlopen(req, timeout=25) as response:
                    raw = response.read(8_000_001)
                if len(raw) < 100 or len(raw) > 8_000_000:
                    raise ValueError('Invalid media size: ' + item['id'])
                if hashlib.sha256(raw).hexdigest() != item['sha256']:
                    raise ValueError('Source changed; review required: ' + item['id'])
                cached.write_bytes(raw)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2 + attempt)
    if hashlib.sha256(raw).hexdigest() != item['sha256']:
        raise ValueError('Invalid cached source: ' + item['id'])
    with Image.open(io.BytesIO(raw)) as probe:
        probe.verify()
    with Image.open(io.BytesIO(raw)) as image:
        if image.size != (item['width'], item['height']) or getattr(image, 'n_frames', 1) != item['frames']:
            raise ValueError('Unexpected dimensions or frame count: ' + item['id'])
        for frame in range(item['frames']):
            image.seek(frame)
            image.load()
        image.seek(item['posterFrame'])
        rgba = image.convert('RGBA')
        poster = Image.new('RGBA', image.size, 'white')
        poster.alpha_composite(rgba)
        poster.convert('RGB').save(output / (item['id'] + '.webp'), quality=90, method=6)
    if item['frames'] > 1:
        (output / (item['id'] + '.gif')).write_bytes(raw)
    print('Movement', item['id'], str(item['frames']) + ' frames, SHA-256 verified')
(output / 'credits.json').write_text(json.dumps(items, ensure_ascii=False, indent=2))
