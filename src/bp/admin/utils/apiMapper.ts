const v2Mapping = {
  '/bots': '/workspace/bots',
  '/versioning': '/management/versioning',
  '/languages': '/management/languages',
  '/server/features': '/management/features',
  '/server/rebootServer': '/management/rebootServer',
  '/server/serverConfig': '/management/checklist/serverConfig',
  '/server/monitoring': '/health/monitoring',
  '/server/alerting': '/health/alerting',
  '/server/debug': '/health/debug',
  '/server/config': '/management/config',
  '/server/modules': '/management/modules',
  '/server/diag': '/management/checklist/diag',
  '/server/configHash': '/management/configHash',
  '/logs': '/workspace/logs',
  '/license': '/management/licensing',
  '/modules': '/management/modules',
  '/workspaces': '/workspace/workspaces',
  '/users': '/workspace/collaborators',
  '/modules/botTemplates': '/workspace/bots/templates',
  '/roles': '/workspace/roles'
}

export const fixMappingMw = (req, res, next) => {
  const match = Object.keys(v2Mapping).find(x => req.url.startsWith(x))

  if (match) {
    req.url = req.url.replace(match, v2Mapping[match])
  }

  next()
}
