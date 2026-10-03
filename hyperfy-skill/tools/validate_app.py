#!/usr/bin/env python3
import argparse, hashlib, json, struct
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('hyp')
    args = ap.parse_args()
    data = Path(args.hyp).read_bytes()
    if len(data) < 4:
        raise SystemExit('invalid .hyp: too small')
    hs = struct.unpack('<I', data[:4])[0]
    header = json.loads(data[4:4+hs])
    bp = header.get('blueprint', {})
    if not bp.get('model'):
        raise SystemExit('invalid .hyp: blueprint.model must not be null')
    if not bp.get('script'):
        raise SystemExit('invalid .hyp: blueprint.script missing')
    p = 4 + hs
    seen = set()
    for asset in header.get('assets', []):
        size = asset.get('size')
        if not isinstance(size, int) or size < 0:
            raise SystemExit('invalid asset size')
        blob = data[p:p+size]
        if len(blob) != size:
            raise SystemExit('truncated asset')
        p += size
        seen.add(asset.get('url'))
        filename = asset.get('url','').split('asset://',1)[-1]
        digest = hashlib.sha256(blob).hexdigest()
        if filename and not filename.startswith(digest):
            raise SystemExit(f'asset hash/url mismatch: {asset.get("url")}')
    if p != len(data):
        raise SystemExit('invalid .hyp: trailing bytes')
    if bp['model'] not in seen or bp['script'] not in seen:
        raise SystemExit('blueprint references missing packaged assets')
    print(json.dumps({'valid': True, 'name': bp.get('name'), 'assets': len(seen)}, indent=2))


if __name__ == '__main__':
    main()
