import React from 'react'
import { useState, useMemo, CSSProperties, FC, HTMLAttributes } from 'react'
import { ZuiFormProps, schemaToUISchema } from '.'
import { GlobalComponentDefinitions, UIComponentDefinitions } from './types'
import { JsonForms } from '@jsonforms/react'

const codeDivStyle: CSSProperties = {
  background: '#222',
  color: '#fff',
  fontSize: '12px',
  maxHeight: '50vh',
  padding: '0.2em',
  height: '100%',
  overflow: 'scroll',
  borderRight: '1px solid #eee',
  fontFamily: 'monospace',
}

const syntaxHighlightCSS = `
.string {
    color: green;
}
.number {
    color: darkorange;
}
.boolean {
    color: blue;
}
.null {
    color: magenta;
}
.key {
    color: orange;
}
`

export function syntaxHighlight(json: string | undefined) {
  if (!json) return '' //no JSON from response

  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match: string) {
      var cls = 'number'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key'
        } else {
          cls = 'string'
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean'
      } else if (/null/.test(match)) {
        cls = 'null'
      }
      return '<span class="' + cls + '">' + match + '</span>'
    },
  )
}

const SyntaxHighlighter: FC<{ code?: string } & HTMLAttributes<HTMLPreElement>> = ({ code, ...rest }) => {
  return <pre {...rest} dangerouslySetInnerHTML={{ __html: syntaxHighlight(code) }} />
}

const fullscreenStyle: CSSProperties = {
  position: 'fixed',
  boxSizing: 'border-box',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  zIndex: 9999,
  background: 'rgba(255, 255, 255, 0.9)',
  overflow: 'scroll',
  padding: '14px',
}

export const ZuiFormDEBUG = <UI extends UIComponentDefinitions = GlobalComponentDefinitions>({
  schema,
  overrides,
  fullscreen,
  ...jsonformprops
}: ZuiFormProps<UI> & { fullscreen: boolean }) => {
  const [data, setData] = useState({})
  const [errors, setErrors] = useState<string | Record<string, any> | null>(null)
  const uiSchema = useMemo(() => {
    return schemaToUISchema<UI>(schema, overrides)
  }, [schema, overrides])

  if (!uiSchema) {
    return null
  }

  return (
    <div style={fullscreen ? fullscreenStyle : {}}>
      <style>{syntaxHighlightCSS}</style>
      <div style={{ width: '100' }}>
        <JsonForms
          {...jsonformprops}
          data={data}
          onChange={({ errors, data }) => {
            setData(data)
            setErrors(errors || null)
          }}
          schema={schema}
          uischema={uiSchema}
        />
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: '1' }}>
          <h2>Form data</h2>
          <SyntaxHighlighter code={JSON.stringify(data, null, 2)} style={codeDivStyle} />
        </div>
        <div style={{ flex: '1' }}>
          <h2>UISchema</h2>
          <SyntaxHighlighter code={JSON.stringify(uiSchema, null, 2)} style={codeDivStyle} />
        </div>
        <div style={{ flex: '1' }}>
          <h2>Schema</h2>
          <SyntaxHighlighter code={JSON.stringify(schema, null, 2)} style={codeDivStyle} />
        </div>
      </div>
      <div>
        <h2>Errors</h2>
        <div>
          {Array.isArray(errors) ? (
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          ) : (
            <p>{typeof errors == 'string' ? errors : 'No errors'}</p>
          )}
        </div>
        <SyntaxHighlighter code={JSON.stringify(errors, null, 2)} style={codeDivStyle} />
      </div>
    </div>
  )
}
