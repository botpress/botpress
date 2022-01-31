import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { AuthStrategyConfig } from 'common/typings'
import React, { FC } from 'react'

interface Props {
  strategies: AuthStrategyConfig[]
  onStrategySelected: (strategyId: string) => void
}

export const AuthMethodPicker: FC<Props> = props => {
  if (!props.strategies) {
    return null
  }

  return (
    <div>
      {props.strategies.map((config: AuthStrategyConfig) => {
        const { strategyType, strategyId, label } = config

        const defaultLabel =
          strategyType === 'saml' || strategyType === 'oauth2'
            ? lang.tr('admin.signInWithSSO', { strategyId })
            : lang.tr('admin.signInWithUserPass')

        return (
          <Button
            key={strategyId}
            id={`btn-${strategyId}-signin`}
            text={label ? lang.tr('admin.signInWithLabel', { label }) : defaultLabel}
            onClick={() => props.onStrategySelected(strategyId)}
          />
        )
      })}
    </div>
  )
}
