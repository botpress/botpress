import _ from 'lodash'
import moment from 'moment'
import { FC } from 'react'

import { Attribute } from '../../../config'

interface Props {
  /** All attributes from the user objectg */
  attributes: any
  /** Configurations from the module config file */
  config: Attribute
}

export const Formatter: FC<Props> = props => {
  const { formatter, attributePath, defaultValue } = props.config
  const value = _.get(props.attributes, attributePath, defaultValue)

  if (!value) {
    return ''
  }

  if (!formatter) {
    return value
  }

  // TODO: use react intl for date format. Add other formatter
  if (formatter.startsWith('moment:')) {
    return moment(value).format(formatter.replace('moment:', ''))
  } else if (formatter === 'date') {
    return moment(value).format('YYYY-MM-DD')
  } else if (formatter === 'datetime') {
    return moment(value).format('YYYY-MM-DD HH:mm:ss')
  } else if (formatter === 'fromNow') {
    return moment(value).fromNow()
  }

  return value
}
