import * as bp from '.botpress'

const COST_PER_LOOKUP = 0.25

export const getWebsiteLogo: bp.IntegrationProps['actions']['getWebsiteLogo'] = async ({
  input,
  client,
  logger,
  metadata,
}) => {
  logger.forBot().debug('Fetching logo for URL', { input })

  const domain = input.domain.trim().replace(/^(https?:\/\/)?(www\.)?/, '')

  const params = new URLSearchParams({
    format: 'png',
    size: (input.size || 128)?.toString(),
    token: bp.secrets.LOGO_API_KEY,
  })

  if (input.greyscale) {
    params.append('greyscale', 'true')
  }

  const url = `https://img.logo.dev/${domain}?${params.toString()}`

  const buffer = (await fetch(url)).arrayBuffer()

  const { file } = await client.uploadFile({
    key: `browser/logos/${domain}/logo.png`,
    content: await buffer,
    accessPolicies: ['public_content'],
    publicContentImmediatelyAccessible: true,
    metadata: {
      domain,
      greyscale: input.greyscale || false,
      size: input.size || 128,
    },
  })

  metadata.setCost(COST_PER_LOOKUP)

  return {
    logoUrl: file.url,
  }
}
