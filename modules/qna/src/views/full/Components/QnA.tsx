import { Button, Icon, Position, Tooltip } from '@blueprintjs/core'
import { Flow, FlowNode } from 'botpress/sdk'
import { confirmDialog, lang, MoreOptions, MoreOptionsItems, toast, utils } from 'botpress/shared'
import { getFlowLabel } from 'botpress/utils'
import cx from 'classnames'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import Select from 'react-select'

import { QnaItem } from '../../../backend/qna'
import style from '../style.scss'
import { NEW_QNA_PREFIX } from '../utils/qnaList.utils'

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
  convertToIntent: () => void
  toggleEnabledQnA: () => void
}

const QnA: FC<Props> = props => {
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

  const onConvertToIntent = async () => {
    if (
      await confirmDialog(lang.tr('module.qna.form.confirmConvertToIntent'), {
        acceptLabel: lang.tr('convert')
      })
    ) {
      props.convertToIntent()
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

  moreOptionsItems.push({
    label: lang.tr('module.qna.form.convertToIntent'),
    type: 'convert',
    action: onConvertToIntent
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

  const showIncomplete =
    questions?.filter(q => !!q.trim()).length < 3 ||
    (answers?.filter(q => !!q.trim()).length < 1 && !data.redirectFlow && !data.redirectNode)
  const currentFlow = flows ? flows.find(({ name }) => name === data.redirectFlow) || { nodes: [] } : { nodes: [] }
  const nodeList = (currentFlow.nodes as FlowNode[])?.map(({ name }) => ({ label: name, value: name }))
  const flowsList = flows.map(({ name }) => ({ label: getFlowLabel(name), value: name }))
  const isNewQna = id.startsWith(NEW_QNA_PREFIX)

  return (
    <div className={style.questionWrapper}>
      <div className={style.headerWrapper}>
        <Button
          minimal
          small
          onClick={() => {
            utils.inspect(props.qnaItem)
            setExpanded(!expanded)
          }}
          className={style.questionHeader}
        >
          <div className={style.left}>
            <Icon icon={!expanded ? 'chevron-right' : 'chevron-down'} />{' '}
            {!isNewQna && (
              <Tooltip
                className={cx(style.tag, style.qnaId)}
                position={Position.BOTTOM}
                content={lang.tr('module.qna.form.copyIdToClipboard')}
              >
                <CopyToClipboard text={id} onCopy={() => toast.info(lang.tr('module.qna.form.idCopiedToClipboard'))}>
                  <span onClick={e => e.stopPropagation()}>ID</span>
                </CopyToClipboard>
              </Tooltip>
            )}
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
            <span className={style.tag}>
              {`${questions?.filter(q => q.trim()).length || 0} ${lang.tr('module.qna.form.q')}
               · ${answers?.filter(a => a.trim()).length || 0}  ${lang.tr('module.qna.form.a')}`}
            </span>
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
            canAddContent
            addItemLabel={lang.tr('module.qna.form.addAnswerAlternative')}
          />
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
    </div>
  )
}

export default QnA
