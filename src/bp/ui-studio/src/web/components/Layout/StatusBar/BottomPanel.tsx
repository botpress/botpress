import { Icon } from '@blueprintjs/core'
import axios from 'axios'
import classNames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { Glyphicon } from 'react-bootstrap'
import { GoMortarBoard } from 'react-icons/go'
import { connect } from 'react-redux'
import { updateDocumentationModal } from '~/actions'
import { keyMap } from '~/keyboardShortcuts'
import EventBus from '~/util/EventBus'

import PermissionsChecker from '../PermissionsChecker'

import ActionItem from './ActionItem'
import style from './BottomPanel.styl'
import LangSwitcher from './LangSwitcher'
import NluPerformanceStatus from './NluPerformanceStatus'

interface IProps {
  visible: boolean
}

class BottomPanel extends React.Component<IProps> {
  render() {
    if (!this.props.visible) {
      return <React.Fragment />
    }

    return <div className={style.container}>HELLO WORLD</div>
  }
}

const mapStateToProps = state => ({
  visible: state.ui.bottomPanel
})

export default connect(
  mapStateToProps,
  { updateDocumentationModal }
)(BottomPanel)
