#!/usr/bin/env python3
"""Validate a Hyperfy source script, .hyp package, or result ZIP before delivery."""

import argparse
import hashlib
import json
import shutil
import struct
import subprocess
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NODE = shutil.which('node')


def fail(message):
    raise SystemExit(f'validation failed: {message}')


def run_node(args, label):
    if not NODE:
        fail('node is required for the source/runtime preflight')
    result = subprocess.run([NODE, *args], text=True, capture_output=True)
    if result.returncode:
        details = (result.stdout + result.stderr).strip()
        fail(f'{label}\n{details}')
    return result.stdout.strip()


def smoke_script(path, label):
    run_node(['--check', str(path)], f'{label}: JavaScript syntax check failed')
    return run_node(
        [str(ROOT/'tools/smoke_test.js'), str(path)],
        f'{label}: Hyperfy primitive preflight failed',
    )


def parse_hyp(data, label):
    if len(data) < 4:
        fail(f'{label}: .hyp is too small')

    header_size = struct.unpack('<I', data[:4])[0]
    header_end = 4 + header_size
    if header_end > len(data):
        fail(f'{label}: truncated header')
    try:
        header = json.loads(data[4:header_end])
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        fail(f'{label}: invalid header JSON ({error})')
    if not isinstance(header, dict):
        fail(f'{label}: header must be an object')

    blueprint = header.get('blueprint')
    assets = header.get('assets')
    if not isinstance(blueprint, dict) or not isinstance(assets, list):
        fail(f'{label}: header must contain blueprint and assets')

    payloads = {}
    offset = header_end
    for index, asset in enumerate(assets):
        if not isinstance(asset, dict):
            fail(f'{label}: asset {index} is not an object')
        url = asset.get('url')
        size = asset.get('size')
        if not isinstance(url, str) or not url.startswith('asset://'):
            fail(f'{label}: asset {index} has an invalid URL')
        if url in payloads:
            fail(f'{label}: duplicate asset URL {url}')
        if not isinstance(size, int) or size < 0:
            fail(f'{label}: asset {index} has an invalid size')
        end = offset + size
        if end > len(data):
            fail(f'{label}: asset {index} is truncated')
        blob = data[offset:end]
        digest = hashlib.sha256(blob).hexdigest()
        filename = url.removeprefix('asset://')
        if not filename.startswith(digest + '.'):
            fail(f'{label}: asset hash/URL mismatch for {url}')
        payloads[url] = (asset, blob)
        offset = end

    if offset != len(data):
        fail(f'{label}: trailing bytes after the declared asset payloads')

    script_url = blueprint.get('script')
    if not isinstance(script_url, str) or not script_url.startswith('asset://'):
        fail(f'{label}: blueprint.script is missing or invalid')
    script_asset = payloads.get(script_url)
    if not script_asset:
        fail(f'{label}: blueprint.script does not reference a packaged asset')
    if script_asset[0].get('type') != 'script':
        fail(f'{label}: blueprint.script does not reference a script asset')

    model = blueprint.get('model')
    if not model:
        fail(f'{label}: blueprint.model is missing')
    if model != 'script-only' and model not in payloads:
        fail(f'{label}: blueprint.model does not reference a packaged asset')

    for key in ('image',):
        reference = blueprint.get(key)
        if isinstance(reference, str) and reference.startswith('asset://') and reference not in payloads:
            fail(f'{label}: blueprint.{key} does not reference a packaged asset')

    return header, script_asset[1]


def validate_hyp(data, label, temp_dir):
    header, script = parse_hyp(data, label)
    script_path = temp_dir / f'{len(list(temp_dir.iterdir()))}-script.js'
    script_path.write_bytes(script)
    smoke = smoke_script(script_path, label)
    return header, smoke


def prompt_box_targets(manifest):
    if manifest.get('format') != 'hyperfy-prompt-box':
        return None, None
    request_id = manifest.get('requestId')
    targets = set()
    box = manifest.get('box')
    if isinstance(box, dict) and box.get('entityId'):
        targets.add(box['entityId'])
    for intersection in manifest.get('intersections', []):
        if isinstance(intersection, dict) and intersection.get('entityId'):
            targets.add(intersection['entityId'])
    return request_id, targets


def validate_zip(path, temp_dir):
    try:
        archive = zipfile.ZipFile(path)
    except zipfile.BadZipFile as error:
        fail(f'{path}: invalid ZIP ({error})')

    with archive:
        bad_name = archive.testzip()
        if bad_name:
            fail(f'{path}: corrupt ZIP entry {bad_name}')
        names = archive.namelist()
        if len(names) != len(set(names)):
            fail(f'{path}: duplicate ZIP entry names')

        manifest = None
        if 'manifest.json' in names:
            try:
                manifest = json.loads(archive.read('manifest.json'))
            except (UnicodeDecodeError, json.JSONDecodeError) as error:
                fail(f'{path}: invalid manifest.json ({error})')
        request_id, targets = prompt_box_targets(manifest or {})

        hyp_names = [name for name in names if name.lower().endswith('.hyp')]
        if not hyp_names:
            fail(f'{path}: ZIP contains no .hyp package')
        results = []
        for name in hyp_names:
            header, smoke = validate_hyp(archive.read(name), f'{path}:{name}', temp_dir)
            props = header['blueprint'].get('props') or {}
            if request_id and not props.get('promptBox'):
                if props.get('promptBoxRequestId') != request_id:
                    fail(f'{path}:{name}: prompt-box request ID does not match manifest.json')
                if targets and props.get('promptBoxTargetEntityId') not in targets:
                    fail(f'{path}:{name}: prompt-box target does not match manifest.json')
            results.append({'name': name, 'smoke': smoke})
        return results


def main():
    parser = argparse.ArgumentParser(
        description='Validate Hyperfy JavaScript, .hyp, or result ZIP before delivery.'
    )
    parser.add_argument('path', type=Path)
    args = parser.parse_args()
    if not args.path.is_file():
        fail(f'file not found: {args.path}')

    with tempfile.TemporaryDirectory(prefix='hyperfy-validate-') as directory:
        temp_dir = Path(directory)
        suffix = args.path.suffix.lower()
        if suffix == '.js':
            result = {'type': 'script', 'smoke': smoke_script(args.path, str(args.path))}
        elif suffix == '.hyp':
            _, smoke = validate_hyp(args.path.read_bytes(), str(args.path), temp_dir)
            result = {'type': 'hyp', 'smoke': smoke}
        elif suffix == '.zip':
            result = {'type': 'zip', 'packages': validate_zip(args.path, temp_dir)}
        else:
            fail('expected a .js, .hyp, or .zip file')

    print(json.dumps({'valid': True, 'path': str(args.path), **result}, indent=2))


if __name__ == '__main__':
    main()
