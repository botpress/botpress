import React from 'react'

import { MdInfoOutline } from 'react-icons/md'

import { Row, Col, UncontrolledTooltip } from 'reactstrap'

export default ({ helpText, activePage, title, mainContent, sideMenu }) => (
  <div className="bp-main-content-main">
    <Row>
      <Col xs={12} md={10}>
        <h2 className="bp-main-content__title">
          {title}
          {helpText && (
            <span>
              <MdInfoOutline id={`help${activePage}`} className="section-title-help" />
              <UncontrolledTooltip placement="right" target={`help${activePage}`}>
                {helpText}
              </UncontrolledTooltip>
            </span>
          )}
        </h2>
      </Col>
    </Row>
    <Row>
      <Col xs={sideMenu ? 10 : 12}>{mainContent}</Col>
      {sideMenu && <Col xs={2}>{sideMenu}</Col>}
    </Row>
  </div>
)
