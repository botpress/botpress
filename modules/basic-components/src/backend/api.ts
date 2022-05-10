import * as sdk from 'botpress/sdk'
import { UnexpectedError } from 'common/http'
import { componentSnippetRegister } from './index'

export default async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('basic-components')

  router.get('/components', async (req, res) => {
    res.send(componentSnippetRegister)
  })

  router.get('/components/:componentId', async (req, res) => {
    const component = componentSnippetRegister.find(x => x.id === req.params.componentId)
    if (!component?.flowGenerator) {
      return res.status(404).send('Invalid component name')
    }
    try {
      res.send(await component.flowGenerator())
    } catch (err) {
      throw new UnexpectedError('Could not generate flow', err)
    }
  })
}
