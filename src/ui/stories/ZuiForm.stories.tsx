import React, { FC, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FormError, UIComponentDefinitions, ZuiComponentMap } from '../types'
import { z } from '../../z/index'
import { ZuiForm } from '..'
import { BoundaryFallbackComponent } from '../ErrorBoundary'

const exampleExtensions = {
  string: {
    debug: {
      id: 'debug',
      params: z.object({}),
    },
  },
  number: {
    debug: {
      id: 'debug',
      params: z.object({}),
    },
  },
  boolean: {
    debug: {
      id: 'debug',
      params: z.object({}),
    },
  },
  array: {
    debug: {
      id: 'debug',
      params: z.object({}),
    },
  },
  object: {
    debug: {
      id: 'debug',
      params: z.object({}),
    },
  },
  discriminatedUnion: {},
} as const satisfies UIComponentDefinitions

const exampleSchema = z
  .object({
    root: z
      .string()
      .title('Root')
      .placeholder('Root')
      .disabled((s) => s?.includes('9') || false),
    firstName: z.string().title('first name').placeholder('Enter your name').nullable(),
    lastName: z.string().min(3).title('Last Name <3').optional().nullable(),
    dates: z
      .array(
        z.object({
          date: z.string(),
          time: z.string(),
          ids: z.array(z.number()).min(2),
        }),
      )
      .min(1)
      .nonempty(),
    // tests the hidden function
    aRandomField: z.string().optional().hidden(),
    aDiscriminatedUnion: z.discriminatedUnion('type', [
      z.object({ type: z.literal('text'), text: z.string().placeholder('Some text') }),
      z.object({ type: z.literal('number'), b: z.number().placeholder('42').default(5) }),
      z.object({
        type: z.literal('complex'),
        address: z
          .object({
            street: z.string().placeholder('1234 Main St'),
            city: z.string().placeholder('San Francisco'),
            state: z.string().placeholder('CA'),
            zip: z.string().placeholder('94111'),
          })
          .disabled((obj) => !obj?.street && { city: false }),
        root: z.string().placeholder('root'),
        babies: z.array(z.object({ name: z.string(), age: z.number() })),
      }),
    ]),
    stuff: z.object({
      birthday: z.string(),
      plan: z.enum(['basic', 'premium']),
      age: z.number(),
      email: z.string().email().title('Email Address'),
      password: z.string(),
      passwordConfirm: z.string(),
    }),
    debug: z.number().optional().displayAs<typeof exampleExtensions>({ id: 'debug', params: {} }),
  })
  .title('User Information')
  .disabled((s) => {
    return { firstName: s?.root?.includes('6') || false }
  })
  .hidden((v) => ({
    aDiscriminatedUnion: v?.root === 'hidden',
  }))

const ErrorBox: FC<{ errors: FormError[]; data: any | null }> = ({ errors, data }) =>
  errors &&
  data !== null && (
    <span style={{ color: 'red' }}>
      {errors.map((e) => (
        <p key={e.path.join('')}>{e.message}</p>
      ))}
    </span>
  )

const componentMap: ZuiComponentMap<typeof exampleExtensions> = {
  string: {
    debug: ({ context, schema }) => {
      return (
        <div>
          {schema.enum?.length && <p>String enum values: {schema.enum.join(', ')}</p>}
          <pre>{JSON.stringify(context.formData, null, 2)}</pre>
          {context.formValid === null && <p>Form validation disabled</p>}
          {context.formValid === true && <p>Form is valid</p>}
          {context.formValid === false && (
            <div>
              <p>Form is invalid with {context.formErrors?.length} errors:</p>
              <ul>
                {context.formErrors?.map((e) => (
                  <li key={e.path.join('.')}>
                    {e.path.join('.')} - {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    },
    default: ({ onChange, errors, required, disabled, label, data, zuiProps, schema }) => {
      if (schema.enum?.length) {
        return (
          <div style={{ padding: '1rem' }}>
            <span>{label}</span>
            <select disabled={disabled} onChange={(e) => onChange(e.target.value)} value={data || ''}>
              {schema.enum.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            {required && <span>*</span>}
            <ErrorBox errors={errors} data={data} />
          </div>
        )
      }
      return (
        <div style={{ padding: '1rem' }}>
          <span>{label}</span>
          <input
            disabled={disabled}
            placeholder={zuiProps?.placeholder}
            onChange={(e) => onChange(e.target.value)}
            value={data || ''}
          />
          {required && <span>*</span>}
          <ErrorBox errors={errors} data={data} />
        </div>
      )
    },
  },
  number: {
    debug: () => null,
    default: ({ data, zuiProps, onChange, label, required, errors, schema }) => {
      if (schema.enum?.length) {
        return (
          <div style={{ padding: '1rem' }}>
            <span>{label}</span>
            <select onChange={(e) => onChange(e.target.value)} value={data || 0}>
              {schema.enum.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            {required && <span>*</span>}
            <ErrorBox errors={errors} data={data} />
          </div>
        )
      }
      return (
        <div style={{ padding: '1rem' }}>
          <span>{label}</span>
          <input
            type="number"
            placeholder={zuiProps?.placeholder}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            value={data || 0}
            defaultValue={schema.default || 0}
          />
          {required && <span>*</span>}
          <ErrorBox errors={errors} data={data} />
        </div>
      )
    },
  },
  boolean: {
    debug: () => null,
    default: ({ data, disabled: enabled, label, errors, onChange }) => {
      return (
        <div style={{ padding: '1rem' }}>
          <label>
            <input
              type="checkbox"
              disabled={!enabled}
              checked={data || false}
              onChange={(e) => onChange(e.target.checked)}
            />
            {label}
          </label>
          <ErrorBox errors={errors} data={data} />
        </div>
      )
    },
  },
  array: {
    debug: () => null,
    default: ({ children, scope, context, addItem, errors }) => (
      <>
        <button onClick={() => addItem()}>Add item {context.path}</button>
        <p>{scope}</p>
        {children}
        <ErrorBox errors={errors} data={null} />
      </>
    ),
  },
  object: {
    debug: () => null,
    default: ({ children, errors, data, ...rest }) => {
      return (
        <section>
          <div style={{ border: '1px solid red' }}>{children}</div>
          {rest.isArrayChild === true && <button onClick={() => rest.removeSelf()}>delete</button>}
          {!!errors?.length && <ErrorBox errors={errors} data={data} />}
        </section>
      )
    },
  },
  discriminatedUnion: {
    default: ({ children, discriminatorKey, discriminatorOptions, discriminatorValue, setDiscriminator }) => {
      return (
        <div>
          <span>{discriminatorKey}</span>
          <select value={discriminatorValue || undefined} onChange={(e) => setDiscriminator(e.target.value)}>
            {discriminatorOptions?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {children}
        </div>
      )
    },
  },
}
const Fallback: BoundaryFallbackComponent = ({ error, schema }) => {
  return (
    <div style={{ background: '#F44', color: '#FFF' }}>
      <h1>Something went wrong rendering {schema?.type}</h1>
      <p>{error.message}</p>
    </div>
  )
}
const ZuiFormExample = () => {
  const [formData, setFormData] = useState({})

  return (
    <>
      <ZuiForm<typeof exampleExtensions>
        schema={exampleSchema.toJsonSchema({ target: 'openApi3' })}
        value={formData}
        onChange={setFormData}
        components={componentMap}
        fallback={Fallback}
        disableValidation={false}
      />
    </>
  )
}

const meta = {
  title: 'Form/Example',
  component: ZuiFormExample,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ZuiFormExample>

type Story = StoryObj<typeof meta>

export const ExampleSchema: Story = {
  args: {},
}

export default meta
