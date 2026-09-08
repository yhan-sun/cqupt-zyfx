import base64,hashlib,io,json,zipfile
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
dist=root/'dist'/'assets'/'photos';dist.mkdir(parents=True,exist_ok=True)
items=json.loads((root/'data'/'association-media.json').read_text())
parts=sorted((root/'data'/'association-photo-pack').glob('part-*.txt'))
if not parts: raise RuntimeError('Association photo payload parts are missing')
payload=base64.b64decode(''.join(p.read_text().strip() for p in parts),validate=True)
with zipfile.ZipFile(io.BytesIO(payload)) as archive:
    names=set(archive.namelist())
    expected={item['id']+'.webp' for item in items}
    if names!=expected: raise RuntimeError('Association photo pack contents changed')
    for item in items:
        filename=item['id']+'.webp';raw=archive.read(filename)
        if hashlib.sha256(raw).hexdigest()!=item['sha256']:
            raise RuntimeError('Association photo hash mismatch: '+item['id'])
        with Image.open(io.BytesIO(raw)) as im:
            im.verify()
        with Image.open(io.BytesIO(raw)) as im:
            if im.format!='WEBP' or im.size!=(item['width'],item['height']):
                raise RuntimeError('Association photo dimensions/format changed: '+item['id'])
        (dist/filename).write_bytes(raw)
        print('Association photo',item['id'],f"{item['width']}x{item['height']}",'SHA-256 verified',flush=True)
