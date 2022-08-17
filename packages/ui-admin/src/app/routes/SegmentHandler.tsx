import segmentPlugin from '@analytics/segment'
import Analytics, { AnalyticsInstance, PageData } from 'analytics'
import hash from 'hash.js'
import React from 'react'
import { connect } from 'react-redux'
import { UserState } from '~/user/reducer'

const APP_NAME = 'ADMIN_ANALYTICS' // for reference, in case of second account

let analytics: AnalyticsInstance
let userIdentified: boolean = false

const extractUserHashFromUser = (user: UserState): string | undefined => {
  if (user?.profile?.email) {
    return hash
      .sha256()
      .update('botpressUserEmail' + user.profile.email)
      .digest('hex')
  }
}

const initSegmentAnalytics = async () => {
  analytics = Analytics({
    app: APP_NAME,
    plugins: [
      segmentPlugin({
        writeKey: window.SEGMENT_WRITE_KEY
      })
    ]
  })

  await analytics.page()

  return analytics
}

const handleNewUserState = async (user: UserState): Promise<void> => {
  const userEmailHash = extractUserHashFromUser(user)

  if (userIdentified || !userEmailHash) {
    return
  }

  userIdentified = true

  // @ts-ignore
  // ts-ignore because analytics doesn't accept a non-string userId, but analytics-segment does.
  await analytics.identify(null, {
    userEmailHash,
    machineUUID: window.UUID
  })
  return
}

const SegmentHandler = props => {
  React.useEffect(() => {
    if (window.SEND_USAGE_STATS) {
      void (async () => {
        if (!analytics) {
          await initSegmentAnalytics()
        }

        await handleNewUserState(props.user)
      })()
    }
  }, [props.user])
  return props.children
}

const mapStateToProps = state => ({
  user: state.user
})

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(SegmentHandler)

const trackEvent = (eventName: string, payload?: any, options?: any, callback?: (...params: any[]) => any) => {
  if (analytics) {
    return analytics.track(eventName, payload, options, callback)
  }
  return Promise.reject(new Error('No analytics found'))
}

const trackPage = (data?: PageData, options?: any, callback?: (...params: any[]) => any) => {
  if (analytics) {
    return analytics.page(data, options, callback)
  }
  return Promise.reject(new Error('No analytics found'))
}

export { trackEvent, trackPage }
