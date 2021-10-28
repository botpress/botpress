import segmentPlugin from '@analytics/segment'
import Analytics from 'analytics'
import hash from 'hash.js'
import React from 'react'
import { connect } from 'react-redux'
import { UserState } from '~/user/reducer'

const APP_NAME = 'ADMIN_ANALYTICS' // for reference, in case of second account
const WRITE_KEY = 'zE0mct7hGOZRtCyImjX9vT1NJ2TpfyGF' // taken from Segment UI

let analytics
let loggedIn

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
        writeKey: WRITE_KEY
      })
    ]
  })

  await analytics.page()

  return analytics
}

const handleNewUserState = (user: UserState): void => {
  const userEmailHash = extractUserHashFromUser(user)

  if (!loggedIn && userEmailHash) {
    loggedIn = true
    void analytics.identify(null, {
      userEmailHash,
      machineUUID: window.UUID
    })
  }
}

function SegmentHandler(props) {
  if (window.SEND_USAGE_STATS) {
    React.useEffect(() => {
      void (async () => {
        if (!analytics) {
          await initSegmentAnalytics()
        }

        handleNewUserState(props.user)
      })()
    }, [props.user])
  }
  return props.children
}

const mapStateToProps = state => ({
  user: state.user
})

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(SegmentHandler)
