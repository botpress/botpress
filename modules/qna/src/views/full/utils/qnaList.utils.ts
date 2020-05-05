import { lang } from "botpress/shared"
import _ from 'lodash'
import _uniqueId from 'lodash/uniqueId'

import { QnaItem } from "../../../backend/qna"

export const ITEMS_PER_PAGE = 20

export interface State {
  count: number
  items: any[]
  loading: boolean
  page: number
  fetchMore: boolean
  expandedItems: { [key: string]: boolean }
}

export interface Props {
  bp: any
  contentLang: string
  defaultLanguage: string
  languages: string[]
}

export interface FormErrors {
  answers: {[key: string]: string}
  questions: {[key: string]: string}
}

export const hasPopulatedLang = (data: { [lang: string]: string[] }): boolean => {
  return !!Object.keys(data).reduce((acc, lang) => acc + data[lang].filter(entry => !!entry.trim().length).length, 0)
}

export const getFormErrors = (qnaItems: QnaItem[], currentLang: string): FormErrors => {
  return {
    answers: isolateDuplicates(qnaItems, currentLang, 'answers'),
    questions: isolateDuplicates(qnaItems, currentLang, 'questions')
  }
}

const isolateDuplicates = (qnaItems: QnaItem[], currentLang: string, type: string): {[itemId: string]: string} => {
  const errors = {}

  qnaItems.reduce((acc, qnaItem) => {
    qnaItem.data[type][currentLang].forEach(item => {
      errors[qnaItem.id] = acc
        .filter(item2 => item2.length)
        .includes(item)
        ? lang.tr(`module.qna.form.${type === 'answers' ? 'duplicateAnswer' : 'duplicateQuestion'}`)
        : null

      acc = [...acc, item]
    })
    return acc
  }, [])

  return errors
}

export const itemHasError = (qnaItem: QnaItem, formErrors: FormErrors): string => {
  const { id, data } = qnaItem

  if (!hasPopulatedLang(data.questions)) {
    return lang.tr('module.qna.form.missingQuestion')
  } else if (!hasPopulatedLang(data.answers)) {
    return lang.tr('module.qna.form.missingAnswer')
  }

  console.log(id, formErrors, formErrors.questions[id], formErrors.answers[id])

  return formErrors.questions[id] || formErrors.answers[id]
}

export const dispatchMiddleware = async (dispatch, action) => {
  switch (action.type) {
    case 'updateQnA':
      const { qnaItem, bp, qnaItems, currentLang } = action.data
      const formErrors = getFormErrors(qnaItems, currentLang)
      let itemId = qnaItem.id

      if (!itemHasError(qnaItem, formErrors)) {
        const { answers, questions } = qnaItem.data
        const cleanData = {
          ...qnaItem.data,
          answers: {
            ...Object.keys(answers).reduce(
              (acc, lang) => ({ ...acc, [lang]: [...answers[lang].filter(entry => !!entry.trim().length)] }),
              {}
            )
          },
          questions: {
            ...Object.keys(questions).reduce(
              (acc, lang) => ({ ...acc, [lang]: [...questions[lang].filter(entry => !!entry.trim().length)] }),
              {}
            )
          }
        }
        if (qnaItem.id.startsWith('qna-')) {
          const res = await bp.axios.post('/mod/qna/questions', cleanData)
          itemId = res.data[0]
        } else {
          await bp.axios.post(`/mod/qna/questions/${qnaItem.id}`, cleanData)
        }
      }

      dispatch({ ...action, data: { ...action.data, qnaItem: { ...qnaItem, id: itemId } } })
      break

    default:
      return dispatch(action)
  }
}

export const fetchReducer = (state: State, action): State => {
  if (action.type === 'dataSuccess') {
    const { items, count, page } = action.data

    return {
      ...state,
      count,
      items: [...state.items, ...items],
      loading: false,
      page,
      fetchMore: false
    }
  } else if (action.type === 'resetData') {
    return {
      ...state,
      count: 0,
      items: [],
      page: 1,
      fetchMore: false,
      expandedItems: {}
    }
  } else if (action.type === 'loading') {
    return {
      ...state,
      loading: true
    }
  } else if (action.type === 'updateQnA') {
    const { qnaItem, index } = action.data
    const newItems = state.items

    newItems[index] = { ...newItems[index], id: qnaItem.id, data: qnaItem.data }

    return {
      ...state,
      items: newItems,
      expandedItems: { ...state.expandedItems, [qnaItem.id]: true }
    }
  } else if (action.type === 'addQnA') {
    const newItems = state.items
    const id = _uniqueId('qna-')
    const { languages } = action.data
    const { expandedItems } = state
    const languageArrays = languages.reduce((acc, lang) => ({ ...acc, [lang]: [''] }), {})

    newItems.unshift({
      id,
      isNew: true,
      data: {
        action: 'text',
        contexts: ['global'],
        enabled: true,
        answers: _.cloneDeep(languageArrays),
        questions: _.cloneDeep(languageArrays),
        redirectFlow: '',
        redirectNode: ''
      }
    })

    return {
      ...state,
      items: newItems,
      expandedItems: { ...expandedItems, [id]: true }
    }
  } else if (action.type === 'deleteQnA') {
    const { index, bp } = action.data
    const newItems = state.items

    const [deletedItem] = newItems.splice(index, 1)

    bp.axios
      .post(`/mod/qna/questions/${deletedItem.id}/delete`)
      .then(() => {})
      .catch(() => {})

    return {
      ...state,
      items: newItems
    }
  } else if (action.type === 'toggleExpandOne') {
    const { expandedItems } = state

    return {
      ...state,
      expandedItems: { ...expandedItems, ...action.data }
    }
  } else if (action.type === 'expandAll') {
    const { items } = state

    return {
      ...state,
      expandedItems: items.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
    }
  } else if (action.type === 'collapseAll') {
    return {
      ...state,
      expandedItems: {}
    }
  } else if (action.type === 'disableQnA') {
    const { index } = action.data
    const newItems = state.items

    newItems[index].enabled = false

    return {
      ...state,
      items: newItems
    }
  } else if (action.type === 'fetchMore') {
    return {
      ...state,
      fetchMore: true
    }
  } else if (action.type === 'toggleEnabledQnA') {
    const { index } = action.data
    const newItems = state.items

    newItems[index].data.enabled = !newItems[index].data.enabled

    return {
      ...state,
      items: newItems
    }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}
