#!/usr/bin/env python3
import argparse, json, struct
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('hyp')
    ap.add_argument('destination')
    args = ap.parse_args()

    data = Path(args.hyp).read_bytes()
    hs = struct.unpack('<I', data[:4])[0]
    header = json.loads(data[4:4+hs])
    out = Path(args.destination)
    out.mkdir(parents=True, exist_ok=True)
    (out/'header.json').write_text(json.dumps(header, indent=2))
    p = 4 + hs
    for asset in header.get('assets', []):
        blob = data[p:p+asset['size']]
        p += asset['size']
        name = asset['url'].split('asset://',1)[-1]
        (out/name).write_bytes(blob)
    if p != len(data):
        raise SystemExit(f'trailing bytes: parsed={p}, total={len(data)}')
    print(out)


if __name__ == '__main__':
    main()
