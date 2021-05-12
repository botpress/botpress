import { Condition, Logger, ModuleDefinition, ModuleEntryPoint, Skill } from 'botpress/sdk'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'

@injectable()
export class ModuleLoader {
  private entryPoints = new Map<string, ModuleEntryPoint>()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ModuleLoader')
    private logger: Logger
  ) {}

  public static processModuleEntryPoint(module: ModuleEntryPoint, name: string): ModuleEntryPoint {
    const definition: Partial<ModuleDefinition> = {
      fullName: module.definition.name,
      menuIcon: 'view_module',
      menuText: module.definition.name,
      moduleView: { stretched: false },
      noInterface: false,
      plugins: []
    }

    return _.merge({ definition }, module)
  }

  public async loadModules(modules: ModuleEntryPoint[]) {
    const initedModules = {}

    for (const module of modules) {
      const name = _.get(module, 'definition.name', '').toLowerCase()
      initedModules[name] = await this._loadModule(module, name)
    }

    AppLifecycle.setDone(AppLifecycleEvents.MODULES_READY)
    return Object.keys(initedModules)
  }

  private async _loadModule(module: ModuleEntryPoint, name: string) {
    try {
      ModuleLoader.processModuleEntryPoint(module, name)
      this.entryPoints.set(name, module)
    } catch (err) {
      this.logger.attachError(err).error(`Error in module "${name}"`)
      return false
    }

    return true
  }

  public getDialogConditions(): Condition[] {
    const modules = Array.from(this.entryPoints.values())
    const conditions = _.flatMap(
      modules.filter(module => module.dialogConditions),
      x => x.dialogConditions
    ) as Condition[]

    return _.orderBy(conditions, x => x?.displayOrder)
  }

  public getLoadedModules(): ModuleDefinition[] {
    return Array.from(this.entryPoints.values()).map(x => x.definition)
  }

  public getFlowGenerator(moduleName: string, skillId: string): Function | undefined {
    const module = this.getModule(moduleName)
    const skill = _.find(module.skills, x => x.id === skillId)
    return skill?.flowGenerator
  }

  public async getAllSkills(): Promise<Partial<Skill>[]> {
    const skills = Array.from(this.entryPoints.values())
      .filter(module => module.skills)
      .map(module =>
        module.skills!.map(skill => ({
          id: skill.id,
          name: skill.name,
          icon: skill.icon,
          moduleName: module.definition.name
        }))
      )

    return _.flatten(skills)
  }

  public async getTranslations(): Promise<any> {
    const allTranslations = {}

    Array.from(this.entryPoints.values())
      .filter(module => module.translations)
      .forEach(mod => {
        Object.keys(mod.translations!).map(lang => {
          _.merge(allTranslations, {
            [lang]: {
              module: {
                [mod.definition.name]: mod.translations![lang]
              }
            }
          })
        })
      })

    return allTranslations
  }

  private getModule(module: string): ModuleEntryPoint {
    module = module.toLowerCase()
    if (!this.entryPoints.has(module)) {
      throw new Error(`Module '${module}' not registered`)
    }

    return this.entryPoints.get(module)!
  }
}
