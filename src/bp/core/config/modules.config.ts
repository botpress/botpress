export type ModuleConfigEntry = {
  name: string
  enabled: boolean
}

export type ModulesConfig = {
  modules: Array<ModuleConfigEntry>
}
