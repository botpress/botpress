import { Button, Icon, Position, Tooltip } from '@blueprintjs/core'
import { BotEvent, Content, Flow, FlowNode } from 'botpress/sdk'
import { confirmDialog, Contents, FormFields, lang, MoreOptions, MoreOptionsItems } from 'botpress/shared'
import { getFlowLabel } from 'botpress/utils'
import cx from 'classnames'
import { QnaItem } from 'full/utils/qnaList.utils'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, useRef, useState } from 'react'
import Select from 'react-select'

import { isQnaComplete } from '../../../backend/utils'
import style from '../style.scss'

import ContentAnswerForm from './ContentAnswerForm'
// import ContextSelector from './ContextSelector'
import TextAreaList from './TextAreaList'

interface RedirectItem {
  label: string
  value: string
}

interface Props {
  isLite: boolean
  expanded: boolean
  setExpanded: (expanded: boolean) => void
  qnaItem: QnaItem
  bp: any
  contentLang: string
  defaultLang: string
  errorMessages?: string[]
  flows?: Flow[]
  childRef?: (ref: HTMLDivElement | null) => void
  updateQnA: (qnaItem: QnaItem) => void
  deleteQnA: (qnaItem: QnaItem) => void
  events: BotEvent[]
  toggleEnabledQnA: () => void
}

const QnA: FC<Props> = props => {
  const [forceUpdate, setForceUpdate] = useState(false)
  const [showContentForm, setShowContentForm] = useState(false)
  const editingContent = useRef(null)
  const [showOption, setShowOption] = useState(false)
  const {
    contentLang,
    qnaItem: { id, saveError, data },
    updateQnA,
    expanded,
    setExpanded,
    errorMessages,
    defaultLang,
    flows,
    isLite,
    events,
    bp
  } = props
  const [showRedirectToFlow, setShowRedirectToFlow] = useState(!!(data.redirectFlow || data.redirectNode))
  let questions = data.questions[contentLang]
  let answers = data.answers[contentLang]
  const contentAnswers = data.contentAnswers || []
  const refQuestions = contentLang !== defaultLang && data.questions[defaultLang]
  const refAnswers = contentLang !== defaultLang && data.answers[defaultLang]

  if (refQuestions?.length > questions?.length || (!questions?.length && refQuestions?.length)) {
    questions = [...(questions || []), ...Array(refQuestions.length - (questions?.length || 0)).fill('')]
  }

  if (refAnswers?.length > answers?.length || (!answers?.length && refAnswers?.length)) {
    answers = [...(answers || []), ...Array(refAnswers.length - (answers?.length || 0)).fill('')]
  }

  const onDelete = async () => {
    if (
      await confirmDialog(lang.tr('module.qna.form.confirmDeleteQuestion'), {
        acceptLabel: lang.tr('delete')
      })
    ) {
      props.deleteQnA({ id, saveError, data })
    }
  }

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr(data.enabled ? 'module.qna.form.disableQuestion' : 'module.qna.form.enableQuestion'),
      action: props.toggleEnabledQnA
    }
  ]

  if (expanded && !isLite) {
    moreOptionsItems.push({
      label: lang.tr(!showRedirectToFlow ? 'module.qna.form.enableRedirection' : 'module.qna.form.disableRedirection'),
      action: () => {
        if (showRedirectToFlow) {
          updateQnA({
            id,
            data: { ...data, redirectNode: '', redirectFlow: '' }
          })
        }
        setShowRedirectToFlow(!showRedirectToFlow)
      }
    })
  }

  moreOptionsItems.push({
    label: lang.tr('module.qna.form.deleteQuestion'),
    type: 'delete',
    action: onDelete
  })

  const getPlaceholder = (type: 'answer' | 'question', index: number): string => {
    if (type === 'question') {
      if (index === 0) {
        return lang.tr('module.qna.form.writeFirstQuestion')
      } else if (index === 1 || index === 2) {
        return lang.tr('module.qna.form.writeAtLeastTwoMoreQuestions')
      } else if (index >= 3 && index < 9) {
        return lang.tr('module.qna.form.addMoreQuestionsPlural', { count: 10 - index })
      } else if (index === 9) {
        return lang.tr('module.qna.form.addMoreQuestionsSingular')
      }
    } else {
      if (index === 0) {
        return lang.tr('module.qna.form.writeTheAnswer')
      } else {
        return lang.tr('module.qna.form.chatbotWillRandomlyChoose')
      }
    }
  }

  const validateItemsList = (items, errorMsg) =>
    items.map((item, index) =>
      items
        .slice(0, index)
        .filter(item2 => item2.length)
        .includes(item)
        ? errorMsg
        : ''
    )

  const updateContentAnswers = newData => {
    const newContentAnswers = [...contentAnswers]

    if (editingContent.current === null) {
      newContentAnswers.push({ ...newData })
      editingContent.current = newContentAnswers.length - 1
    } else {
      newContentAnswers[editingContent.current] = newData
    }

    updateQnA({
      id,
      data: { ...data, contentAnswers: newContentAnswers }
    })
  }

  const addContentAnswer = () => {
    contentAnswers.push({} as Content.All)
    setShowContentForm(true)
    editingContent.current = contentAnswers.length - 1

    updateQnA({
      id,
      data: { ...data, contentAnswers: [...contentAnswers] }
    })
  }

  const deleteContentAnswer = () => {
    setShowContentForm(false)

    if (editingContent.current === null) {
      return
    }

    const newContentAnswers = [...contentAnswers.filter((content, index) => editingContent.current !== index)]

    updateQnA({
      id,
      data: { ...data, contentAnswers: newContentAnswers }
    })
  }

  const showIncomplete = !isQnaComplete(props.qnaItem.data as any, contentLang)
  const currentFlow = flows ? flows.find(({ name }) => name === data.redirectFlow) || { nodes: [] } : { nodes: [] }
  const nodeList = (currentFlow.nodes as FlowNode[])?.map(({ name }) => ({ label: name, value: name }))
  const flowsList = flows.map(({ name }) => ({ label: getFlowLabel(name), value: name }))

  const fieldHasMissingTranslation = (value = {}) => {
    if (value[contentLang]) {
      return false
    }

    return Object.keys(value)
      .filter(key => key !== contentLang)
      .some(key => (value[key] || []).length)
  }

  const checkCardMissingTranslation = card => {
    return (
      fieldHasMissingTranslation(card.title) ||
      fieldHasMissingTranslation(card.subtitle) ||
      card.actions.some(action => fieldHasMissingTranslation(action.title) || fieldHasMissingTranslation(action.text))
    )
  }

  const checkMissingTranslations = content => {
    switch (content.contentType) {
      case 'builtin_image':
        return fieldHasMissingTranslation(content.title)
      case 'builtin_card':
        return checkCardMissingTranslation(content)
      case 'builtin_carousel':
        return content.items.some(item => checkCardMissingTranslation(item))
      case 'builtin_single-choice':
        return content.choices?.some(
          choice => fieldHasMissingTranslation(choice.title) || fieldHasMissingTranslation(choice.value)
        )
      default:
        const translatedVariations = Object.keys(content.variations || {}).reduce((acc, key) => {
          return { ...acc, [key]: content.variations[key].filter(Boolean).length }
        }, {})
        const curLangLength = translatedVariations[contentLang] || 0

        return (
          fieldHasMissingTranslation(content.text) ||
          Object.keys(translatedVariations)
            .filter(l => l !== contentLang)
            .some(l => translatedVariations[l] > curLangLength)
        )
    }
  }

  const missingTranslation =
    ((refQuestions || []).filter(Boolean).length && !questions?.filter(Boolean).length) ||
    ((refAnswers || []).filter(Boolean).length && !answers?.filter(Boolean).length) ||
    contentAnswers?.some(content => checkMissingTranslations(content))

  return (
    <div className={style.questionWrapper}>
      <div className={style.headerWrapper}>
        <Button minimal small onClick={() => setExpanded(!expanded)} className={style.questionHeader}>
          <div className={style.left}>
            <Icon icon={!expanded ? 'chevron-right' : 'chevron-down'} />{' '}
            <h1>{questions?.[0] || <span className={style.refTitle}>{refQuestions?.[0]}</span>}</h1>
          </div>
          <div className={style.right}>
            {(!!errorMessages.length || saveError === 'duplicated_question') && (
              <Tooltip
                position={Position.BOTTOM}
                content={
                  <ul className={style.errorsList}>
                    {errorMessages.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {saveError === 'duplicated_question' && <li>{lang.tr('module.qna.form.writingSameQuestion')}</li>}
                  </ul>
                }
              >
                <span className={cx(style.tag, style.warning)}>{lang.tr('module.qna.form.cantBeSaved')}</span>
              </Tooltip>
            )}
            {!data.enabled && (
              <Tooltip position={Position.BOTTOM} content={lang.tr('module.qna.form.disabledTooltip')}>
                <span className={style.tag}>{lang.tr('disabled')}</span>
              </Tooltip>
            )}
            {!!missingTranslation && (
              <span className={cx(style.tag, style.warning)}>{lang.tr('needsTranslation')}</span>
            )}
            {showIncomplete && (
              <Tooltip position={Position.BOTTOM} content={lang.tr('module.qna.form.incompleteTooltip')}>
                <span className={cx(style.tag)}>{lang.tr('incomplete')}</span>
              </Tooltip>
            )}
            {!showIncomplete && (
              <span className={style.tag}>{`${questions?.filter(q => q.trim()).length || 0} ${lang.tr(
                'module.qna.form.q'
              )} · ${answers?.filter(a => a.trim()).length || 0}  ${lang.tr('module.qna.form.a')}`}</span>
            )}
          </div>
        </Button>
        <MoreOptions show={showOption} onToggle={() => setShowOption(!showOption)} items={moreOptionsItems} />
      </div>
      {expanded && (
        <div key={contentLang} className={style.collapsibleWrapper}>
          <TextAreaList
            key="questions"
            items={questions || ['']}
            updateItems={items =>
              updateQnA({
                id,
                data: { ...data, questions: { ...data.questions, [contentLang]: items }, answers: data.answers }
              })
            }
            canAdd={!defaultLang || defaultLang === contentLang}
            refItems={refQuestions}
            keyPrefix="question-"
            duplicateMsg={lang.tr('module.qna.form.duplicateQuestion')}
            itemListValidator={validateItemsList}
            placeholder={index => getPlaceholder('question', index)}
            label={lang.tr('module.qna.question')}
            addItemLabel={lang.tr('module.qna.form.addQuestionAlternative')}
          />
          <div>
            <TextAreaList
              key="answers"
              items={answers || ['']}
              duplicateMsg={lang.tr('module.qna.form.duplicateAnswer')}
              itemListValidator={validateItemsList}
              updateItems={items =>
                updateQnA({
                  id,
                  data: { ...data, questions: data.questions, answers: { ...data.answers, [contentLang]: items } }
                })
              }
              refItems={refAnswers}
              keyPrefix="answer-"
              placeholder={index => getPlaceholder('answer', index)}
              label={lang.tr('module.qna.answer')}
              addItemLabel={lang.tr('module.qna.form.addAnswerAlternative')}
              canAdd={!defaultLang || defaultLang === contentLang}
            />
            <div className={style.contentAnswerWrapper}>
              {contentAnswers?.map((content, index) =>
                checkMissingTranslations(content) ? (
                  <button
                    onClick={() => {
                      editingContent.current = index
                      setShowContentForm(true)
                    }}
                    className={style.needsTranslation}
                  >
                    {lang.tr('needsTranslation')}
                  </button>
                ) : (
                  <Contents.Item
                    key={index}
                    contentLang={contentLang}
                    content={content}
                    active={editingContent.current === index}
                    onEdit={() => {
                      editingContent.current = index
                      setShowContentForm(true)
                    }}
                  />
                )
              )}
            </div>
            {(!defaultLang || defaultLang === contentLang) && (
              <FormFields.AddButton
                className={style.noSpacing}
                text={lang.tr('module.qna.form.addContent')}
                onClick={() => {
                  addContentAnswer()
                }}
              />
            )}
          </div>
          {showRedirectToFlow && (
            <Fragment>
              <h1 className={style.redirectTitle}>{lang.tr('module.qna.form.redirectQuestionTo')}</h1>
              <div>
                <h2>{lang.tr('module.qna.form.workflow')}</h2>

                <Select
                  tabIndex="-1"
                  value={flowsList.find(item => item.value === data.redirectFlow)}
                  options={flowsList}
                  placeholder={lang.tr('module.qna.form.pickWorkflow')}
                  onChange={(selected: RedirectItem) =>
                    updateQnA({
                      id,
                      data: { ...data, redirectFlow: selected.value }
                    })
                  }
                />
              </div>
              <div>
                <h2>{lang.tr('module.qna.form.node')}</h2>

                <Select
                  tabIndex="-1"
                  value={nodeList.find(item => item.value === data.redirectNode)}
                  options={nodeList}
                  placeholder={lang.tr('module.qna.form.pickNode')}
                  onChange={(selected: RedirectItem) =>
                    updateQnA({
                      id,
                      data: { ...data, redirectNode: selected.value }
                    })
                  }
                />
              </div>
            </Fragment>
          )}
        </div>
      )}

      {showContentForm && (
        <ContentAnswerForm
          bp={bp}
          isLite={isLite}
          deleteContent={() => deleteContentAnswer()}
          editingContent={editingContent.current}
          formData={contentAnswers[editingContent.current]}
          onUpdate={data => updateContentAnswers(data)}
          events={events}
          currentLang={contentLang}
          defaultLang={defaultLang}
          close={closingKey => {
            setTimeout(() => {
              if (closingKey === editingContent.current) {
                editingContent.current = null
                setShowContentForm(false)
              } else {
                setForceUpdate(!forceUpdate)
              }
            }, 200)
          }}
        />
      )}
    </div>
  )
}

export default QnA
