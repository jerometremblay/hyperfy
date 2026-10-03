#!/usr/bin/env python3
import argparse, hashlib, json, struct
from pathlib import Path


def make_minimal_glb() -> bytes:
    doc = {
        'asset': {'version': '2.0', 'generator': 'hyperfy-hyp-app-authoring'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': [{'name': 'HyperfyRoot'}],
    }
    raw = json.dumps(doc, separators=(',', ':')).encode()
    raw += b' ' * ((-len(raw)) % 4)
    total = 12 + 8 + len(raw)
    return struct.pack('<4sII', b'glTF', 2, total) + struct.pack('<I4s', len(raw), b'JSON') + raw


def asset_url(data: bytes, ext: str) -> str:
    return f"asset://{hashlib.sha256(data).hexdigest()}.{ext}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('script')
    ap.add_argument('output')
    ap.add_argument('--name', default='Hyperfy Primitive App')
    ap.add_argument('--id', dest='app_id', default='hyperfy-primitive-app')
    ap.add_argument('--author', default='OpenAI')
    ap.add_argument('--description', default='Primitive-only Hyperfy app')
    args = ap.parse_args()

    script = Path(args.script).read_bytes()
    model = make_minimal_glb()
    script_url = asset_url(script, 'js')
    model_url = asset_url(model, 'glb')
    blueprint = {
        'id': args.app_id,
        'version': 0,
        'name': args.name,
        'image': None,
        'author': args.author,
        'url': None,
        'desc': args.description,
        'model': model_url,
        'script': script_url,
        'props': {},
        'preload': False,
        'public': False,
        'locked': False,
        'unique': False,
        'disabled': False,
    }
    assets = [
        {'type':'model','url':model_url,'size':len(model),'mime':'model/gltf-binary'},
        {'type':'script','url':script_url,'size':len(script),'mime':'text/javascript'},
    ]
    header = json.dumps({'blueprint': blueprint, 'assets': assets}, separators=(',', ':')).encode()
    Path(args.output).write_bytes(struct.pack('<I', len(header)) + header + model + script)
    print(args.output)


if __name__ == '__main__':
    main()
