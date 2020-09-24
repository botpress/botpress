import { snakeToCamel } from 'common/action'
import _ from 'lodash'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import babylon from 'prettier/parser-babylon'
import prettier from 'prettier/standalone'
import React from 'react'

import { RootStore } from '../store'
import { END_COMMENT, START_COMMENT, wrapper } from '../utils/wrapper'

import style from './style.scss'

interface Parameters {
  name: string
  type: string
}

interface Props {
  onChange: (code: string) => void
  args?: Parameters[]
  customKey: string
  code: string
  maximized: boolean
  displayed: boolean
  hints: Hint[]
  bp: any
}

interface Hint {
  scope: 'inputs'
  name: string
  source: string
  category: 'VARIABLES'
  partial: boolean
  description?: string
  location?: string
  parentObject?: string
}

const argsToConst = (params?: Parameters[]) => {
  return (params ?? [])
    .filter(Boolean)
    .map(x => snakeToCamel(x.name))
    .join(', ')
}

const argsToInterface = (params?: Parameters[]) => {
  return (params ?? []).filter(Boolean).map(x => ({ name: snakeToCamel(x.name), type: x.type }))
}

function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length
  while (l--) {
    if (predicate(array[l], l, array)) {
      return l
    }
  }
  return -1
}

export default class MinimalEditor extends React.Component<Props> {
  private store: RootStore
  private editor: monaco.editor.IStandaloneCodeEditor
  private editorContainer: HTMLDivElement

  constructor(props) {
    super(props)
    this.store = new RootStore({ bp: this.props.bp })
  }

  state = {
    code: ''
  }

  componentDidMount() {
    this.setupEditor()

    // tslint:disable-next-line: no-floating-promises
    this.loadTypings()

    this.reloadCode(this.props.code)
    this.refreshLayout()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.maximized !== this.props.maximized || prevProps.displayed !== this.props.displayed) {
      this.refreshLayout()
    }

    if (prevProps.customKey !== this.props.customKey) {
      this.setState({ code: this.props.code })

      this.loadCodeTypings()
      this.reloadCode(this.props.code)
    }

    // Handles update when adding a new variable on the active workflow
    if (prevProps.args !== this.props.args) {
      this.loadCodeTypings()

      if (prevProps.code === this.props.code && this.state.code) {
        this.reloadCode(this.state.code)
      }
    }

    if (prevProps.hints !== this.props.hints) {
      this.loadCodeTypings()
    }
  }

  refreshLayout() {
    // Delay necessary because of sidePanel animation
    setTimeout(() => {
      this.editor.layout()
    }, 300)
  }

  componentWillUnmount() {
    const uri = monaco.Uri.parse(`bp://files/index.ts`)
    const oldModel = monaco.editor.getModel(uri)
    if (oldModel) {
      oldModel.dispose()
    }
    this.editor?.dispose()
  }

  reloadCode(unwrapped: string) {
    this.setState({ code: unwrapped })
    const uri = monaco.Uri.parse(`bp://files/index.ts`)

    const oldModel = monaco.editor.getModel(uri)
    if (oldModel) {
      oldModel.setValue(this.wrapCode(unwrapped))
    } else {
      const model = monaco.editor.createModel(this.wrapCode(unwrapped), 'typescript', uri)
      this.editor.setModel(model)
      this.editor.focus()
    }
    this.editor.setPosition({ lineNumber: 4, column: 1 })
  }

  wrapCode(code) {
    const args = argsToConst(this.props.args)
    const argStr = args.length ? `const { ${args} } = args` : ''

    return wrapper.add('execute', code, argStr)
  }

  handleContentChanged = () => {
    if (!this.props.displayed || !this.props.customKey) {
      return
    }

    const unwrapped = wrapper.remove(this.editor.getValue(), 'execute')

    this.props.onChange(unwrapped)
    this.setState({ code: unwrapped })
  }

  getEditableZone = () => {
    const lines = this.editor.getValue().split('\n')
    const startLine = lines.findIndex(x => x.includes(START_COMMENT)) + 2
    const endLine = findLastIndex(lines, x => x.includes(END_COMMENT))

    return { startLine, endLine }
  }

  setupEditor() {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowJs: true,
      typeRoots: ['types']
    })

    monaco.languages.registerDocumentFormattingEditProvider('typescript', {
      async provideDocumentFormattingEdits(model, options, token) {
        const text = prettier.format(model.getValue(), {
          parser: 'babel',
          plugins: [babylon],
          singleQuote: true,
          printWidth: 120,
          trailingComma: 'none',
          semi: false,
          bracketSpacing: true,
          requirePragma: false
        })

        return [
          {
            range: model.getFullModelRange(),
            text
          }
        ]
      }
    })

    this.editor = monaco.editor.create(this.editorContainer, {
      theme: 'vs-light',
      automaticLayout: true,
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      }
    })

    const preventBackspace = this.editor.createContextKey('preventBackspace', false)
    const preventDelete = this.editor.createContextKey('preventDelete', false)

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, async () => {
      await this.editor.getAction('editor.action.formatDocument').run()
    })

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_P, () =>
      this.editor.trigger('', 'editor.action.quickCommand', '')
    )

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_A, () => {
      const { startLine, endLine } = this.getEditableZone()
      this.editor.setSelection({ startLineNumber: startLine, startColumn: 0, endLineNumber: endLine, endColumn: 1000 })
    })

    this.editor.addCommand(monaco.KeyCode.Delete, () => {}, 'preventDelete')
    this.editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Delete, () => {}, 'preventDelete')
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Delete, () => {}, 'preventDelete')

    this.editor.addCommand(monaco.KeyCode.Backspace, () => {}, 'preventBackspace')
    this.editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Backspace, () => {}, 'preventBackspace')
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backspace, () => {}, 'preventBackspace')

    this.editor.onDidPaste(({ range }) => {
      const content = this.editor.getModel().getValueInRange(range)
      const unwrapped = wrapper.remove(content, 'execute')

      this.editor.executeEdits('paste', [{ range, text: unwrapped }])
    })

    const checkReadonlyZone = () => {
      const { startLineNumber: lineNumber, startColumn: column } = this.editor.getSelection()
      const { startLine, endLine } = this.getEditableZone()

      const lineLastColumn = this.editor.getModel().getLineMaxColumn(lineNumber)

      preventBackspace.set(lineNumber === startLine && column === 1)
      preventDelete.set(lineNumber === endLine && column === lineLastColumn)
    }

    this.editor.onDidChangeModelContent(() => {
      checkReadonlyZone()
      this.handleContentChanged()
    })

    // Prevents the user from editing the template lines
    this.editor.onDidChangeCursorPosition(e => {
      const { lineNumber } = e.position
      const { startLine, endLine } = this.getEditableZone()

      checkReadonlyZone()

      if (startLine === 1 || endLine === -1) {
        return
      }

      if (lineNumber < startLine) {
        this.editor.setPosition({ lineNumber: startLine, column: 1 })
      } else if (lineNumber > endLine) {
        this.editor.setPosition({ lineNumber: endLine, column: 1 })
      }
    })
  }

  loadTypings = async () => {
    const typings = await this.store.fetchTypings()

    this.setSchemas(typings)

    _.forEach(typings, (content, name) => {
      if (!name.includes('.schema.')) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, 'bp://types/' + name)
      }
    })

    await this.loadVariableDefinitions()
    await this.loadCodeTypings()
  }

  loadVariableDefinitions = async () => {
    const { data } = await this.props.bp.axios.get(`/modules/variables/definitions`, { baseURL: window.API_PATH })

    monaco.languages.typescript.typescriptDefaults.addExtraLib(data, 'bp://types/custom_variables.d.ts')
  }

  getHints = (scope: string) => {
    if (!this.props.hints) {
      return []
    }

    const printVarInfo = ({ source, location, name }: Hint) =>
      `/** ${source}. ${location} */\n${name.replace(`${scope}.`, '')}: string\n`

    return this.props.hints.filter(x => x.name.startsWith(scope)).map(printVarInfo)
  }

  loadCodeTypings = () => {
    const content = `
  declare const args: Args;
  declare const user: {
    ${this.getHints('user')}
    [property: string]: any
  };

  declare const temp: {
    ${this.getHints('temp')}
    [property: string]: any
  };

  declare const session: {
    ${this.getHints('session')}
  } & sdk.IO.CurrentSession;

  declare const workflow: sdk.IO.WorkflowHistory & {
    variables: Args
  };

  declare const bp: typeof sdk;

  interface Args {
${argsToInterface(this.props.args)
  .map(x => {
    return `    ${x.name}: ${x.type};`
  })
  .join('\n')}
  }`

    monaco.languages.typescript.typescriptDefaults.addExtraLib(content, 'bp://types/args.d.ts')
  }

  setSchemas = (typings: any) => {
    const schemas = _.reduce(
      _.pickBy(typings, (content, name) => name.includes('.schema.')),
      (result, content, name) => {
        result.push({
          uri: 'bp://types/' + name,
          schema: JSON.parse(content)
        })
        return result
      },
      []
    )

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas,
      validate: true
    })
  }

  render() {
    return <div id="monaco-editor" ref={ref => (this.editorContainer = ref)} className={style.editor} />
  }
}
