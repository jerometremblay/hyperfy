import vm from 'node:vm'
const original = vm.createContext
vm.createContext = function (sandbox, ...args) {
  if (sandbox?.app && sandbox?.world) {
    sandbox.app.configure = () => {}
    sandbox.app.instanceId = 'office-audit'
    sandbox.app.state = {}
    sandbox.world.isPreview = true
  }
  return original.call(this, sandbox, ...args)
}
