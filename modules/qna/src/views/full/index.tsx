import { EmptyState, HeaderButtonProps, lang, MainContent } from 'botpress/shared'
import React, { FC, useEffect, useReducer, useState } from 'react'

import style from './style.scss'
import Question from './Components/Question'
import EmptyStateIcon from './Icons/EmptyStateIcon'

const ITEMS_PER_PAGE = 20

interface State {
  count: number
  items: any[]
  loading: boolean
  page: number
}

const fetchReducer = (state: State, action): State => {
  if (action.type === 'dataSuccess') {
    const { items, count, page } = action.data

    return {
      ...state,
      count,
      items,
      loading: false,
      page
    }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

interface Props {
  bp: any
}

const QnA: FC<Props> = props => {
  const [currentTab, setCurrentTab] = useState('qna')
  const [state, dispatch] = useReducer(fetchReducer, {
    count: 0,
    items: [],
    loading: true,
    page: 1
  })

  useEffect(() => {
    fetchData()
      .then(() => {})
      .catch(() => {})
  }, [])

  const addQnA = () => {
    console.log('add')
  }

  const tabs = [
    {
      id: 'qna',
      title: lang.tr('module.qna.fullName')
    }
  ]

  const buttons: HeaderButtonProps[] = [
    {
      icon: 'translate',
      disabled: true,
      onClick: () => {}
    },
    {
      icon: 'filter',
      disabled: true,
      onClick: () => {}
    },
    {
      icon: 'sort',
      disabled: true,
      onClick: () => {}
    },
    {
      icon: 'collapse-all',
      disabled: true,
      onClick: () => {}
    },
    {
      icon: 'plus',
      onClick: addQnA
    }
  ]

  const fetchData = async (page = 1) => {
    const params = { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE }
    const { data } = await props.bp.axios.get('/mod/qna/questions', { params })

    dispatch({ type: 'dataSuccess', data: { ...data, page } })
  }

  const { items, loading } = state

  return (
    <MainContent.Wrapper>
      <MainContent.Header tabChange={setCurrentTab} tabs={tabs} buttons={buttons} />
      <div className={style.content}>
        {!!items.length && items.map(item => <Question key={item.id} question={item} />)}
        {!items.length && !loading && <EmptyState icon={<EmptyStateIcon />} text={lang.tr('module.qna.emptyState')} />}
      </div>
    </MainContent.Wrapper>
  )
}

export default QnA
