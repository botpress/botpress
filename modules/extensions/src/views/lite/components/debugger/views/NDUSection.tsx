import { Button } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment, SFC, useState } from 'react'

import lang from '../../../../lang'
import { Collapsible } from '../components/Collapsible'
import style from '../style.scss'

import { Actions } from './Actions'
import { Inspector } from './Inspector'
import { Triggers } from './Triggers'

const NDUSection: SFC<{ nduData: sdk.NDU.DialogUnderstanding }> = ({ nduData }) => {
  const [viewJSON, setViewJSON] = useState(false)

  if (!nduData) {
    return null
  }

  const toggleView = () => {
    setViewJSON(!viewJSON)
  }

  const renderContent = () => {
    if (viewJSON) {
      return <Inspector data={nduData} />
    }

    return (
      <Fragment>
        <div className={style.section}>
          <div className={style.sectionTitle}>{lang.tr('module.extensions.ndu.topTriggers')}</div>
          <Triggers ndu={nduData}></Triggers>
        </div>

        <div className={style.section}>
          <div className={style.sectionTitle}>{lang.tr('module.extensions.ndu.decisionsTaken')}</div>
          <Actions ndu={nduData} />
        </div>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <Collapsible name={lang.tr('module.extensions.ndu.dialogUnderstanding')}>
        {renderContent()}
        <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
          {viewJSON ? lang.tr('module.extensions.viewAsSummary') : lang.tr('module.extensions.viewAsJson')}
        </Button>
      </Collapsible>
    </Fragment>
  )
}

export default NDUSection
