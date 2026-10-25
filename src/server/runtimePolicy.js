// The project runtime floor matches the October 2026 Node security release.
export function assertSecureRuntime(version = process.versions.node) {
  const [major, minor, patch] = version.split('.').map(Number)
  const minimum = major === 22 ? [23, 4] : major === 24 ? [22, 1] : major === 26 ? [12, 1] : null
  const allowed =
    Number.isInteger(major) &&
    (major > 26 || (minimum && (minor > minimum[0] || (minor === minimum[0] && patch >= minimum[1]))))
  if (!allowed) {
    throw new Error(
      `Node ${version} is below this project's security floor. Use Node 22.23.4, 24.22.1, or 26.12.1 or newer in the same release line (nvm use).`
    )
  }
}

export function enforceSecureRuntime(version = process.versions.node) {
  try {
    assertSecureRuntime(version)
  } catch (error) {
    // SES reports uncaught exceptions without setting Node's failure status.
    // Make direct server/client launches fail for process supervisors too.
    process.exitCode = 1
    throw error
  }
}
