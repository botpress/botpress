import { Container, interfaces } from 'inversify'

/**
 * Installs an Inversify middleware that scan classes implementing the "IDisposeOnExit" interface
 * And calls their disposal method before the process exits
 */
export const applyDisposeOnExit = (container: Container) => {
  const disposeMethods: Function[] = []

  const applyToBinding = (binding: interfaces.Binding<any>): void => {
    const bindingOnActivation = binding.onActivation

    binding.onActivation = (context: interfaces.Context, target: any): any => {
      if (bindingOnActivation) {
        target = bindingOnActivation(context, target)
      }

      if (target && typeof target.disposeOnExit === 'function') {
        disposeMethods.push(target.disposeOnExit.bind(target))
      }

      return target
    }
  }
  const anyContainer = <any>container

  anyContainer._bindingDictionary._map.forEach((bindings: interfaces.Binding<any>[]) => {
    bindings.forEach((binding: interfaces.Binding<any>) => {
      applyToBinding(binding)
    })
  })

  const cleanup = code => {
    disposeMethods.forEach(m => m())
    process.exit(process.exitCode)
  }

  process.on('beforeExit', cleanup)
  process.on('exit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGHUP', cleanup)
  process.on('SIGUSR2', cleanup)
  process.on('SIGTERM', cleanup)
}
