import { Button } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment, SFC, useState } from 'react'

import ContentSection from '../../../../../../../../src/bp/ui-shared-lite/ContentSection'
import Collapsible from '../../../../../../../../src/bp/ui-shared-lite/Collapsible'
import lang from '../../../../lang'
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
        <ContentSection title={lang.tr('module.extensions.ndu.topTriggers')}>
          <Triggers ndu={nduData}></Triggers>
        </ContentSection>

        <ContentSection title={lang.tr('module.extensions.ndu.decisionsTaken')}>
          <Actions ndu={nduData} />
        </ContentSection>
      </Fragment>
    )
  }

  return (
    <Collapsible name={lang.tr('module.extensions.ndu.dialogUnderstanding')}>
      {renderContent()}
      <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
        {viewJSON ? lang.tr('module.extensions.viewAsSummary') : lang.tr('module.extensions.viewAsJson')}
      </Button>
    </Collapsible>
  )
}

export default NDUSection
