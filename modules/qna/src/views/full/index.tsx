import { Spinner, IconName, Icon } from '@blueprintjs/core'
import { EmptyState, HeaderButtonProps, lang, MainContent, confirmDialog } from 'botpress/shared'
import { AccessControl, Downloader, reorderFlows, toastFailure, toastSuccess } from 'botpress/utils'
import cx from 'classnames'
import { debounce } from 'lodash'
import React, { FC, useCallback, useEffect, useReducer, useRef, useState } from 'react'

import style from './style.scss'
import { dispatchMiddleware, fetchReducer, itemHasError, ITEMS_PER_PAGE, Props } from './utils/qnaList.utils'
import QnA from './Components/QnA'
import EmptyStateIcon from './Icons/EmptyStateIcon'
import { props } from 'bluebird'

const QnAList: FC<Props> = ({
  bp,
  languages,
  defaultLanguage,
  topicName,
  contentLang,
  isLite,
  events,
  refreshQnaCount
}) => {
  const [flows, setFlows] = useState([])
  const [questionSearch, setQuestionSearch] = useState('')
  const [currentTab, setCurrentTab] = useState('qna')
  const [currentLang, setCurrentLang] = useState(contentLang)
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
  const queryParams = new URLSearchParams(window.location.search)

  useEffect(() => {
    wrapperRef.current.addEventListener('scroll', handleScroll)
    fetchData()
      .then(() => { })
      .catch(() => { })

    fetchFlows()

    return () => {
      wrapperRef.current.removeEventListener('scroll', handleScroll)
      dispatch({ type: 'resetData' })
      setQuestionSearch('')
    }
  }, [])

  useEffect(() => {
    if (queryParams.get('id')) {
      fetchHighlightedQna(queryParams.get('id'))
        .then(() => { })
        .catch(() => { })
    } else {
      dispatch({ type: 'resetHighlighted' })
    }
  }, [queryParams.get('id')])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!firstUpdate) {
        fetchData()
          .then(() => { })
          .catch(() => { })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [questionSearch])

  useEffect(() => {
    if (!loading && fetchMore && items.length < count) {
      fetchData(page + 1)
        .then(() => { })
        .catch(() => { })
    }
  }, [fetchMore])

  const fetchFlows = () => {
    bp.axios.get('/flows').then(({ data }) => {
      setFlows(reorderFlows(data.filter(flow => !flow.name.startsWith('skills/'))))
    })
  }

  const startDownload = () => { setUrl(`${window['BOT_API_PATH']}/mod/qna/${topicName}/export`) }

  const handleScroll = () => {
    if (wrapperRef.current.scrollHeight - wrapperRef.current.scrollTop !== wrapperRef.current.offsetHeight) {
      return
    }
    dispatch({ type: 'fetchMore' })
  }

  const tabs = [{ id: 'qna', title: lang.tr('module.qna.fullName') }]

  const allExpanded = Object.keys(expandedItems).filter(itemId => expandedItems[itemId]).length === items.length

  let noItemsTooltip
  let languesTooltip = lang.tr('translate')

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

  buttons.push(
    {
      icon: 'export',
      disabled: !items.length,
      onClick: startDownload,
      tooltip: noItemsTooltip || lang.tr('exportToJson')
    },
    {
      content: (
        <span className={style.uploadWrapper}>
          <Icon className={style.fakeIconInput} icon={'import' as IconName} />
          <input
            type="file"
            className={style.fakeInput}
            onChange={e => {
              if ((e.target as HTMLInputElement).files) {
                askUploadOptions((e.target as HTMLInputElement).files[0])
              }
            }} />
        </span>
      ),
      icon: 'import',
      tooltip: lang.tr('importJson')
    }
  )

  buttons.push({
    icon: 'plus',
    onClick: () => {
      dispatch({ type: 'addQnA', data: { languages, topicName: topicName || 'global' } })
    },
    tooltip: lang.tr('module.qna.form.addQuestion')
  })

  const askUploadOptions = async (uploadFile) => {
    if (await confirmDialog(`${uploadFile.name} : ${lang.tr('module.qna.import.insertNewQuestions')} ?`, { acceptLabel: "Yes", declineLabel: "No" })) {
      importTar(uploadFile)
    }
  }

  const importTar = async file => {
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await bp.axios.post(`/mod/qna/${topicName}/import`, form, bp.axiosConfig)
      const uploadStatusId = data

      const interval = setInterval(async () => {
        const { data } = await bp.axios.get(`/mod/qna/json-upload-status/${uploadStatusId}`)
        if (data === 'module.qna.import.uploadSuccessful') {
          clearInterval(interval)
          toastSuccess(lang.tr(data))
        } else if (data.split('.')[0] !== 'module') {
          toastFailure(data)
          clearInterval(interval)
        }
      }, 500)
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const fetchData = async (page = 1) => {
    dispatch({ type: 'loading' })
    const params = !isLite ? { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE } : {}
    const { data } = await bp.axios.get(`/mod/qna/${topicName}/questions`, {
      params: { ...params, question: questionSearch }
    })

    dispatch({
      type: 'dataSuccess',
      data: { ...data, items: data.items.map(x => ({ id: x.id, data: { ...x, topicName } })), page }
    })
  }

  const fetchHighlightedQna = async id => {
    const { data } = await bp.axios.get(`/mod/qna/${topicName}/questions/${id}`)
    dispatch({ type: 'highlightedSuccess', data })
  }

  return (
    <AccessControl resource="module.qna" operation="write">
      <MainContent.Wrapper className={style.embeddedInFlow} childRef={ref => (wrapperRef.current = ref)}>
        <MainContent.Header className={style.header} tabChange={setCurrentTab} tabs={tabs} buttons={buttons} />
        <div className={style.searchWrapper}>
          <input
            className={style.input}
            type="text"
            value={questionSearch}
            onChange={e => setQuestionSearch(e.currentTarget.value)}
            placeholder={lang.tr('module.qna.search')}
          />
        </div>
        <div className={cx(style.content, { [style.empty]: !items.length && !highlighted })}>
          {highlighted && (
            <div className={style.highlightedQna}>
              <QnA
                updateQnA={data =>
                  debounceDispatchMiddleware(dispatch, {
                    type: 'updateQnA',
                    data: { qnaItem: data, index: 'highlighted', bp, currentLang, refreshQnaCount }
                  })
                }
                bp={bp}
                isLite={isLite}
                key={highlighted.id}
                flows={flows}
                events={events}
                defaultLanguage={defaultLanguage}
                deleteQnA={() => {
                  dispatch({ type: 'deleteQnA', data: { index: 'highlighted', bp, refreshQnaCount } })

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
                    data: { qnaItem: data, index, bp, currentLang, refreshQnaCount }
                  })
                }
                key={item.key || item.id}
                bp={bp}
                isLite={isLite}
                flows={flows}
                events={events}
                defaultLanguage={defaultLanguage}
                deleteQnA={() => dispatch({ type: 'deleteQnA', data: { index, bp, refreshQnaCount } })}
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
                questionSearch.length
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
      </MainContent.Wrapper>
    </AccessControl>
  )
}

export default QnAList
