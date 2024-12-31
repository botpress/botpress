import * as client from '@botpress/client'
import * as utils from '../utils'

export type File = { path: string; content: string }

type NameVersion = { name: string; version: string }
export type IntegrationInstallablePackage = NameVersion &
  (
    | {
        source: 'remote'
        integration: client.Integration
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
        interface: client.Interface
      }
    | {
        source: 'local'
        path: utils.path.AbsolutePath
      }
  )

export type PluginInstallablePackage = NameVersion &
  (
    | {
        source: 'local'
        path: utils.path.AbsolutePath
        implementationCode: string
      }
    | {
        source: 'remote'
        plugin: client.Plugin
      }
  )
