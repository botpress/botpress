import * as apiUtils from '../api'
import * as utils from '../utils'

export type File = { path: string; content: string }

type NameVersion = { name: string; version: string }
export type IntegrationInstallablePackage = NameVersion & {
  integration: apiUtils.InferredIntegrationResponseBody
  devId?: string
  path?: utils.path.AbsolutePath
}

export type InterfaceInstallablePackage = NameVersion & {
  interface: apiUtils.InferredInterfaceResponseBody
  path?: utils.path.AbsolutePath
}

export type PluginInstallablePackage = NameVersion & {
  plugin: apiUtils.InferredPluginResponseBody & { code: string }
  path?: utils.path.AbsolutePath
}
