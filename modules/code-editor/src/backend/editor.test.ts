import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import Editor from './editor'
import { EditableFile, FilePermissions } from './typings'

const botId = 'carl-carmoni'
const config: Config = { includeBuiltin: false }

let editor: Editor

const allPermissions = {
  botActions: true,
  botConfigs: true,
  globalActions: true,
  globalConfigs: true,
  hooks: true
}

const superAdminPermissions: FilePermissions = {
  readPermissions: { ...allPermissions },
  writePermissions: { ...allPermissions }
}

const ghost: Partial<sdk.ScopedGhostService> = {
  deleteFile: jest.fn(),
  directoryListing: jest.fn(() => ['code-editor.json']),
  fileExists: jest.fn(),
  readFileAsObject: jest.fn(),
  renameFile: jest.fn(),
  upsertFile: jest.fn()
}

const forBot: jest.Mock = jest.fn(() => ghost)
const forBots: jest.Mock = jest.fn(() => ghost)
const forGlobal: jest.Mock = jest.fn(() => ghost)
const bp: Partial<typeof sdk> = {
  ghost: {
    forBot,
    forBots,
    forGlobal
  }
}

const content = 'Bonne fete kevin!'
const jsonContent = '{"text": "Bonne fête kevin"}'

describe('Editor', () => {
  beforeEach(() => {
    forBot.mockClear()
    forGlobal.mockClear()
    forBots.mockClear()
    editor = new Editor(bp as any, botId, config)
  })

  test('Saving a global config file with bot id throws', async () => {
    // Arrange
    const file: EditableFile = {
      botId,
      content,
      location: 'workspaces.json',
      name: 'workspaces.json',
      type: 'global_config'
    }

    // Act && Assert
    expect(editor.saveFile(file, superAdminPermissions)).rejects.toThrow()
  })

  test('Saving a module config file with bot id throws', async () => {
    // Arrange
    const file: EditableFile = {
      botId,
      content,
      location: 'config/code-editor.json',
      name: 'code-editor.json',
      type: 'module_config'
    }

    // Act && Assert
    expect(editor.saveFile(file, superAdminPermissions)).rejects.toThrow()
  })

  test('Saving a bot config file without bot id throws', async () => {
    // Arrange
    const file: EditableFile = {
      content,
      location: 'bot.config.json',
      name: 'bot.config.json',
      type: 'bot_config'
    }

    // Act && Assert
    expect(editor.saveFile(file, superAdminPermissions)).rejects.toThrow()
  })

  test('Saving a hook with bot id throws', async () => {
    // Arrange
    const file: EditableFile = {
      botId,
      content,
      location: 'somehook.json',
      name: 'somehook.json',
      type: 'hook',
      hookType: 'before_incoming_middleware'
    }

    // Act && Assert
    expect(editor.saveFile(file, superAdminPermissions)).rejects.toThrow()
  })

  test('Saving a hook should use the global ghost', async () => {
    // Arrange
    const file: EditableFile = {
      content,
      location: 'somehook.json',
      name: 'somehook.json',
      type: 'hook',
      hookType: 'before_incoming_middleware'
    }

    // Act
    await editor.saveFile(file, superAdminPermissions)

    // Assert
    expect(forGlobal).toBeCalled()
    expect(forBot).not.toBeCalled()
  })

  test('Saving a global config should use the global ghost', async () => {
    // Arrange
    const file: EditableFile = {
      content: jsonContent,
      location: 'botpress.config.json',
      name: 'botpress.config.json',
      type: 'global_config'
    }

    // Act
    await editor.saveFile(file, superAdminPermissions)

    // Assert
    expect(forGlobal).toBeCalled()
    expect(forBot).not.toBeCalled()
  })

  test('Saving a module config should call the global ghost', async () => {
    // Arrange
    const file: EditableFile = {
      content: jsonContent,
      location: 'config/code-editor.json',
      name: 'code-editor.json',
      type: 'module_config'
    }

    // Act
    await editor.saveFile(file, superAdminPermissions)

    // Assert
    expect(forGlobal).toBeCalled()
    expect(forBot).not.toBeCalled()
  })

  test('Saving a global action should call the ghost for global', async () => {
    // Arrange
    const file: EditableFile = {
      content,
      location: 'someAction.json',
      name: 'someAction.json',
      type: 'action'
    }

    // Act
    await editor.saveFile(file, superAdminPermissions)

    // Assert
    expect(forGlobal).toBeCalled()
    expect(forBot).not.toBeCalled()
  })

  test('Saving a scoped action should call the ghost for bot', async () => {
    // Arrange
    const file: EditableFile = {
      botId,
      content,
      location: 'someAction.json',
      name: 'someAction.json',
      type: 'action'
    }

    // Act
    await editor.saveFile(file, superAdminPermissions)

    // Assert
    expect(forBot).toBeCalled()
    expect(forGlobal).not.toBeCalled()
  })

  test('Saving a bot config should call the ghost for bot', async () => {
    // Arrange
    const file: EditableFile = {
      botId,
      content: jsonContent,
      location: 'bot.config.json',
      name: 'bot.config.json',
      type: 'bot_config'
    }

    // Act
    await editor.saveFile(file, superAdminPermissions)

    // Assert
    expect(forBot).toBeCalled()
    expect(forGlobal).not.toBeCalled()
  })
})
