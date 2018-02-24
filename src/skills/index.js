import _ from 'lodash'

import util from '../util'
import { validateFlowSchema } from '../dialog/validator'

const SKILLS_PREFIX = 'skill-'
const SKILLS_PREFIX_REGEX = new RegExp('^' + SKILLS_PREFIX)

export default class SkillsManager {
  constructor({ logger }) {
    this.logger = logger
    this._log('info', `[Skills] Initiated`)
  }

  _log = (level, msg) => {
    this.logger && this.logger[level] && this.logger[level](msg)
  }

  registerSkillsFromModules(modules) {
    this._skills = modules
      .filter(mod => {
        const shortName = util.getModuleShortname(mod.name)
        return SKILLS_PREFIX_REGEX.test(shortName)
      })
      .reduce((acc, curr) => {
        const shortName = util.getModuleShortname(curr.name)
        if (!curr.handlers.generate) {
          this._log('warn', `Skill "${shortName}" has no flow generator ("generate" method exposed)`)
          return acc
        }

        if (!_.isFunction(curr.handlers.generate)) {
          this._log('warn', `Skill "${shortName}" generator is not a valid function`)
          return acc
        }

        acc[shortName] = curr.handlers.generate
        return acc
      }, {})

    this._log('info', `[Skills] Loaded ${_.keys(this._skills).length} skills`)
  }

  async generateFlow(skillId, data) {
    if (!this._skills) {
      throw new Error("Skills haven't been initialized yet")
    }

    //vv Backward compatible with old skills, just making sure there's no @botpress or botpress-
    skillId = util.getModuleShortname(skillId)

    if (!SKILLS_PREFIX_REGEX.test(skillId)) {
      skillId = SKILLS_PREFIX + skillId
    }

    const generator = this._skills[skillId]
    if (!generator) {
      throw new Error(`Skill "${skillId}" not found`)
    }

    const generatedFlow = await generator(data)
    const validationError = validateFlowSchema(generatedFlow.flow)

    if (validationError) {
      throw new Error(`Skill "${skillId}" generated an invalid flow: ${validationError}`)
    }

    if (!generatedFlow.transitions || !_.isArray(generatedFlow.transitions)) {
      throw new Error(`Skill "${skillId}" didn't generate valid "transitions"`)
    }

    return generatedFlow
  }
}
