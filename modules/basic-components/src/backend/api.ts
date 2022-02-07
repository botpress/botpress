import * as sdk from 'botpress/sdk'
import { UnexpectedError } from 'common/http'
import { find } from 'lodash'
import { componentSnippetRegister } from './index'

export default async (bp: typeof sdk) => {
  /**
   * This is an example route to get you started.
   * Your API will be available at `http://localhost:3000/api/v1/bots/BOT_NAME/mod/components`
   * Just replace BOT_NAME by your bot ID
   */
  const router = bp.http.createRouterForBot('basic-components')

  router.get('/components', async (req, res) => {
    res.send(componentSnippetRegister)
  })

  router.get('/components/:componentId', async (req, res) => {
    const component = find(componentSnippetRegister, x => x.id === req.params.componentId)
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
