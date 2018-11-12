import { handleActions } from 'redux-actions'
import { Howl } from 'howler'
import _ from 'lodash'

import { allNotificationsReceived, newNotificationsReceived } from '~/actions'

const defaultState = []
const sound = new Howl({ src: ['/assets/ui-studio/public/audio/notification.mp3'] })

const reducer = handleActions(
  {
    [allNotificationsReceived]: (state, { payload }) => [...payload],
    [newNotificationsReceived]: (state, { payload }) => {
      if (_.some(payload, { sound: true })) {
        sound.play()
      }
      state.unshift(...payload)
      return [...state]
    }
  },
  defaultState
)

export default reducer
