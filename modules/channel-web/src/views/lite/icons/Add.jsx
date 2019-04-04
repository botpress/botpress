import React from 'react'

export default ({ height, width }) => (
  <i>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      x="0px"
      y="0px"
      width={width || 20}
      height={height || 20}
      viewBox="0 0 357 357"
      space="preserve"
    >
      <g id="add">
        <path d="M357,204H204v153h-51V204H0v-51h153V0h51v153h153V204z" />
      </g>
    </svg>
  </i>
)
