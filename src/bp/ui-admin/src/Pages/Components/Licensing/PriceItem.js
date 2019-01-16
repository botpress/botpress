import React from 'react'
import { Col } from 'reactstrap'

const PriceItem = props => (
  <tr>
    <td align="center" valign="top">
      <Col sm={10}>{props.children}</Col>
    </td>
    <td>
      <div className="title">
        {props.title} <small>&nbsp;&nbsp;({props.price})</small>
      </div>
      <div className="description">{props.description}</div>
    </td>
    <td align="right">
      <div className="price">{props.total !== undefined ? props.total + '$' : ''}</div>
    </td>
  </tr>
)

export default PriceItem
