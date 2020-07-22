import * as sdk from 'botpress/sdk'
import { CMSService } from 'core/services/cms'
import { FlowService } from 'core/services/dialog/flow/service'
import { Migration, MigrationOpts } from 'core/services/migration'
import { TYPES } from 'core/types'
import { Container } from 'inversify'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Migrate from a single content to an array of contents',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, inversify, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const migrater = new Migrater(bp, inversify)
    await migrater.initialize()

    if (metadata.botId) {
      await migrater.migrateBot(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      for (const botId of Array.from(bots.keys())) {
        await migrater.migrateBot(botId)
      }
    }

    return {
      success: true,
      message: migrater.hasChanged ? 'Content migrated successfully' : 'The content was already in the correct format'
    }
  }
}

class Migrater {
  public hasChanged!: boolean
  private flowService!: FlowService
  private cmsService!: CMSService

  constructor(private bp: typeof sdk, private inversify: Container) {}

  async initialize() {
    this.flowService = this.inversify.get<FlowService>(TYPES.FlowService)
    this.cmsService = this.inversify.get<CMSService>(TYPES.CMSService)
    await this.cmsService.initialize()
  }

  async migrateBot(botId: string) {
    const ghost = this.bp.ghost.forBot(botId)
    const flows = await this.flowService.loadAll(botId)

    for (const flow of flows) {
      try {
        for (const node of flow.nodes) {
          this.migrateNode(node)
        }

        const flowContent = {
          ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'triggers', 'label', 'description']),
          nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
        }
        await ghost.upsertFile('./flows', flow.location!, JSON.stringify(flowContent, undefined, 2))
      } catch (err) {
        this.bp.logger
          .forBot(botId)
          .attachError(err)
          .error(`Could not migrate say node data for bot ${botId}`)
      }
    }
  }

  migrateNode(node: sdk.FlowNode) {
    if (node.type !== 'say_something' || node.contents || !node['content']) {
      return
    }

    const { contentType, formData } = (node as any).content
    const { newSchema } = this.cmsService.getContentType(contentType)
    const schema = <sdk.FormDefinition>newSchema

    const fields = [...schema.advancedSettings, ...schema.fields]
    const root: any = { formData: { contentType } }

    for (const [key, value] of Object.entries(formData)) {
      const [name, lang] = key.split('$')
      this.attachTranslation(root, 'formData', { [name]: value }, fields, lang)
    }

    delete (node as any).content
    node.contents = [root.formData]

    this.hasChanged = true
  }

  attachTranslation(root: any, basePath: string, current: any, fields: sdk.FormField[], lang: string) {
    for (const [key, value] of Object.entries<any>(current)) {
      const field = fields.find(x => x.key === key)

      const path: string = field?.translated ? `${basePath}.${key}.${lang}` : `${basePath}.${key}`

      if (field?.fields) {
        const fields = this.getFieldsAndOptions(field)

        if (field.type === 'group') {
          for (let i = 0; i < value.length; i++) {
            this.attachTranslation(root, `${path}.${i}`, value[i], fields, lang)
          }
        } else {
          this.attachTranslation(root, path, value, fields, lang)
        }
      } else {
        _.set(root, path, value)
      }
    }
  }

  getFieldsAndOptions(field: sdk.FormField): sdk.FormField[] {
    if (!field.fields) {
      return []
    }
    const fields = [...field.fields]

    for (const { options } of field.fields) {
      if (!options) {
        continue
      }

      for (const option of options) {
        if (!option.related) {
          continue
        }

        fields.push(option.related)
      }
    }

    return fields
  }
}

export default migration
