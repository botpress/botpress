import React, { FC, useEffect } from 'react'
import { connect } from 'react-redux'

import { fetchImprovements } from '../../actions'

const Improvement = props => {
  useEffect(() => {
    console.log('fetching improvements')
    props.fetchImprovements()
  })

  return (
    <div>
      <h1>Bot Improvement</h1>
      <div>Flagged Messages</div>
      <div>Conversation Preview</div>
    </div>
  )
}

const mapStateToProps = state => ({})

const mapDispatchToProps = { fetchImprovements }

export default connect(mapStateToProps, mapDispatchToProps)(Improvement)
