import vm from 'node:vm'

// Supply the fork APIs missing from the bundled primitive-only VM harness.
// The original script and package bytes are passed through unchanged.
const originalCreateContext = vm.createContext
vm.createContext = function (sandbox, ...args) {
  if (sandbox?.app && sandbox?.world) {
    sandbox.app.configure = () => {}
    sandbox.app.instanceId = 'HCzjtaVZFI'
    sandbox.app.state = {}
    sandbox.app.send = () => {}
    sandbox.app.emit = () => {}
    sandbox.world.on = () => {}
  }
  return originalCreateContext.call(this, sandbox, ...args)
}
