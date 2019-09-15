import React from 'react'
import cx from 'classnames'

const MentionText = ({ children, className }) => (
  <span className={className} spellCheck={false}>
    {children}
  </span>
)

const Mention = props => {
  const { entityKey, theme = {}, children, decoratedText, className, contentState } = props

  const combinedClassName = cx(theme.mention, className)
  const mention = contentState.getEntity(entityKey).getData().mention
  const Component = MentionText

  return (
    <Component
      entityKey={entityKey}
      mention={mention}
      theme={theme}
      className={combinedClassName}
      decoratedText={decoratedText}
    >
      {children}
    </Component>
  )
}

export default Mention
