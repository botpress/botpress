import { Spinner } from '@blueprintjs/core'
import { EmptyState, HeaderButtonProps, lang, MainContent } from 'botpress/shared'
import { Downloader } from 'botpress/utils'
import cx from 'classnames'
import React, { FC, useEffect, useReducer, useRef, useState } from 'react'

import style from './style.scss'
import { dispatchMiddleware, fetchReducer, itemHasError, ITEMS_PER_PAGE, Props } from './utils/qnaList.utils'
import ContextSelector from './Components/ContextSelector'
import { ImportModal } from './Components/ImportModal'
import QnA from './Components/QnA'
import EmptyStateIcon from './Icons/EmptyStateIcon'

const QnAList: FC<Props> = props => {
  const [filterContexts, setFilterContexts] = useState([])
  const [questionSearch, setQuestionSearch] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [currentTab, setCurrentTab] = useState('qna')
  const [currentLang, setCurrentLang] = useState(props.contentLang)
  const [url, setUrl] = useState('')
  const wrapperRef = useRef<HTMLDivElement>()
  const [state, dispatch] = useReducer(fetchReducer, {
    count: 0,
    items: [],
    loading: true,
    page: 1,
    fetchMore: false,
    expandedItems: {}
  })
  const { items, loading, page, fetchMore, count, expandedItems } = state
  const { bp, languages, defaultLanguage, isLite } = props

  useEffect(() => {
    wrapperRef.current.addEventListener('scroll', handleScroll)

    dispatch({ type: 'resetData' })
    fetchData()
      .then(() => {})
      .catch(() => {})

    return () => wrapperRef.current.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetchData(1)
      .then(() => {})
      .catch(() => {})
  }, [filterContexts])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1)
        .then(() => {})
        .catch(() => {})
    }, 300)

    return () => clearTimeout(timer)
  }, [questionSearch])

  useEffect(() => {
    if (!loading && fetchMore && items.length < count) {
      fetchData(page + 1)
        .then(() => {})
        .catch(() => {})
    }
  }, [fetchMore])

  const startDownload = () => {
    setUrl(`${window['BOT_API_PATH']}/mod/qna/export`)
  }

  const getQueryParams = () => {
    return {
      filteredContexts: [props.topicName]
    }
  }

  const handleScroll = () => {
    if (wrapperRef.current.scrollHeight - wrapperRef.current.scrollTop !== wrapperRef.current.offsetHeight) {
      return
    }

    dispatch({ type: 'fetchMore' })
  }

  const tabs = [
    !isLite && {
      id: 'qna',
      title: lang.tr('module.qna.fullName')
    }
  ]

  const allExpanded = Object.keys(expandedItems).filter(itemId => expandedItems[itemId]).length === items.length

  let noItemsTooltip
  let languesTooltip = lang.tr('module.qna.form.translate')

  if (!items.length) {
    noItemsTooltip = lang.tr('module.qna.form.addOneItemTooltip')
  }

  if (languages?.length <= 1) {
    languesTooltip = lang.tr('module.qna.form.onlyOneLanguage')
  }

  const buttons: HeaderButtonProps[] = [
    !isLite && {
      icon: 'import',
      disabled: !items.length,
      onClick: () => setShowImportModal(true),
      tooltip: noItemsTooltip || lang.tr('importJson')
    },
    !isLite && {
      icon: 'export',
      disabled: !items.length,
      onClick: startDownload,
      tooltip: noItemsTooltip || lang.tr('exportToJson')
    },
    {
      icon: 'translate',
      optionsItems: languages?.map(language => ({
        label: lang.tr(`isoLangs.${language}.name`),
        selected: currentLang === language,
        action: () => {
          setCurrentLang(language)
        }
      })),
      disabled: !items.length || languages?.length <= 1,
      tooltip: noItemsTooltip || languesTooltip
    },
    {
      icon: 'filter',
      disabled: true,
      onClick: () => {},
      tooltip: noItemsTooltip || lang.tr('filterBy')
    },
    {
      icon: 'sort',
      disabled: true,
      onClick: () => {},
      tooltip: noItemsTooltip || lang.tr('sortBy')
    },
    {
      icon: allExpanded ? 'collapse-all' : 'expand-all',
      disabled: !items.length,
      onClick: () => dispatch({ type: allExpanded ? 'collapseAll' : 'expandAll' }),
      tooltip: noItemsTooltip || lang.tr(allExpanded ? 'collapseAll' : 'expandAll')
    },
    {
      icon: 'plus',
      onClick: () => {
        dispatch({ type: 'addQnA', data: { languages, contexts: [props.topicName || 'global'] } })
      },
      tooltip: lang.tr('module.qna.form.addQuestion')
    }
  ]

  const fetchData = async (page = 1) => {
    dispatch({ type: 'loading' })
    const params = !isLite
      ? { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE, filteredContexts: filterContexts }
      : getQueryParams()

    const { data } = await bp.axios.get('/mod/qna/questions', {
      params: { ...params, question: questionSearch }
    })

    dispatch({ type: 'dataSuccess', data: { ...data, page } })
  }

  const hasFilteredResults = questionSearch.length || filterContexts.length

  return (
    <MainContent.Wrapper childRef={ref => (wrapperRef.current = ref)}>
      <MainContent.Header className={style.header} tabChange={setCurrentTab} tabs={tabs} buttons={buttons} />

      <div className={style.searchWrapper}>
        <input
          className={style.input}
          type="text"
          value={questionSearch}
          onChange={e => setQuestionSearch(e.currentTarget.value)}
          placeholder={lang.tr('module.qna.search')}
        />

        {!isLite && (
          <ContextSelector
            className={style.contextInput}
            contexts={filterContexts}
            saveContexts={contexts => setFilterContexts(contexts)}
            bp={bp}
            isSearch
          />
        )}
      </div>
      <div className={cx(style.content, { [style.empty]: !items.length })}>
        {items.map((item, index) => (
          <QnA
            updateQnA={data =>
              dispatchMiddleware(dispatch, {
                type: 'updateQnA',
                data: { qnaItem: data, index, bp, currentLang }
              })
            }
            key={item.id}
            defaultLanguage={defaultLanguage}
            deleteQnA={() => dispatch({ type: 'deleteQnA', data: { index, bp } })}
            toggleEnabledQnA={() =>
              dispatchMiddleware(dispatch, { type: 'toggleEnabledQnA', data: { qnaItem: item, index, bp } })
            }
            contentLang={currentLang}
            errorMessages={itemHasError(item, currentLang)}
            setExpanded={isExpanded => dispatch({ type: 'toggleExpandOne', data: { [item.id]: isExpanded } })}
            expanded={expandedItems[item.id]}
            qnaItem={item}
          />
        ))}
        {!items.length && !loading && (
          <EmptyState
            icon={<EmptyStateIcon />}
            text={
              hasFilteredResults
                ? lang.tr('module.qna.form.noResultsFromFilters')
                : lang.tr('module.qna.form.emptyState')
            }
          />
        )}
        {loading && (
          <Spinner
            className={cx({ [style.initialLoading]: !fetchMore, [style.loading]: fetchMore })}
            size={fetchMore ? 20 : 50}
          />
        )}
      </div>

      <Downloader url={url} />

      <ImportModal
        axios={bp.axios}
        onImportCompleted={() => fetchData(1)}
        isOpen={showImportModal}
        toggle={() => setShowImportModal(!showImportModal)}
      />
    </MainContent.Wrapper>
  )
}

export default QnAList
