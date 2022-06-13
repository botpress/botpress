import { Menu, MenuItem } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC } from 'react'
import Loading from '../icons/Loading'

const SuggestionList: FC<SuggestionListProps> = props => {
  const { isLoading, suggestions, onItemClick } = props
  return (
    <>
      {isLoading ? (
        <div className={'bpw-suggestion-loading'}>
          <Loading width={40} height={40} />
        </div>
      ) : (
        !_.isEmpty(suggestions) && (
          <Menu className={'bpw-suggestion-list'}>
            {suggestions.map(suggestion => {
              return (
                <MenuItem
                  className={'bpw-suggestion-item'}
                  key={suggestion}
                  text={suggestion}
                  onClick={(event: React.MouseEvent<HTMLElement>) => onItemClick(event, suggestion)}
                />
              )
            })}
          </Menu>
        )
      )}
    </>
  )
}

export default SuggestionList

interface SuggestionListProps {
  isLoading: boolean
  suggestions: string[]
  onItemClick: (event: React.MouseEvent<HTMLElement>, value: string) => void
}
