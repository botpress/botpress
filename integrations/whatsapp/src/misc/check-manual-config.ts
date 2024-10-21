export async function checkManualConfiguration(accessToken: string) {
  // get appId first
  const appResponse = await fetch('https://graph.facebook.com/app', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!appResponse.ok) {
    return false // Invalid access token
  }

  const appId = (await appResponse.json()).id

  return !!appId // todo check if webhook is configured, this may require a permission change.
}
