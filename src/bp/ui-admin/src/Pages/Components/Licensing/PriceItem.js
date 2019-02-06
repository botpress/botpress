import React from 'react'

const PriceItem = props => (
  <tr>
    <td align="center" valign="top">
      <div style={{ width: '50px' }}>{props.children}</div>
    </td>
    <td>
      <div className="title">
        {props.title}{' '}
        <small>
          &nbsp;&nbsp;(
          {props.price})
        </small>
      </div>
      <div className="description">{props.description}</div>
    </td>
    <td align="right">
      <div className="price">{props.total !== undefined ? `${props.total} $ / m` : ''}</div>
    </td>
  </tr>
)

export default PriceItem
