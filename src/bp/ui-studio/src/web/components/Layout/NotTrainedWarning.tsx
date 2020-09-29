import { lang, toast } from 'botpress/shared'
import { FC, useEffect } from 'react'
import React from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

type Props = ReturnType<typeof mapStateToProps>

const NotTrainedWarningComponent: FC<Props> = (props: Props) => {
  useEffect(() => {
    const displayWarning = props.emulatorOpen && props.currentSession?.status !== 'done'

    if (displayWarning) {
      toast.warning(lang.tr('statusBar.trainWarning'), '', { key: 'trainWarning', hideDismiss: true })
    }

    return () => toast.dismiss('trainWarning')
  }, [props.emulatorOpen, props.currentSession?.status])

  return null
}

const mapStateToProps = (state: RootReducer) => ({
  currentSession: state.nlu.trainSession,
  emulatorOpen: state.ui.emulatorOpen
})
export default connect(mapStateToProps)(NotTrainedWarningComponent)
