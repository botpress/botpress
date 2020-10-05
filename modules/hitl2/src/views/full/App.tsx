import React, { useContext, useEffect, useState } from 'react'

import { Api } from './Api'
import { Context } from './Store'

import { toast } from 'botpress/shared'
import { Grid, Row, Col } from 'react-flexbox-grid'

import style from './style.scss'

const App = ({ bp }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)
  return (
  )
}

export default App
