import base64
import hashlib
import io
import json
import zipfile
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parent.parent
data=json.loads((root/'data'/'association.json').read_text())
raw=base64.b64decode((root/'data'/'association-media.b64').read_text().strip(),validate=True)
if hashlib.sha256(raw).hexdigest()!='c7e9df1f24f4df2d7331c8b9a65fb330efac1807c02cf5e6d6c270b117a666de':
    raise RuntimeError('Association media bundle hash mismatch')
out=root/'dist'/'media'/'association'
out.mkdir(parents=True,exist_ok=True)
expected={item['filename']:item for item in data['media']}
with zipfile.ZipFile(io.BytesIO(raw)) as archive:
    files={name for name in archive.namelist() if not name.endswith('/')}
    if files!=set(expected):
        raise RuntimeError('Association media file set changed')
    for name,item in expected.items():
        blob=archive.read(name)
        if hashlib.sha256(blob).hexdigest()!=item['sha256']:
            raise RuntimeError('Association media hash mismatch: '+name)
        with Image.open(io.BytesIO(blob)) as image:
            image.verify()
        with Image.open(io.BytesIO(blob)) as image:
            if image.format!='WEBP' or image.size!=(item['width'],item['height']):
                raise RuntimeError('Association media dimensions changed: '+name)
        (out/name).write_bytes(blob)
        print('Association image',item['id'],item['width'],'x',item['height'],'SHA-256 verified',flush=True)
(out/'credits.json').write_text(json.dumps(data['media'],ensure_ascii=False,indent=2))
