import _ from 'lodash'

import { validateFlowSchema } from '../dialog/validator'

const SKILLS_PREFIX = 'botpress-skill-'
const SKILLS_PREFIX_REGEX = new RegExp('^' + SKILLS_PREFIX)

export default class SkillsManager {
  constructor({ logger }) {
    this.logger = logger

    this._log('info', `[Skills] Initiated`)
  }

  _log = (level, msg) => {
    this.logger && this.logger[level] && this.logger[level](msg)
  }

  registerSkillsFromModules = modules => {
    this._skills = modules.filter(mod => SKILLS_PREFIX_REGEX.test(mod.name)).reduce((acc, curr) => {
      if (!curr.handlers.generate) {
        this._log('warn', `Skill "${curr.name}" has no flow generator ("generate" method exposed)`)
        return acc
      }

      if (!_.isFunction(curr.handlers.generate)) {
        this._log('warn', `Skill "${curr.name}" generator is not a valid function`)
        return acc
      }

      acc[curr.name] = curr.handlers.generate
      return acc
    }, {})

    this._log('info', `[Skills] Loaded ${_.keys(this._skills).length} skills`)
  }

  generateFlow = async (skillId, data) => {
    if (!this._skills) {
      throw new Error("Skills haven't been initialized yet")
    }

    if (!SKILLS_PREFIX_REGEX.test(skillId)) {
      skillId = SKILLS_PREFIX + skillId
    }

    const generator = this._skills[skillId]
    if (!generator) {
      throw new Error(`Skill "${skillId}" not found`)
    }

    const generatedFlow = await generator(data)
    const validationError = validateFlowSchema(generatedFlow)

    if (validationError) {
      throw new Error(`Skill "${skillId}" generated an invalid flow: ${validationError}`)
    }

    return generatedFlow
  }
}
