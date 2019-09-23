import { Button } from '@blueprintjs/core'
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
            ? `Sign in with SSO (${strategyId})`
            : `Sign in with user/pass`

        return (
          <Button
            key={strategyId}
            id={`btn-${strategyId}`}
            text={label ? `Sign in with ${label}` : defaultLabel}
            onClick={() => props.onStrategySelected(strategyId)}
          />
        )
      })}
    </div>
  )
}
