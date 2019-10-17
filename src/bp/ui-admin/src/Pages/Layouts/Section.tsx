import { H3, Icon, Position, Tooltip } from '@blueprintjs/core'
import React from 'react'
import { Col, Row } from 'reactstrap'

export default ({ helpText, title, mainContent, sideMenu }) => (
  <div className="bp-main-content-main">
    <H3 className="bp-main-content__title">
      {title}
      {helpText && (
        <Tooltip content={helpText} position={Position.RIGHT}>
          <Icon icon="info-sign" className="section-title-help" iconSize={13} />
        </Tooltip>
      )}
    </H3>

    <Row>
      <Col xs={sideMenu ? 10 : 12}>{mainContent}</Col>
      {sideMenu && <Col xs={2}>{sideMenu}</Col>}
    </Row>
  </div>
)
