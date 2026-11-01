"""Use canonical package checks with the target fork's native constructors."""
import importlib.util
import sys
from pathlib import Path

sys.dont_write_bytecode = True
directory = Path(__file__).resolve().parent
root = directory.parents[1]
spec = importlib.util.spec_from_file_location(
    'hyperfy_validation', root / 'hyperfy-skill/tools/validate_result.py')
validation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validation)


def native_smoke(path, label):
    validation.run_node(['--check', str(path)], f'{label}: syntax failed')
    return validation.run_node(
        [str(directory / 'native-preflight.mjs'), str(path)],
        f'{label}: target native constructors failed')


validation.smoke_script = native_smoke
validation.main()
