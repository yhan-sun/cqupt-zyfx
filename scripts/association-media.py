import hashlib
import io
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = root / 'data' / 'association-photos'
output = root / 'dist' / 'assets' / 'photos'
output.mkdir(parents=True, exist_ok=True)
items = json.loads((root / 'data' / 'association-media.json').read_text())

for item in items:
    filename = item['id'] + '.webp'
    path = source / filename
    if not path.exists():
        raise RuntimeError('Missing association photo: ' + item['id'])
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != item['sha256']:
        raise RuntimeError('Association photo hash mismatch: ' + item['id'])
    with Image.open(io.BytesIO(raw)) as image:
        image.verify()
    with Image.open(io.BytesIO(raw)) as image:
        if image.format != 'WEBP' or image.size != (item['width'], item['height']):
            raise RuntimeError('Association photo dimensions/format changed: ' + item['id'])
    (output / filename).write_bytes(raw)
    print('Association photo', item['id'], f"{item['width']}x{item['height']}", 'SHA-256 verified', flush=True)
