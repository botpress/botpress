import * as bp from '.botpress'

export const createRecord : bp.IntegrationProps['actions']['createRecord'] = async ({ ctx, input }) => {
  const accessToken = ctx.configuration.accessToken
  const response = await fetch('https://api.attio.com/v2/records', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  })
}