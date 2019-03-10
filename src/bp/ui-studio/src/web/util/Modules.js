import _ from 'lodash'

export const moduleViewNames = (modules = [], position = 'overlay') =>
  _.flatten(
    (modules || []).filter(Boolean).map(module =>
      _.filter(module.plugins || [], { position }).map(plugin => ({
        moduleName: module.name,
        componentName: plugin.entry
      }))
    )
  )
