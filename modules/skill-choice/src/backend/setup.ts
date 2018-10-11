import _ from 'lodash'

import { SDK } from '.'

export default async (bp: SDK) => {
  const router = bp.http.createRouterForBot('skill-choice')

  router.get('/config', async (req, res) => {
    const config = await bp.config.getModuleConfigForBot('skill-choice', req.params.botId)
    res.send(_.pick(config, ['defaultContentElement', 'defaultContentRenderer', 'defaultMaxAttempts', 'matchNumbers']))
  })

  const config = await bp.config.getModuleConfig('skill-choice')
  const checkCategoryAvailable = async () => {
    const categories = await bp.cms.getAllContentTypes().map(c => c.id)

    if (!categories.includes(config.defaultContentElement)) {
      bp.logger.warn(`Configured to use Content Element "${config.defaultContentElement}", but it was not found.`)

      if (config.defaultContentElement === 'builtin_single-choice') {
        bp.logger.warn(`You should probably install (and use) the @botpress/builtins
  module OR change the "defaultContentElement" in this module's configuration to use your own content element.`)
      }

      return
    }
  }

  if (!config.disableIntegrityCheck) {
    setTimeout(checkCategoryAvailable, 3000)
  }
}
