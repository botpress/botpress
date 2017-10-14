import path from 'path'
import fs from 'fs'
import glob from 'glob'
import _ from 'lodash'
import Promise from 'bluebird'

const validateFlowName = name => /^[a-z]{1}[a-z_0-9-]{1,20}$/.test(name)

module.exports = ({ logger, botfile, projectLocation }) => {
  async function scanFlows() {
    const relDir = botfile.flowsDir || './flows'
    const flowsDir = path.resolve(projectLocation, relDir)

    if (!fs.existsSync(flowsDir)) {
      return []
    }

    const searchOptions = { cwd: flowsDir }

    const flowFiles = await Promise.fromCallback(callback => glob('**/*.flow.json', searchOptions, callback))
    const uiFiles = await Promise.fromCallback(callback => glob('**/*.ui.json', searchOptions, callback))

    console.log(flowFiles, uiFiles, flowsDir)

    flowFiles.forEach(file => {
      const filePath = path.resolve(flowsDir, './' + file)
      const flow = eval('require')(filePath) // eslint-disable-line

      const uiEqPath = file.replace(/\.flow/g, '.ui')
      const uiEq = _.find(uiFiles, e => e === uiEqPath) || {}

      // Schema Validation
      const errorPrefix = `[Flow] Error loading "${file}"`
      if (!flow || !_.isObjectLike(flow)) {
        return logger.warn(errorPrefix + ', invalid JSON flow schema')
      }

      if (!flow.version || !_.isString(flow.version)) {
        return logger.warn(errorPrefix + ', expected valid version but found none')
      }

      if (!flow.version.startsWith('0.')) {
        return logger.warn(errorPrefix + ', unsupported `version` of the schema "' + flow.version + '"')
      }

      if (!_.isString(flow.name) || !validateFlowName(flow.name)) {
        return logger.warn(errorPrefix + ', expected valid `name`')
      }

      if (!_.isString(flow.startnode)) {
        return logger.warn(errorPrefix + ', expected valid `startnode`')
      }

      if (!_.isArray(flow.nodes)) {
        return logger.warn(errorPrefix + ', expected `nodes` to be an array of nodes')
      }

      if (!_.find(flow.nodes, { name: flow.startnode })) {
        return logger.warn(errorPrefix + ', expected `startnode` to point to an existing flow node')
      }

      // TODO Validate Nodes Schema
    })
  }

  async function loadFlows() {}

  return { scanFlows, loadFlows }
}
