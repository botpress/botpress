import { Spinner } from '@blueprintjs/core'
import { EmptyState, HeaderButtonProps, lang, MainLayout } from 'botpress/shared'
import cx from 'classnames'
import { debounce } from 'lodash'
import React, { FC, useCallback, useEffect, useReducer, useRef, useState } from 'react'

import ContextSelector from './Components/ContextSelector'
import { Downloader } from './Components/Downloader'
import { ImportModal } from './Components/ImportModal'
import QnA from './Components/QnA'
import EmptyStateIcon from './Icons/EmptyStateIcon'
import style from './style.scss'
import { dispatchMiddleware, fetchReducer, itemHasError, ITEMS_PER_PAGE, Props } from './utils/qnaList.utils'
import { reorderFlows } from './utils/studio-utils'

const QnAList: FC<Props> = props => {
  const [flows, setFlows] = useState([])
  const [filterContexts, setFilterContexts] = useState([])
  const [questionSearch, setQuestionSearch] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [currentTab, setCurrentTab] = useState('qna')
  const [currentLang, setCurrentLang] = useState(props.contentLang)
  const [url, setUrl] = useState('')
  const debounceDispatchMiddleware = useCallback(debounce(dispatchMiddleware, 300), [])
  const wrapperRef = useRef<HTMLDivElement>()
  const [state, dispatch] = useReducer(fetchReducer, {
    count: 0,
    items: [],
    highlighted: undefined,
    loading: true,
    firstUpdate: true,
    page: 1,
    fetchMore: false,
    expandedItems: {}
  })
  const { items, loading, firstUpdate, page, fetchMore, count, expandedItems, highlighted } = state
  const { bp, languages, defaultLanguage, isLite } = props
  const queryParams = new URLSearchParams(window.location.search)

  useEffect(() => {
    wrapperRef.current.addEventListener('scroll', handleScroll)

    fetchData()
      .then(() => {})
      .catch(() => {})

    fetchFlows()

    return () => {
      wrapperRef.current.removeEventListener('scroll', handleScroll)
      dispatch({ type: 'resetData' })
      setFilterContexts([])
      setQuestionSearch('')
    }
  }, [])

  useEffect(() => {
    if (queryParams.get('id')) {
      fetchHighlightedQna(queryParams.get('id'))
        .then(() => {})
        .catch(() => {})
    } else {
      dispatch({ type: 'resetHighlighted' })
    }
  }, [queryParams.get('id')])

  useEffect(() => {
    if (!firstUpdate) {
      fetchData()
        .then(() => {})
        .catch(() => {})
    }
  }, [filterContexts])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!firstUpdate) {
        fetchData()
          .then(() => {})
          .catch(() => {})
      }
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

  const fetchFlows = () => {
    bp.axios.get('/flows', { baseURL: window.STUDIO_API_PATH }).then(({ data }) => {
      setFlows(reorderFlows(data.filter(flow => !flow.name.startsWith('skills/'))))
    })
  }

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
    /*{
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
    },*/
    {
      icon: allExpanded ? 'collapse-all' : 'expand-all',
      disabled: !items.length,
      onClick: () => dispatch({ type: allExpanded ? 'collapseAll' : 'expandAll' }),
      tooltip: noItemsTooltip || lang.tr(allExpanded ? 'collapseAll' : 'expandAll')
    }
  ]

  if (!isLite) {
    buttons.push(
      {
        icon: 'export',
        disabled: !items.length,
        onClick: startDownload,
        tooltip: noItemsTooltip || lang.tr('exportToJson')
      },
      {
        icon: 'import',
        onClick: () => setShowImportModal(true),
        tooltip: lang.tr('importJson')
      }
    )
  }

  buttons.push({
    icon: 'plus',
    onClick: () => {
      dispatch({ type: 'addQnA', data: { languages, contexts: [props.topicName || 'global'] } })
    },
    tooltip: lang.tr('module.qna.form.addQuestion')
  })

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

  const fetchHighlightedQna = async id => {
    const { data } = await bp.axios.get(`/mod/qna/questions/${id}`)

    dispatch({ type: 'highlightedSuccess', data })
  }

  const hasFilteredResults = questionSearch.length || filterContexts.length

  const toolBarRightContent = (
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
  )

  return (
    <MainLayout.Wrapper childRef={ref => (wrapperRef.current = ref)}>
      <MainLayout.Toolbar
        className={style.header}
        tabChange={setCurrentTab}
        tabs={tabs}
        buttons={buttons}
        rightContent={items.length > 1 ? toolBarRightContent : null}
      />
      <div className={cx(style.content, { [style.empty]: !items.length && !highlighted })}>
        {highlighted && (
          <div className={style.highlightedQna}>
            <QnA
              updateQnA={data =>
                debounceDispatchMiddleware(dispatch, {
                  type: 'updateQnA',
                  data: { qnaItem: data, index: 'highlighted', bp, currentLang }
                })
              }
              convertToIntent={() => {
                dispatch({ type: 'convertQnA', data: { index: 'highlighted', bp } })
              }}
              bp={bp}
              isLite={isLite}
              key={highlighted.id}
              flows={flows}
              defaultLanguage={defaultLanguage}
              deleteQnA={() => {
                dispatch({ type: 'deleteQnA', data: { index: 'highlighted', bp } })

                window.history.pushState(
                  window.history.state,
                  '',
                  window.location.href.replace(window.location.search, '')
                )
              }}
              toggleEnabledQnA={() =>
                dispatchMiddleware(dispatch, {
                  type: 'toggleEnabledQnA',
                  data: { qnaItem: highlighted, bp }
                })
              }
              contentLang={currentLang}
              errorMessages={itemHasError(highlighted, currentLang)}
              setExpanded={isExpanded => dispatch({ type: 'toggleExpandOne', data: { highlighted: isExpanded } })}
              expanded={expandedItems['highlighted']}
              qnaItem={highlighted}
            />
          </div>
        )}
        {items
          .filter(item => highlighted?.id !== item.id)
          .map((item, index) => (
            <QnA
              updateQnA={data =>
                debounceDispatchMiddleware(dispatch, {
                  type: 'updateQnA',
                  data: { qnaItem: data, index, bp, currentLang }
                })
              }
              key={item.key || item.id}
              bp={bp}
              isLite={isLite}
              flows={flows}
              defaultLanguage={defaultLanguage}
              convertToIntent={() => dispatch({ type: 'convertQnA', data: { index, bp } })}
              deleteQnA={() => dispatch({ type: 'deleteQnA', data: { index, bp } })}
              toggleEnabledQnA={() =>
                dispatchMiddleware(dispatch, { type: 'toggleEnabledQnA', data: { qnaItem: item, bp } })
              }
              contentLang={currentLang}
              errorMessages={itemHasError(item, currentLang)}
              setExpanded={isExpanded =>
                dispatch({ type: 'toggleExpandOne', data: { [item.key || item.id]: isExpanded } })
              }
              expanded={expandedItems[item.key || item.id]}
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
        onImportCompleted={() => fetchData()}
        isOpen={showImportModal}
        toggle={() => setShowImportModal(!showImportModal)}
      />
    </MainLayout.Wrapper>
  )
}

export default QnAList
