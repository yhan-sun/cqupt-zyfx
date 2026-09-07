import argparse
import hashlib
import io
import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--offline', action='store_true')
args = parser.parse_args()
cache = root / '.cache' / 'official'
output = root / 'dist' / 'media' / 'official'
cache.mkdir(parents=True, exist_ok=True)
output.mkdir(parents=True, exist_ok=True)
Image.MAX_IMAGE_PIXELS = 16_000_000
items = json.loads((root / 'data' / 'official-media.json').read_text())

for item in items:
    cached = cache / (item['id'] + '.source')
    if cached.exists():
        raw = cached.read_bytes()
    elif args.offline:
        raise RuntimeError('Missing offline official image: ' + item['id'])
    else:
        raw = None
        for attempt in range(3):
            try:
                request = urllib.request.Request(
                    item['url'],
                    headers={
                        'User-Agent': 'Mozilla/5.0 (compatible; CQUPT-Running-Archive/1.0; +https://github.com/yhan-sun/cqupt-zyfx)',
                        'Referer': 'https://mp.weixin.qq.com/'
                    }
                )
                with urllib.request.urlopen(request, timeout=30) as response:
                    candidate = response.read(5_000_001)
                if len(candidate) < 1000 or len(candidate) > 5_000_000:
                    raise ValueError('Unexpected image size: ' + item['id'])
                if hashlib.sha256(candidate).hexdigest() != item['sha256']:
                    raise ValueError('Official image source changed; review required: ' + item['id'])
                raw = candidate
                cached.write_bytes(raw)
                break
            except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
                if attempt == 2:
                    raise
                delay = 3 * (attempt + 1)
                print('Retry official image', item['id'], 'in', delay, 'seconds:', error, flush=True)
                time.sleep(delay)
        if raw is None:
            raise RuntimeError('Could not retrieve official image: ' + item['id'])
    if hashlib.sha256(raw).hexdigest() != item['sha256']:
        raise ValueError('Invalid cached official image: ' + item['id'])
    with Image.open(io.BytesIO(raw)) as probe:
        probe.verify()
    with Image.open(io.BytesIO(raw)) as image:
        image.load()
        if image.size != (item['width'], item['height']):
            raise ValueError('Unexpected dimensions: ' + item['id'])
        rgb = image.convert('RGB')
        rgb.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        rgb.save(output / (item['id'] + '.webp'), 'WEBP', quality=82, method=6)
        item['builtWidth'], item['builtHeight'] = rgb.size
    print('Official image', item['id'], item['width'], 'x', item['height'], 'SHA-256 verified', flush=True)

(output / 'credits.json').write_text(json.dumps(items, ensure_ascii=False, indent=2))
