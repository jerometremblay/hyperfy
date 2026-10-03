#!/usr/bin/env python3
import argparse, base64, json, struct
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('hyp')
    ap.add_argument('output')
    ap.add_argument('--template', default=str(Path(__file__).resolve().parents[1] / 'viewer' / 'hyp_primitive_viewer_template.html'))
    args = ap.parse_args()
    hyp = Path(args.hyp).read_bytes()
    hs = struct.unpack('<I', hyp[:4])[0]
    header = json.loads(hyp[4:4+hs])
    title = f"{header.get('blueprint',{}).get('name','Hyperfy App')} — interactive .hyp preview"
    template = Path(args.template).read_text()
    if '__EMBEDDED_HYP__' not in template:
        raise SystemExit('viewer template missing __EMBEDDED_HYP__ placeholder')
    out = template.replace('__EMBEDDED_HYP__', base64.b64encode(hyp).decode('ascii'))
    out = out.replace('Hyperfy App — interactive .hyp preview', title)
    Path(args.output).write_text(out)
    print(args.output)


if __name__ == '__main__':
    main()
