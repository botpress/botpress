import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { MetricEntry } from '../../backend/typings'

import { Channel, Extras } from './index'
import style from './style.scss'
import { mergeDataForCharts } from './utils'

const CHANNEL_COLORS = ['#1F8FFA', '#0196FF', '#4A154B', '#2EA6DA', '#4A154B']

interface Props extends Extras {
  name: string
  data: MetricEntry[] | any
  channels: Channel[]
}

const formatTick = timestamp => moment.unix(timestamp).format('D/M')
const formatTootilTick = timestamp => moment.unix(timestamp).format('dddd, MMMM Do YYYY')

const TimeSeriesChart: FC<Props> = props => {
  const { data, name, className, channels } = props

  return (
    <div className={cx(style.metricWrapper, { [style.empty]: !data.length }, className)}>
      <div className={cx(style.chartMetric, { [style.empty]: !data.length })}>
        <h3 className={style.metricName}>
          <span>{name}</span>
        </h3>
        {!data.length && <p className={style.emptyState}>{lang.tr('module.analytics.noDataAvailable')}</p>}
        {!!data.length && (
          <ResponsiveContainer height={160}>
            <AreaChart data={mergeDataForCharts(data)} margin={{ left: -30 }}>
              <defs>
                {channels
                  .filter(x => x.value !== 'all')
                  .map(({ value: channel }, idx) => (
                    <linearGradient key={idx} id={`gradientBg-${channel}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHANNEL_COLORS[idx] || '#000'} stopOpacity={0.31} />
                      <stop offset="45%" stopColor={CHANNEL_COLORS[idx] || '#000'} stopOpacity={0.34} />
                      <stop offset="73%" stopColor={CHANNEL_COLORS[idx] || '#000'} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={CHANNEL_COLORS[idx] || '#000'} stopOpacity={0} />
                    </linearGradient>
                  ))}
              </defs>
              <Tooltip labelFormatter={formatTootilTick} />
              <XAxis
                tickMargin={10}
                height={28}
                dataKey="time"
                minTickGap={0}
                interval={Math.floor(data.length / 12)}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatTick}
                tickCount={data.length}
              />
              <YAxis allowDecimals={false} />
              {channels
                .filter(x => x.value !== 'all')
                .map((channel, idx) => (
                  <Area
                    key={idx}
                    type="monotone"
                    dataKey={channel.value}
                    label={channel.label}
                    strokeWidth={3}
                    stroke={CHANNEL_COLORS[idx] || '#000'}
                    fill={`url(#gradientBg-${channel.value})`}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default TimeSeriesChart
