import React from 'react'

export default ({ height = 200, width = 200 }) => (
  <i>
    <svg
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
    >
      <circle
        cx="50"
        cy="50"
        r="7.15006"
        fill="none"
        ng-attr-stroke="{{config.c1}}"
        ng-attr-stroke-width="{{config.width}}"
        stroke="#8cd0e5"
        stroke-width="2"
      >
        <animate
          attributeName="r"
          calcMode="spline"
          values="0;40"
          keyTimes="0;1"
          dur="1"
          keySplines="0 0.2 0.8 1"
          begin="-0.5s"
          repeatCount="indefinite"
        ></animate>
        <animate
          attributeName="opacity"
          calcMode="spline"
          values="1;0"
          keyTimes="0;1"
          dur="1"
          keySplines="0.2 0 0.8 1"
          begin="-0.5s"
          repeatCount="indefinite"
        ></animate>
      </circle>
      <circle
        cx="50"
        cy="50"
        r="29.0072"
        fill="none"
        ng-attr-stroke="{{config.c2}}"
        ng-attr-stroke-width="{{config.width}}"
        stroke="#376888"
        stroke-width="2"
      >
        <animate
          attributeName="r"
          calcMode="spline"
          values="0;40"
          keyTimes="0;1"
          dur="1"
          keySplines="0 0.2 0.8 1"
          begin="0s"
          repeatCount="indefinite"
        ></animate>
        <animate
          attributeName="opacity"
          calcMode="spline"
          values="1;0"
          keyTimes="0;1"
          dur="1"
          keySplines="0.2 0 0.8 1"
          begin="0s"
          repeatCount="indefinite"
        ></animate>
      </circle>
    </svg>
  </i>
)
