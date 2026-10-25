import assert from 'node:assert/strict'
import test from 'node:test'
import { assertSecureRuntime, enforceSecureRuntime } from '../../src/server/runtimePolicy.js'

test('startup rejects vulnerable Node versions instead of relying on npm engine warnings', () => {
  for (const version of ['20.20.0', '22.23.3', '24.22.0', '26.10.0', '26.12.0', 'invalid']) {
    assert.throws(() => assertSecureRuntime(version), /security floor/)
  }
  for (const version of ['22.23.4', '22.24.0', '24.22.1', '24.23.0', '26.12.1', '26.13.0', '27.0.0']) {
    assert.doesNotThrow(() => assertSecureRuntime(version))
  }
  const previous = process.exitCode
  try {
    assert.throws(() => enforceSecureRuntime('26.10.0'), /security floor/)
    assert.equal(process.exitCode, 1, 'a SES-protected launch must report failure to its supervisor')
  } finally {
    process.exitCode = previous
  }
})
