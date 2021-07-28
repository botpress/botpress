import { ConfigProvider } from 'core/config'
import { Container, interfaces } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'

import { TYPES } from '../types'

const getBoundInstancesFn = (container: Container, functionName: string): (() => Function[]) => {
  const bound: Function[] = []

  const applyToBinding = (binding: interfaces.Binding<any>): void => {
    const bindingOnActivation = binding.onActivation

    binding.onActivation = (context: interfaces.Context, target: any): any => {
      if (bindingOnActivation) {
        target = bindingOnActivation(context, target)
      }

      if (target && typeof target[functionName] === 'function') {
        bound.push(target[functionName].bind(target))
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

  return () => bound
}

/**
 * Installs an Inversify middleware that scan classes implementing the "IDisposeOnExit" interface
 * And calls their disposal method before the process exits
 */
export const applyDisposeOnExit = (container: Container) => {
  const provider = getBoundInstancesFn(container, 'disposeOnExit')

  const cleanup = code => {
    provider().forEach(m => m())
    process.exit(process.exitCode)
  }

  process.on('beforeExit', cleanup)
  process.on('exit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGHUP', cleanup)
  process.on('SIGUSR2', cleanup)
  process.on('SIGTERM', cleanup)
}

export const applyInitializeFromConfig = (container: Container) => {
  const provider = getBoundInstancesFn(container, 'initializeFromConfig')

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED).then(async () => {
    const configProvider = container.get<ConfigProvider>(TYPES.ConfigProvider)
    const botpressConfig = await configProvider.getBotpressConfig()
    provider().forEach(m => m(botpressConfig))
  })
}
