import * as actions from './actions'
import { getClient, GoogleCalendarApi } from './client'
import * as bp from '.botpress'

type CalendarData = Awaited<ReturnType<GoogleCalendarApi['getCalendar']>>
const summarizeCalendar = (calendar: CalendarData) => {
  const title = calendar.properties?.title
  if (!title) {
    return 'No Title'
  }

  let summary = `calendar "${title}"`
  const events = calendar.events
  if (!events) {
    return summary
  }

  const eventTitles = events
    .map((event: { properties?: { title?: string } }) => event.properties?.title)
    .filter((x: unknown): x is string => !!x)
  if (!eventTitles.length) {
    return summary
  }

  summary += ` with events "${eventTitles.join('", "')}" `
  return summary
}

export default new bp.Integration({
  register: async (props: bp.IntegrationRegistrationProps) => {
    props.logger.forBot().info('Registering Google Calendar integration')
    try {
      const gcalendarClient = getClient(props.ctx.configuration)
      const calendar = await gcalendarClient.getCalendar('')
      const summary = summarizeCalendar(calendar)
      props.logger.forBot().info(`Successfully connected to Google Calendar: ${summary}`)
    } catch (thrown) {
      props.logger.forBot().error(`Failed to connect to Google Calendar: ${thrown}`)
      throw thrown
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
