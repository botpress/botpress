import { Checkbox, Icon, IconName, Spinner } from '@blueprintjs/core'
import { confirmDialog, EmptyState, HeaderButtonProps, lang, MainContent } from 'botpress/shared'
import { AccessControl, Downloader, reorderFlows, toastFailure, toastSuccess } from 'botpress/utils'
import cx from 'classnames'
import { debounce } from 'lodash'
import React, { FC, useCallback, useEffect, useReducer, useRef, useState } from 'react'

import { isQnaComplete } from '../../backend/utils'

import style from './style.scss'
import { dispatchMiddleware, fetchReducer, itemHasError, ITEMS_PER_PAGE, Props } from './utils/qnaList.utils'
import QnA from './Components/QnA'
import EmptyStateIcon from './Icons/EmptyStateIcon'

const QNA_FILTER_KEY = `bp::${window['BOT_ID']}::qnaFilter`

const QnAList: FC<Props> = ({
  bp,
  languages,
  defaultLang,
  topicName,
  contentLang,
  updateLocalLang,
  isLite,
  events,
  refreshQnaCount
}) => {
  let filters
  try {
    filters = JSON.parse(localStorage.getItem(QNA_FILTER_KEY))
  } catch (error) {
    filters = {}
  }
  const [flows, setFlows] = useState([])
  const [questionSearch, setQuestionSearch] = useState('')
  const [currentTab, setCurrentTab] = useState('qna')
  const [currentLang, setCurrentLang] = useState(contentLang)
  const [url, setUrl] = useState('')
  const [filterOptions, setFilterOptions] = useState(filters || {})
  const [sortOption, setSortOption] = useState('mostRecent')
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
      .then(() => {})
      .catch(() => {})

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
        .then(() => {})
        .catch(() => {})
    } else {
      dispatch({ type: 'resetHighlighted' })
    }
  }, [queryParams.get('id')])

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

  useEffect(() => {
    try {
      localStorage.setItem(QNA_FILTER_KEY, JSON.stringify(filterOptions))
    } catch (error) {
      localStorage.setItem(QNA_FILTER_KEY, '{}')
    }
  }, [filterOptions])

  const fetchFlows = () => {
    bp.axios.get('/flows').then(({ data }) => {
      setFlows(reorderFlows(data.filter(flow => !flow.name.startsWith('skills/'))))
    })
  }

  const startDownload = () => {
    setUrl(`${window['BOT_API_PATH']}/mod/qna/${topicName}/export`)
  }

  const handleScroll = () => {
    if (wrapperRef.current.scrollHeight - wrapperRef.current.scrollTop !== wrapperRef.current.offsetHeight) {
      return
    }
    dispatch({ type: 'fetchMore' })
  }

  const tabs = [{ id: 'qna', title: lang.tr('module.qna.fullName') }]

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
          updateLocalLang(language)
        }
      })),
      disabled: !items.length || languages?.length <= 1,
      tooltip: noItemsTooltip || languesTooltip
    },
    {
      icon: 'filter',
      disabled: !items.length,
      optionsWrapperClassName: style.filterWrapper,
      optionsItems: [
        {
          className: style.checkboxWrapper,
          content: (
            <Checkbox
              checked={filterOptions.active}
              label={lang.tr('active')}
              onChange={() => setFilterOptions({ ...filterOptions, active: !filterOptions.active })}
            />
          )
        },
        {
          className: style.checkboxWrapper,
          content: (
            <Checkbox
              checked={filterOptions.incomplete}
              label={lang.tr('incomplete')}
              onChange={() => setFilterOptions({ ...filterOptions, incomplete: !filterOptions.incomplete })}
            />
          )
        },
        {
          className: style.checkboxWrapper,
          content: (
            <Checkbox
              checked={filterOptions.disabled}
              label={lang.tr('disabled')}
              onChange={() => setFilterOptions({ ...filterOptions, disabled: !filterOptions.disabled })}
            />
          )
        }
      ],
      tooltip: lang.tr('module.qna.filterBy')
    },
    {
      icon: 'sort',
      disabled: items.length < 2,
      optionsItems: [
        {
          label: lang.tr('module.qna.mostRecent'),
          selected: sortOption === 'mostRecent',
          action: () => {
            setSortOption('mostRecent')
          }
        },
        {
          label: lang.tr('module.qna.leastRecent'),
          selected: sortOption === 'leastRecent',
          action: () => {
            setSortOption('leastRecent')
          }
        }
      ],
      tooltip: lang.tr('module.qna.sortBy')
    },
    {
      icon: allExpanded ? 'collapse-all' : 'expand-all',
      disabled: !items.length,
      onClick: () => dispatch({ type: allExpanded ? 'collapseAll' : 'expandAll' }),
      tooltip: noItemsTooltip || lang.tr(allExpanded ? 'collapseAll' : 'expandAll')
    },
    {
      icon: 'export',
      disabled: !items.length,
      onClick: startDownload,
      tooltip: noItemsTooltip || lang.tr('module.qna.import.exportQnAs')
    }
  ]

  if (!defaultLang || defaultLang === contentLang) {
    buttons.push(
      {
        content: (
          <span className={style.customBtn}>
            <Icon icon={'import' as IconName} />
            <input
              type="file"
              onChange={async e => {
                if ((e.target as HTMLInputElement).files) {
                  await askUploadOptions((e.target as HTMLInputElement).files[0])
                }
              }}
            />
          </span>
        ),
        tooltip: lang.tr('module.qna.import.importQnAs')
      },
      {
        icon: 'plus',
        onClick: () => {
          dispatch({ type: 'addQnA', data: { languages, topicName: topicName || 'global' } })
        },
        tooltip: lang.tr('module.qna.form.addQuestion')
      }
    )
  }

  const askUploadOptions = async uploadFile => {
    if (
      await confirmDialog(`${uploadFile.name} : ${lang.tr('module.qna.import.insertNewQuestions')} ?`, {
        acceptLabel: lang.tr('ok'),
        declineLabel: lang.tr('cancel')
      })
    ) {
      await importArchive(uploadFile)
    }
  }

  const importArchive = async file => {
    const extension = file.name.split('.').slice(-1)[0]
    if (extension !== 'gz') {
      toastFailure(lang.tr('module.qna.import.badImportFormat'))
      return
    }
    let intervalHandle: number
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await bp.axios.post(`/mod/qna/${topicName}/import`, form, bp.axiosConfig)
      const uploadStatusId = data

      intervalHandle = window.setInterval(async () => {
        const { data } = await bp.axios.get(`/mod/qna/json-upload-status/${uploadStatusId}`)
        if (data === 'module.qna.import.uploadSuccessful') {
          clearInterval(intervalHandle)
          toastSuccess(lang.tr(data))
          await fetchData()
        } else if (data.split('.')[0] !== 'module') {
          toastFailure(data)
          clearInterval(intervalHandle)
        }
      }, 500)
    } catch (err) {
      clearInterval(intervalHandle)
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
    dispatch({ type: 'highlightedSuccess', data: { ...data, topicName } })
  }

  const filterQnAs = item => {
    const isNotHighlighted = highlighted?.id !== item.id
    const weKeepNothing = !filterOptions.active && !filterOptions.disabled && !filterOptions.incomplete
    const isDisabledAndWeKeepDisabled = !item.data.enabled && filterOptions.disabled
    const isIncompleteAndWeKeepIncomplete = !isQnaComplete(item.data as any, defaultLang) && filterOptions.incomplete
    const isActiveAndWeKeepActive =
      item.data.enabled && isQnaComplete(item.data as any, defaultLang) && filterOptions.active
    if (weKeepNothing) {
      return isNotHighlighted
    } else {
      return (
        isNotHighlighted && (isDisabledAndWeKeepDisabled || isIncompleteAndWeKeepIncomplete || isActiveAndWeKeepActive)
      )
    }
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
                defaultLang={defaultLang}
                deleteQnA={data => {
                  dispatch({ type: 'deleteQnA', data: { qnaItem: data, index: 'highlighted', bp, refreshQnaCount } })

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
            .filter(item => filterQnAs(item))
            .sort(
              (a, b) => (sortOption === 'mostRecent' ? +1 : -1) * (+(a.data.lastModified < b.data.lastModified) * 2 - 1)
            )
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
                defaultLang={defaultLang}
                deleteQnA={data => dispatch({ type: 'deleteQnA', data: { qnaItem: data, index, bp, refreshQnaCount } })}
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
