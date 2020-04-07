import React from 'react'
import './style.css'

export const InfoSource = props => (
  <div>
    <div className="bpw-infosource-question">{props.question}</div>
    {props.children}
    <div className="bpw-infosource-source">
      <a className="bpw-infosource-url" target="_blank" href={props.url}>
        Source
      </a>
      · <span className="bpw-infosource-time">{props.time}</span>
    </div>
  </div>
)
