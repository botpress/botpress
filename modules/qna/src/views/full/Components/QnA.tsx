import { Button, Icon, Position, Tooltip } from '@blueprintjs/core'
import { Flow, FlowNode } from 'botpress/sdk'
import { confirmDialog, Contents, FormFields, lang, MoreOptions, MoreOptionsItems } from 'botpress/shared'
import { getFlowLabel } from 'botpress/utils'
import cx from 'classnames'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, useRef, useState } from 'react'
import Select from 'react-select'

import { QnaItem } from '../../../backend/qna'
import { isQnaComplete } from '../../../backend/utils'
import style from '../style.scss'

import ContentAnswerForm from './ContentAnswerForm'
import ContextSelector from './ContextSelector'
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
  defaultLanguage: string
  errorMessages?: string[]
  flows?: Flow[]
  childRef?: (ref: HTMLDivElement | null) => void
  updateQnA: (qnaItem: QnaItem) => void
  deleteQnA: () => void
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
    defaultLanguage,
    flows,
    isLite,
    bp
  } = props
  const [showRedirectToFlow, setShowRedirectToFlow] = useState(!!(data.redirectFlow || data.redirectNode))
  let questions = data.questions[contentLang]
  let answers = data.answers[contentLang]
  const contentAnswers = data.contentAnswers || []
  const refQuestions = contentLang !== defaultLanguage && data.questions[defaultLanguage]
  const refAnswers = contentLang !== defaultLanguage && data.answers[defaultLanguage]

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
      props.deleteQnA()
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

  const showIncomplete = !isQnaComplete(props.qnaItem.data, contentLang)
  const currentFlow = flows ? flows.find(({ name }) => name === data.redirectFlow) || { nodes: [] } : { nodes: [] }
  const nodeList = (currentFlow.nodes as FlowNode[])?.map(({ name }) => ({ label: name, value: name }))
  const flowsList = flows.map(({ name }) => ({ label: getFlowLabel(name), value: name }))

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
            {showIncomplete && (
              <Tooltip position={Position.BOTTOM} content={lang.tr('module.qna.form.incompleteTooltip')}>
                <span className={cx(style.tag)}>{lang.tr('module.qna.form.incomplete')}</span>
              </Tooltip>
            )}
            {!expanded && (
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
          {!isLite && (
            <ContextSelector
              className={cx(style.contextSelector)}
              contexts={data.contexts}
              customIdSuffix={id}
              saveContexts={contexts =>
                updateQnA({
                  id,
                  data: { ...data, contexts }
                })
              }
              bp={bp}
            />
          )}
          <TextAreaList
            key="questions"
            items={questions || ['']}
            updateItems={items =>
              updateQnA({
                id,
                data: { ...data, questions: { ...data.questions, [contentLang]: items }, answers: data.answers }
              })
            }
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
            />
            <div className={style.contentAnswerWrapper}>
              {contentAnswers?.map((content, index) => (
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
              ))}
            </div>
            <FormFields.AddButton
              text={lang.tr('module.qna.form.addContent')}
              onClick={() => {
                setShowContentForm(true)
                editingContent.current = null
              }}
            />
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
          deleteContent={() => deleteContentAnswer()}
          editingContent={editingContent.current}
          formData={contentAnswers[editingContent.current]}
          onUpdate={data => updateContentAnswers(data)}
          currentLang={contentLang}
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
