import cx from 'classnames'
import React, { FC } from 'react'
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'

import { Extras } from './index'
import style from './style.scss'
import { getNotNaN } from './utils'

interface Props extends Extras {
  name: string
  value: number | string
}

const RadialMetric: FC<Props> = props => {
  const { name, value, className } = props
  const data = [{ value }]

  const circleSize = 130

  return (
    <div className={cx(style.genericMetric, className)}>
      <ResponsiveContainer height={circleSize}>
        <RadialBarChart
          innerRadius={circleSize / 2 - 4}
          outerRadius={circleSize / 2}
          barSize={4}
          data={data}
          startAngle={90}
          endAngle={-270}
          className={style.radialChart}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background clockWise dataKey="value" cornerRadius={circleSize / 2} fill="#0F9960" />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className={style.radialChartLabel}>
            {getNotNaN(value, '%')}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <div>
        <h3 className={style.metricName}>{name}</h3>
      </div>
    </div>
  )
}

export default RadialMetric
