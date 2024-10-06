import * as client from '@botpress/client'
import * as utils from '../utils'

export type File = { path: string; content: string }

export type IntegrationInstallablePackage =
  | {
      source: 'remote'
      integration: client.Integration
    }
  | {
      source: 'local'
      path: utils.path.AbsolutePath
    }

export type InterfaceInstallablePackage =
  | {
      source: 'remote'
      interface: client.Interface
    }
  | {
      source: 'local'
      path: utils.path.AbsolutePath
    }
