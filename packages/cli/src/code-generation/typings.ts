import * as apiUtils from '../api'
import * as utils from '../utils'

export type File = { path: string; content: string }

type NameVersion = { name: string; version: string }
export type IntegrationInstallablePackage = NameVersion &
  (
    | {
        source: 'remote'
        integration: apiUtils.InferredIntegrationResponseBody
      }
    | {
        source: 'local'
        devId?: string
        path: utils.path.AbsolutePath
      }
  )

export type InterfaceInstallablePackage = NameVersion &
  (
    | {
        source: 'remote'
        interface: apiUtils.InferredInterfaceResponseBody
      }
    | {
        source: 'local'
        path: utils.path.AbsolutePath
      }
  )

export type PluginInstallablePackage = NameVersion &
  (
    | {
        source: 'remote'
        plugin: apiUtils.InferredPluginResponseBody & { code: string }
      }
    | {
        source: 'local'
        path: utils.path.AbsolutePath
        implementationCode: string
      }
  )
