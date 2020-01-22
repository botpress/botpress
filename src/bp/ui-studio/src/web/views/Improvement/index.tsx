import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'

import { fetchImprovements } from '../../actions'

import style from './style.scss'
import ConversationPreview from './ConversationPreview'
import Feedback from './Feedback'

const Improvement = props => {
  const [feedbackItem, setFeedbackItem] = useState(null)

  useEffect(() => {
    console.log('fetching improvements')
    props.fetchImprovements()
  }, [])

  return (
    <div className={style.root}>
      <div>
        <h2>Flagged Messages</h2>
        {props.feedbackItems.map((item, i) => {
          return (
            <Feedback
              key={`feedback-${i}`}
              item={item}
              onItemClicked={() => {
                setFeedbackItem(item)
              }}
            />
          )
        })}
      </div>
      {feedbackItem && <ConversationPreview item={feedbackItem} />}
    </div>
  )
}

const mapStateToProps = state => ({
  feedbackItems: state.improvements
})

const mapDispatchToProps = { fetchImprovements }

export default connect(mapStateToProps, mapDispatchToProps)(Improvement)
