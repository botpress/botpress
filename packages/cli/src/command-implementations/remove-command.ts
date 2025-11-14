import * as sdk from '@botpress/sdk'
import * as fslib from 'fs'
import * as pathlib from 'path'
import semver from 'semver'
import * as apiUtils from '../api'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as pkgRef from '../package-ref'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

type RemovablePackage =
  | {
      type: 'integration'
    }
  | {
      type: 'interface'
    }
  | {
      type: 'plugin'
    }

export type RemoveCommandDefinition = typeof commandDefinitions.remove
export class RemoveCommand extends ProjectCommand<RemoveCommandDefinition> {
  protected run(): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
