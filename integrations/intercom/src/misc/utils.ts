import * as bp from '.botpress'

type Location = bp.channels.channel.location.Location

export function formatGoogleMapLink(payload: Location): string {
  return `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
}
