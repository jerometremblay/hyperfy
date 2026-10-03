#!/usr/bin/env python3
import base64, json, re, shutil, struct, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable
NODE = shutil.which('node')


def run(*args, cwd=None):
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"command failed: {' '.join(map(str,args))}\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}")
    return result.stdout.strip()


def test_orientation_helpers(tmp):
    if not NODE:
        raise RuntimeError('node is required for self-test')
    helper = (ROOT/'templates/orientation_helpers.js').read_text()
    js = helper + r'''
const cases = [
  [[0,0,0],[0,5,0]],
  [[0,0,0],[2,5,0]],
  [[0,0,0],[0,5,-2]],
  [[1,2,3],[-4,7,-2]],
  [[-2,.5,4],[3,6,-5]],
]
for (const [a,b] of cases) {
  if (!assertSegmentAlignment(a,b,1e-6)) throw new Error('alignment false')
  if (!assertSegmentAlignment(b,a,1e-6)) throw new Error('reverse alignment false')
}
console.log('orientation helpers ok')
'''
    p = tmp/'orientation_test.js'
    p.write_text(js)
    run(NODE, str(p))


def test_pack_preview_roundtrip(tmp):
    app = tmp/'app.js'
    app.write_text((ROOT/'templates/minimal_primitive_app.js').read_text())
    hyp = tmp/'app.hyp'
    preview = tmp/'app_preview.html'
    extract = tmp/'extract'
    run(PYTHON, str(ROOT/'tools/hyp_pack.py'), str(app), str(hyp), '--name', 'Self Test')
    run(PYTHON, str(ROOT/'tools/validate_app.py'), str(hyp))
    run(PYTHON, str(ROOT/'tools/hyp_extract.py'), str(hyp), str(extract))
    run(PYTHON, str(ROOT/'tools/make_embedded_preview.py'), str(hyp), str(preview))
    run(NODE, '--check', str(app))
    smoke = json.loads(run(NODE, str(ROOT/'tools/smoke_test.js'), str(app)))
    assert smoke['ok']
    assert smoke['appNodes'] >= 1
    assert smoke['worldNodes'] >= 1, 'default physics must create detached world collider'

    data = hyp.read_bytes()
    hs = struct.unpack('<I', data[:4])[0]
    header = json.loads(data[4:4+hs])
    assert header['blueprint']['model']
    assert header['blueprint']['script']
    script_name = header['blueprint']['script'].split('asset://',1)[-1]
    assert (extract/script_name).read_bytes() == app.read_bytes()

    text = preview.read_text()
    m = re.search(r"const EMBEDDED_HYP='([^']+)'", text)
    assert m, 'preview missing embedded package'
    assert base64.b64decode(m.group(1)) == data, 'preview does not embed exact .hyp bytes'
    assert "const VIEWER_VERSION='2.3.0'" in text
    assert 'worldNodes' in text
    assert "opacity??1" in text


def main():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        test_orientation_helpers(tmp)
        test_pack_preview_roundtrip(tmp)
    print('hyperfy-hyp-app-authoring 2.4.0 self-test: PASS')


if __name__ == '__main__':
    main()
