import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { captureWorld } from './capture.mjs'
import { loadProfile } from './deployment.mjs'
import { assertKey } from './canonical.mjs'

const GITHUB_LOGIN = 'jerometremblay-bot'
const GIT_NAME = 'jerometremblay-bot'
const GIT_EMAIL = 'jerome.tremblay+bot@gmail.com'
const SIGNING_KEY = 'C81228C654940396'
const SIGNING_FINGERPRINT = 'FE94FEE3D17CCA133E90E31EC81228C654940396'

function run(program, args, { cwd, env } = {}) {
  const result = spawnSync(program, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.error) throw new Error('Could not start ' + program + ': ' + result.error.message)
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(program + ' failed' + (detail ? ': ' + detail : ''))
  }
  return (result.stdout || '').trim()
}

function summarize(plan) {
  return [
    'World: ' + plan.profile,
    'Scene: ' + plan.sceneKey,
    'Snapshot revision: ' + plan.revision,
    'Blueprints: ' + plan.blueprints,
    'Placements: ' + plan.instances,
    'Assets: ' + plan.assets,
    'Seat-pose records: ' + (plan.seatPosesExcluded ? 'excluded' : plan.seatPoseRecords),
    'Files: ' + (plan.files.length ? plan.files.join('\n') : '(none)'),
    'Unresolved seat-pose anchors: ' + plan.unresolvedAnchors.length,
  ].join('\n')
}

export async function proposeCapture(root, sceneKey, profileName, {
  excludeSeatPoses = false,
  resolve = null,
  bootstrap = false,
} = {}) {
  assertKey(sceneKey, 'scene key')
  assertKey(profileName, 'profile name')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profileName)) {
    throw new Error('profile name must use lowercase letters, numbers, and hyphens')
  }
  const profile = await loadProfile(root, profileName)
  const account = run('gh', ['api', 'user', '--jq', '.login'])
  if (account !== GITHUB_LOGIN) {
    throw new Error('capture --propose requires the GitHub account ' + GITHUB_LOGIN)
  }
  const repoInfo = run('gh', [
    'repo', 'view', '--json', 'nameWithOwner,defaultBranchRef',
    '--jq', '[.nameWithOwner, .defaultBranchRef.name] | @tsv',
  ], { cwd: root })
  const [repository, baseBranch] = repoInfo.split('\t')
  if (!repository || !baseBranch) throw new Error('Could not resolve the GitHub repository default branch')

  const gitRoot = path.resolve(run('git', ['rev-parse', '--show-toplevel'], { cwd: root }))
  if (gitRoot !== path.resolve(root)) throw new Error('--root must be the Git repository root for --propose')
  try {
    run('git', ['remote', 'get-url', 'origin'], { cwd: root })
  } catch {
    throw new Error('capture --propose requires an origin Git remote')
  }

  run('git', [
    'fetch', '--quiet', 'origin',
    '+refs/heads/' + baseBranch + ':refs/remotes/origin/' + baseBranch,
  ], { cwd: root })
  const baseCommit = run('git', ['rev-parse', 'refs/remotes/origin/' + baseBranch], { cwd: root })
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12)
  const branch = `codex/worldsync-capture-${profileName}-${suffix}`
  const worktree = path.join(os.tmpdir(), 'worldsync-propose-' + randomUUID())
  let worktreeAdded = false
  let committed = false
  let pushed = false

  try {
    run('git', ['worktree', 'add', '--quiet', '-b', branch, worktree, baseCommit], { cwd: root })
    worktreeAdded = true
    const plan = await captureWorld(worktree, sceneKey, profileName, {
      write: true,
      excludeSeatPoses,
      resolve,
      bootstrap,
      profileOverride: profile,
    })
    if (plan.conflicts.length && resolve !== 'live' && !bootstrap) {
      return { ...plan, proposal: null }
    }
    if (!plan.files.length) return { ...plan, proposal: null, proposalReason: 'No source changes to propose' }
    const summary = summarize(plan)
    run('git', ['add', '--', ...plan.files], { cwd: worktree })
    const staged = spawnSync('git', ['diff', '--cached', '--quiet'], {
      cwd: worktree,
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    if (staged.error) throw new Error('Could not inspect staged capture files: ' + staged.error.message)
    if (staged.status === 0) return { ...plan, proposal: null, proposalReason: 'No source changes to propose' }
    if (staged.status !== 1) throw new Error('Could not inspect staged capture files')

    const commitEnv = {
      GIT_AUTHOR_NAME: GIT_NAME,
      GIT_AUTHOR_EMAIL: GIT_EMAIL,
      GIT_COMMITTER_NAME: GIT_NAME,
      GIT_COMMITTER_EMAIL: GIT_EMAIL,
    }
    run('git', [
      '-c', 'user.signingkey=' + SIGNING_KEY,
      'commit', '-S', '-m', `Capture ${sceneKey} from ${profileName}`,
    ], { cwd: worktree, env: commitEnv })
    committed = true
    const identity = run('git', [
      'show', '-s', '--format=%an%x00%ae%x00%cn%x00%ce%x00%G?%x00%GF', 'HEAD',
    ], { cwd: worktree }).split('\0')
    if (
      identity[0] !== GIT_NAME || identity[1] !== GIT_EMAIL || identity[2] !== GIT_NAME ||
      identity[3] !== GIT_EMAIL || identity[4] !== 'G' || identity[5]?.toUpperCase() !== SIGNING_FINGERPRINT
    ) {
      throw new Error('Capture commit identity or GPG signature did not match the required bot identity')
    }
    run('git', ['verify-commit', 'HEAD'], { cwd: worktree })
    run('git', ['push', '--set-upstream', 'origin', branch], { cwd: worktree })
    pushed = true

    const bodyPath = path.join(os.tmpdir(), 'worldsync-proposal-' + randomUUID() + '.md')
    try {
      await fs.writeFile(bodyPath, [
        'Automated world capture proposal.',
        '',
        summary,
        '',
        'Base commit: ' + baseCommit,
        'Bootstrap capture: ' + (bootstrap ? 'yes' : 'no'),
        'Seat-pose exclusion: ' + (excludeSeatPoses ? 'yes' : 'no'),
        'HYP fallback objects: ' + plan.objectModes.filter(item => item.mode === 'hyp').length,
      ].join('\n') + '\n', { flag: 'wx' })
      const url = run('gh', [
        'pr', 'create', '--repo', repository, '--base', baseBranch, '--head', branch,
        '--title', (`Capture ${sceneKey} from ${profileName}`).slice(0, 240),
        '--body-file', bodyPath,
      ])
      return { ...plan, proposal: { branch, url, baseCommit } }
    } finally {
      await fs.rm(bodyPath, { force: true })
    }
  } catch (error) {
    if (pushed) {
      throw new Error('Capture branch ' + branch + ' was pushed, but proposal creation failed: ' + error.message)
    }
    throw error
  } finally {
    if (worktreeAdded) {
      try {
        run('git', ['worktree', 'remove', '--force', worktree], { cwd: root })
      } catch {
        // The worktree belongs to this invocation; clean up its temporary files if Git cannot remove it.
        await fs.rm(worktree, { recursive: true, force: true })
      }
    }
    if (!committed) {
      try {
        run('git', ['branch', '-D', branch], { cwd: root })
      } catch {
        // A branch that is still checked out or missing needs no further cleanup here.
      }
    }
  }
}
