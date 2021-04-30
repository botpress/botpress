import { Button, Divider } from '@blueprintjs/core'
import { lang, ToolTip } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { AppState } from '../rootReducer'
import { toggleBottomPanel, toggleBottomPanelExpand } from '../uiReducer'

import Logs from './Logs'
import style from './style.scss'

const BottomPanel = props => {
  const commonButtons = (
    <Fragment>
      <Divider />
      <ToolTip content={lang.tr(props.bottomPanelExpanded ? 'minimize' : 'maximize')}>
        <Button
          id="btn-toggle-expand"
          icon={props.bottomPanelExpanded ? 'minimize' : 'maximize'}
          small
          onClick={props.toggleBottomPanelExpand}
        />
      </ToolTip>

      <Divider />

      <ToolTip content={lang.tr('bottomPanel.closePanel')}>
        <Button id="btn-close" icon="cross" small onClick={props.toggleBottomPanel} />
      </ToolTip>
    </Fragment>
  )

  return (
    <div className={style.container}>
      <div className={cx(style.padded, style.fullWidth)}>
        <Logs commonButtons={commonButtons} />
      </div>
    </div>
  )
}

const mapStateToProps = (state: AppState) => ({
  bottomPanelExpanded: state.ui.bottomPanelExpanded
})

const mapDispatchToProps = { toggleBottomPanelExpand, toggleBottomPanel }
const connector = connect(mapStateToProps, mapDispatchToProps)

export default connector(BottomPanel)
