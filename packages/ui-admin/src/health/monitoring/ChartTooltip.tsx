import _ from 'lodash'
import moment from 'moment'
import React from 'react'
import style from './style.scss'

const ChartTooltip = ({ payload, date, uniqueHosts }) => (
  <div className={style.graphToolTip}>
    <table cellSpacing={0} cellPadding={0}>
      <tbody>
        <tr>
          <td colSpan={10} style={{ textAlign: 'center' }}>
            {moment(date).format('HH:mm:ss')}
          </td>
        </tr>
        <tr>
          <th>Host </th>
          {payload.map(data => {
            return (
              <th style={{ color: data.stroke || data.fill }} key={data.name}>
                {data.name}
              </th>
            )
          })}
        </tr>

        {uniqueHosts.map(host => {
          return (
            <tr key={host}>
              <td>{host}</td>
              {payload.map(data => {
                return (
                  <td style={{ color: data.stroke || data.fill }} key={data.name}>
                    {_.get(data.payload.hosts[host], data.dataKey.replace('summary.', ''))} {data.unit}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

export default ChartTooltip
