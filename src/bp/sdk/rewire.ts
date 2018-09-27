import Module from 'module'
const originalRequire = Module.prototype.require

Module.prototype.require = function() {
  if (arguments && arguments[0] === 'botpress/sdk') {
    return originalRequire.apply(this, ['core/sdk.impl'])
  }
  return originalRequire.apply(this, arguments)
}
