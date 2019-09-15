import React from 'react'
import { MdPolymer } from 'react-icons/md'

import style from './style.scss'

export default () => (
  <div className={style.splash}>
    <div>
      <MdPolymer />
      <h2>Scenario Builder</h2>
      <p>
        This tool will help you to easily build testing scenarios to test your bot's accuracy when you make changes.
        Please note that if your conversation enters in a flow, you must select all consecutive messages so the scenario
        can be replayed correclty
      </p>
    </div>
  </div>
)
