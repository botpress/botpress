import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { ZuiForm, ZuiFormProps } from './index'
import { resolveDiscriminatedSchema, resolveDiscriminator } from './hooks/useDiscriminator'
import { ZuiComponentMap } from '../index'
import { ObjectSchema, JSONSchema, ZuiReactComponentBaseProps, BaseType, UIComponentDefinitions } from './types'
import { FC, PropsWithChildren, useState } from 'react'
import { vi } from 'vitest'
import { z as zui } from '../z/index'
import { zuiKey } from './constants'
import { getSchemaType } from './utils'

const TestId = (type: BaseType, path: string[], subpath?: string) =>
  `${type}:${path.length > 0 ? path.join('.') : ''}${subpath ? `:${subpath}` : ''}`

describe('UI', () => {
  it('renders a simple form from a json schema', () => {
    const jsonSchema: ObjectSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
      required: ['firstName', 'lastName'],
      additionalProperties: false,
    }
    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => {}}
      />,
    )

    for (const key in jsonSchema.properties) {
      const element = rendered.getByTestId(TestId('string', [key]))
      expect(element).toBeTruthy()
    }
  })

  it('renders a simple form from a zui schema', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    traverseSchemaTest(jsonSchema, (path, child) => {
      const element = rendered.getByTestId(TestId(getSchemaType(child), path))
      expect(element).toBeTruthy()
    })
  })

  it('renders a multi-level form from a zui schema', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
      address: zui.object({
        street: zui.string(),
        city: zui.string(),
        state: zui.string(),
        zip: zui.string(),
      }),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    traverseSchemaTest(jsonSchema, (path, child) => {
      const element = rendered.getByTestId(TestId(getSchemaType(child), path))
      expect(element).toBeTruthy()
    })
  })

  it('renders correctly with no default component implementation', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
      age: zui.number(),
      address: zui.object({
        street: zui.string(),
        city: zui.string(),
        state: zui.string(),
        zip: zui.number(),
      }),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const components = {
      ...testComponentImplementation,
      number: {
        ...testComponentImplementation.number,
        default: () => null,
      },
    }

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={components}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    traverseSchemaTest(jsonSchema, (path, child) => {
      if (child.type === 'number') {
        const element = rendered.queryByTestId(TestId(child.type, path))
        expect(element).toBeFalsy()
      }
      if (child.type === 'string') {
        const element = rendered.getByTestId(TestId(child.type, path))
        expect(element).toBeTruthy()
      }
    })
  })

  it('renders correctly with a multi-level form with arrays', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
      age: zui.number(),
      address: zui.object({
        street: zui.string(),
        city: zui.string(),
        state: zui.string(),
        zip: zui.number(),
      }),
      children: zui.array(
        zui.object({
          firstName: zui.string(),
          lastName: zui.string(),
          age: zui.number(),
          favoriteColors: zui.array(zui.string()),
        }),
      ),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{ children: [{ favoriteColors: [''] }] }}
        onChange={() => console.log()}
      />,
    )

    traverseSchemaTest(jsonSchema, (path, child) => {
      const element = rendered.getByTestId(TestId(getSchemaType(child), path))
      expect(element).toBeTruthy()
    })
  })

  it('adds a default string array item correctly', () => {
    const schema = zui.object({
      favoriteColors: zui.array(zui.string()),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')
    fireEvent.click(addBtn)

    const element = rendered.queryByTestId('string:favoriteColors.0:input')

    expect(element).toBeTruthy()

    expect(rendered.queryByTestId('string:favoriteColors.0')?.getAttribute('data-ischild')).toBe('true')
    expect(rendered.queryByTestId('string:favoriteColors.0')?.getAttribute('data-index')).toBe('0')
  })

  it('receives the correct subschemas for each nested object of different types', () => {
    const aDeeplyNestedSchema = zui.object({
      likesPizza: zui.boolean(),
      deeplyNested: zui.object({
        nested: zui.object({
          nestedagain: zui.object({
            firstName: zui.string(),
            lastName: zui.string(),
          }),
          age: zui.number(),
        }),
      }),
      vector: zui.array(zui.number()),
    })

    const jsonSchema = aDeeplyNestedSchema.toJsonSchema() as ObjectSchema

    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)
    const addButton = rendered.getByTestId('array:vector:addbtn')
    fireEvent.click(addButton)

    traverseSchemaTest(jsonSchema, (path, child) => {
      const element = rendered.getByTestId(TestId(getSchemaType(child), path))
      expect(element).toBeTruthy()

      const schemaElement = rendered.getByTestId(TestId(getSchemaType(child), path, 'schema'))

      expect(schemaElement).toBeTruthy()
      expect(JSON.parse(schemaElement.innerHTML)).toEqual(child)
    })
  })

  it('handles adding 50 elements to an array', () => {
    const schema = zui.object({
      favoriteColors: zui.array(zui.string()),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')
    for (let i = 0; i < 50; i++) {
      fireEvent.click(addBtn)
    }

    const elements = rendered.getByTestId('array:favoriteColors:container').children
    expect(elements).toHaveLength(50)
  })

  it('handles removing an element from an array implementation', () => {
    const schema = zui.object({
      favoriteColors: zui.array(zui.string()),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')
    fireEvent.click(addBtn)

    const removeBtn = rendered.getByTestId('array:favoriteColors:removebtn')
    fireEvent.click(removeBtn)

    const element = rendered.queryByTestId('string:favoriteColors.0')
    expect(element).toBeFalsy()
  })

  it('handles removing from a child element within an array', () => {
    const schema = zui.object({
      favoriteColors: zui.array(
        zui.object({
          name: zui.string(),
          rating: zui.number(),
          color: zui.string(),
        }),
      ),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')

    for (let i = 0; i < 20; i++) {
      fireEvent.click(addBtn)
      const input = rendered.getByTestId(`string:favoriteColors.${i}.color:input`)
      fireEvent.change(input, { target: { value: `${i}` } })
    }

    const removeBtn = rendered.getByTestId('object:favoriteColors.5:removeselfbtn')
    fireEvent.click(removeBtn)

    expect(rendered.queryByDisplayValue('5')).toBeFalsy()
  })

  it('renders array elements with the correct index even after update', () => {
    const schema = zui.object({
      favoriteColors: zui.array(zui.string()),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema
    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const addBtn = rendered.getByTestId('array:favoriteColors:addbtn')

    for (let i = 0; i < 20; i++) {
      fireEvent.click(addBtn)
    }

    for (let i = 0; i < 20; i++) {
      const element = rendered.getByTestId(`string:favoriteColors.${i}`)
      expect(element).toBeTruthy()
      expect(element.getAttribute('data-index')).toBe(i.toString())
    }

    const removeBtn = rendered.getByTestId('string:favoriteColors.5:removeselfbtn')
    fireEvent.click(removeBtn)

    for (let i = 0; i < 19; i++) {
      const element = rendered.getByTestId(`string:favoriteColors.${i}`)
      expect(element).toBeTruthy()
      expect(element.getAttribute('data-index')).toBe(i.toString())
    }
  })

  it('calls onChange with the correct data', () => {
    const onChangeMock = vi.fn()

    const schema = zui.object({
      students: zui.array(
        zui.object({
          name: zui.string(),
          age: zui.number(),
        }),
      ),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{ students: [{ name: 'John', age: 20 }] }}
        onChange={onChangeMock}
      />,
    )

    // check initial value
    expect(onChangeMock).toHaveBeenCalledWith({ students: [{ name: 'John', age: 20 }] })

    const input = rendered.getByTestId('string:students.0.name:input')
    fireEvent.change(input, { target: { value: 'Jane' } })

    expect(onChangeMock).toHaveBeenCalledTimes(3) // 1 for initial value, 2 for change

    // check value after change
    expect(onChangeMock).toHaveBeenCalledWith({ students: [{ name: 'Jane', age: 20 }] })
  })

  it('calls onValidation with form validation', () => {
    const schema = zui.object({
      name: zui.string().max(3),
      age: zui.number().min(8),
    })

    const spy = vi.fn()

    const rendered = render(
      <ZuiFormWithState
        schema={schema.toJsonSchema() as ObjectSchema}
        components={testComponentImplementation}
        onValidation={spy}
      />,
    )

    const nameInput = rendered.getByTestId('string:name:input') as HTMLInputElement
    const ageInput = rendered.getByTestId('number:age:input') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'Joh' } })
    expect(spy.mock.calls.every((call) => call.formValid === false)).toStrictEqual(false)
    expect(spy.mock.lastCall[0].formErrors).toHaveLength(1)

    fireEvent.change(ageInput, { target: { value: '5' } })

    expect(spy.mock.calls.every((call) => call.formValid === false)).toStrictEqual(false)
    expect(spy.mock.lastCall[0].formErrors).toHaveLength(1)

    fireEvent.change(ageInput, { target: { value: '10' } })

    expect(spy.mock.lastCall[0].formValid).toStrictEqual(true)
    expect(spy.mock.lastCall[0].formErrors).toHaveLength(0)
  })

  it('returns null formValidation when disableValidation is true', () => {
    const schema = zui.object({
      name: zui.string().max(3),
      age: zui.number().min(8),
    })

    const spy = vi.fn()

    const rendered = render(
      <ZuiFormWithState
        schema={schema.toJsonSchema() as ObjectSchema}
        components={testComponentImplementation}
        onValidation={spy}
        disableValidation
      />,
    )

    const nameInput = rendered.getByTestId('string:name:input') as HTMLInputElement
    const ageInput = rendered.getByTestId('number:age:input') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'John' } })
    fireEvent.change(ageInput, { target: { value: '5' } })

    spy.mock.calls.forEach((call) => {
      expect(call[0].formValid).toBeNull()
      expect(call[0].formErrors).toBeNull()
    })
  })

  it('it renders custom zui components with correct params as input', () => {
    const schema = zui.object({
      firstName: zui.string(),
      lastName: zui.string(),
      customField: zui
        .string()
        .displayAs<typeof testComponentDefinitions>({ id: 'customstringcomponent', params: { multiline: true } }),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    const customInput = rendered.getByTestId('string:customField:custominput')
    expect(customInput).toBeTruthy()

    const params = rendered.getByTestId('string:customField:params')
    expect(params.innerHTML).toBe(JSON.stringify({ multiline: true }, null, 2))
  })

  it('passes the correct zui props to components', () => {
    const schema = zui.object({
      somefield: zui
        .string()
        .title('First Name')
        .placeholder('Enter your first name')
        .displayAs<typeof testComponentDefinitions>({ id: 'customstringcomponent', params: { multiline: false } })
        .disabled()
        .hidden(false),
      lastName: zui.string().title('Last Name'),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    const firstNameInput = rendered.getByTestId('string:somefield:zuiprops')

    expect(JSON.parse(firstNameInput.innerHTML)).toEqual({
      title: 'First Name',
      placeholder: 'Enter your first name',
      disabled: true,
      hidden: false,
      displayAs: ['customstringcomponent', { multiline: false }],
    })
  })

  it('renders nullable elements', () => {
    const schema = zui.object({
      name: zui.string().nullable(),
      age: zui.number().nullable(),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{}}
        onChange={() => console.log()}
      />,
    )

    const nameInput = rendered.getByTestId('string:name:input')
    expect(nameInput).toBeTruthy()

    const ageInput = rendered.getByTestId('number:age:input')
    expect(ageInput).toBeTruthy()
  })

  it('render multilevel arrays with custom components correctly', () => {
    const schema = zui
      .object({
        kids: zui.array(
          zui.object({
            name: zui.string(),
            toys: zui.array(zui.string()).displayAs<typeof testComponentDefinitions>({ id: 'stringList', params: {} }),
          }),
        ),
      })
      .displayAs<typeof testComponentDefinitions>({ id: 'collapsible', params: { collapsed: false } })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(
      <ZuiForm<typeof testComponentDefinitions>
        schema={jsonSchema}
        components={testComponentImplementation}
        value={{ kids: [{ toys: [''] }] }}
        onChange={() => console.log()}
      />,
    )

    const addBtn = rendered.getByTestId('stringlistelement:addbtn')

    expect(addBtn).toBeTruthy()

    fireEvent.click(addBtn)

    const element = rendered.queryByTestId('stringlistelement:0')

    expect(element).toBeTruthy()
  })

  it('renders discriminated union correctly', () => {
    const aDUSchema = zui.discriminatedUnion('type', [
      zui.object({
        type: zui.literal('text'),
        name: zui.string(),
      }),
      zui.object({
        type: zui.literal('number'),
        value: zui.number(),
      }),
      zui.object({
        value: zui.string(),
        type: zui.literal('image'),
      }),
    ])

    const jsonSchema = aDUSchema.toJsonSchema()

    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const select = rendered.getByTestId(TestId('discriminatedUnion', [], 'select'))
    expect(select).toBeTruthy()

    const textInput = rendered.getByTestId(TestId('string', ['name'], 'input'))
    expect(textInput).toBeTruthy()

    const options = Array.from(select!.querySelectorAll('option')).map((option) => option.textContent)
    expect(options).toEqual(['text', 'number', 'image'])

    fireEvent.change(select!, { target: { value: 'number' } })

    const numberInput = rendered.getByTestId(TestId('number', ['value'], 'input'))

    expect(numberInput).toBeTruthy()
    expect(rendered.queryByTestId(TestId('string', ['name'], 'input'))).toBeFalsy()
  })

  it('handles disabled functions correctly on simple fields', () => {
    const schema = zui.object({
      name: zui.string().disabled((n) => n?.includes('Charles') || false),
      value: zui.number().disabled((n) => n === 5),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)
    const numberInput = rendered.getByTestId('number:value:input') as HTMLInputElement

    expect(numberInput.disabled).toBeFalsy()
    fireEvent.change(numberInput, { target: { value: '5' } })
    expect(numberInput.disabled).toBeTruthy()

    const textInput = rendered.getByTestId('string:name:input') as HTMLInputElement

    expect(textInput.disabled).toBeFalsy()
    fireEvent.change(textInput, { target: { value: 'Charles' } })
    expect(textInput.disabled).toBeTruthy()
  })

  it('handles conditional disabled functions on object fields', () => {
    const schema = zui
      .object({
        name: zui.string(),
        address: zui.object({
          street: zui.string(),
          city: zui.string(),
        }),
      })
      .disabled((obj) => ({
        address: {
          city: !obj?.name,
          street: !obj?.name,
        },
      }))

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const cityInput = rendered.getByTestId('string:address.city:input') as HTMLInputElement
    const streetInput = rendered.getByTestId('string:address.street:input') as HTMLInputElement
    const nameInput = rendered.getByTestId('string:name:input') as HTMLInputElement

    expect(cityInput.disabled).toBeTruthy()
    expect(streetInput.disabled).toBeTruthy()
    expect(nameInput.disabled).toBeFalsy()

    fireEvent.change(nameInput, { target: { value: 'John' } })

    expect(cityInput.disabled).toBeFalsy()
    expect(streetInput.disabled).toBeFalsy()
    expect(nameInput.disabled).toBeFalsy()
  })

  it('handles conditional rendering on simple fields', () => {
    const schema = zui.object({
      name: zui.string().hidden((n) => n === 'Charles'),
      value: zui.number().hidden((n) => n === 5),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const numberInput = rendered.getByTestId('number:value:input') as HTMLInputElement

    expect(numberInput).toBeTruthy()

    const textInput = rendered.getByTestId('string:name:input') as HTMLInputElement

    expect(textInput).toBeTruthy()

    fireEvent.change(numberInput, { target: { value: '5' } })
    expect(rendered.queryByTestId('number:value:input')).toBeFalsy()

    fireEvent.change(textInput, { target: { value: 'Charles' } })
    expect(rendered.queryByTestId('number:value:input')).toBeFalsy()
  })

  it('prepopulates the form with existing defaults on first render', () => {
    const schema = zui.object({
      name: zui.string().default('John'),
      age: zui.number().default(20),
      favoriteFoods: zui.array(zui.string()).default(['Pizza', 'Burgers']),
      paymentMethod: zui
        .discriminatedUnion('type', [
          zui.object({
            type: zui.literal('credit'),
            cardNumber: zui.string(),
          }),
          zui.object({
            type: zui.literal('paypal'),
            email: zui.string(),
          }),
        ])
        .default({ type: 'credit', cardNumber: '1234' }),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const rendered = render(<ZuiFormWithState schema={jsonSchema} components={testComponentImplementation} />)

    const nameInput = rendered.getByTestId('string:name:input') as HTMLInputElement
    const ageInput = rendered.getByTestId('number:age:input') as HTMLInputElement
    const favoriteFoods = rendered.getByTestId('array:favoriteFoods:container').children
    const creditCardInput = rendered.getByTestId('string:paymentMethod.cardNumber:input') as HTMLInputElement

    expect(nameInput.value).toBe('John')
    expect(ageInput.value).toBe('20')
    expect(favoriteFoods).toHaveLength(2)
    expect(creditCardInput.value).toBe('1234')
  })

  it("Doesn't override initialData with default values", () => {
    const schema = zui.object({
      name: zui.string().default('John'),
      age: zui.number().default(20),
    })

    const jsonSchema = schema.toJsonSchema() as ObjectSchema

    const mock = vi.fn()
    const rendered = render(
      <ZuiFormWithState
        schema={jsonSchema}
        components={testComponentImplementation}
        onChange={mock}
        initialData={{ name: 'Jane' }}
      />,
    )
    const nameInput = rendered.getByTestId('string:name:input') as HTMLInputElement
    const ageInput = rendered.getByTestId('number:age:input') as HTMLInputElement

    expect(nameInput.value).toBe('Jane')
    expect(ageInput.value).toBe('20')
  })
})

describe('utils', () => {
  it('can resolve a discriminated union discriminator', () => {
    const aDUSchema = zui
      .discriminatedUnion('type', [
        zui.object({
          type: zui.literal('text'),
          name: zui.string(),
        }),
        zui.object({
          type: zui.literal('number'),
          value: zui.number(),
        }),
        zui.object({
          value: zui.string(),
          type: zui.literal('image'),
        }),
      ])
      .toJsonSchema()

    const discriminators = resolveDiscriminator(aDUSchema.anyOf)

    expect(discriminators).toEqual({
      key: 'type',
      values: ['text', 'number', 'image'],
    })
  })

  it('can resolve null when resolving discriminator on a non-discriminated union', () => {
    const aSchema = zui
      .object({
        test: zui.string().min(3).optional().nullable(),
      })
      .toJsonSchema()

    const discriminators = resolveDiscriminator(aSchema.anyOf)

    expect(discriminators).toBeNull()
  })

  it('can resolve the discriminated schema for a given discriminator value', () => {
    const aDUSchema = zui
      .discriminatedUnion('type', [
        zui.object({
          type: zui.literal('text'),
          name: zui.string(),
        }),
        zui.object({
          type: zui.literal('number'),
          value: zui.number(),
        }),
        zui.object({
          value: zui.string(),
          type: zui.literal('image'),
        }),
      ])
      .toJsonSchema()

    const schema = resolveDiscriminatedSchema('type', 'text', aDUSchema.anyOf)

    expect(schema).toEqual({
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['text'],
          [zuiKey]: {
            hidden: true,
          },
        },
        name: { type: 'string', [zuiKey]: {} },
      },
      required: ['type', 'name'],
      additionalProperties: false,
      [zuiKey]: {},
    })
  })
})

export const testComponentDefinitions = {
  string: {
    customstringcomponent: {
      id: 'customstringcomponent',
      params: zui.object({ multiline: zui.boolean() }),
    },
    otherstringcomponent: {
      id: 'otherstringcomponent',
      params: zui.object({ multiline: zui.boolean() }),
    },
  },
  array: {
    stringList: {
      id: 'stringList',
      params: zui.object({}),
    },
  },
  object: {
    collapsible: {
      id: 'collapsible',
      params: zui.object({ collapsed: zui.boolean() }),
    },
  },
  boolean: {},
  number: {},
  discriminatedUnion: {},
} as const satisfies UIComponentDefinitions

const ZuiFormWithState: FC<
  Omit<ZuiFormProps<any>, 'onChange' | 'value'> & { initialData?: any; onChange?: (data: any) => void }
> = (props) => {
  const [state, setState] = useState(props.initialData)
  return (
    <ZuiForm
      {...props}
      value={state}
      onChange={(data) => {
        setState(data)
        props.onChange?.(data)
      }}
    />
  )
}

const TestWrapper: FC<PropsWithChildren<ZuiReactComponentBaseProps<BaseType, string, any>>> = ({
  children,
  type,
  scope,
  schema,
  params,
  ...props
}) => {
  return (
    <div
      data-testid={`${type}:${scope}`}
      data-componentid={props.componentID}
      data-elementdata={JSON.stringify(props.data || {})}
      data-label={props.label}
      data-ischild={props.isArrayChild}
      data-index={props.isArrayChild ? props.index : undefined}
    >
      <section data-testid={`${type}:${scope}:container`}>{children}</section>
      <script type="application/json" data-testid={`${type}:${scope}:schema`}>
        {JSON.stringify(schema, null, 2)}
      </script>
      <script type="application/json" data-testid={`${type}:${scope}:params`}>
        {JSON.stringify(params, null, 2)}
      </script>
      <script type="application/json" data-testid={`${type}:${scope}:zuiprops`}>
        {JSON.stringify(props.zuiProps || {}, null, 2)}
      </script>
      {props.isArrayChild ? (
        <button data-testid={`${type}:${scope}:removeselfbtn`} onClick={() => props.removeSelf()}>
          Remove self
        </button>
      ) : null}
    </div>
  )
}

const testComponentImplementation: ZuiComponentMap<typeof testComponentDefinitions> = {
  string: {
    customstringcomponent: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            data-testid={`${props.type}:${props.scope}:custominput`}
            value={props.data || ''}
            disabled={props.disabled}
            onChange={(e) => props.onChange(e.target.value)}
          />
        </TestWrapper>
      )
    },
    otherstringcomponent: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            data-testid={`${props.type}:${props.scope}:input`}
            value={props.data || ''}
            disabled={props.disabled}
            onChange={(e) => props.onChange(e.target.value)}
          />
        </TestWrapper>
      )
    },
    default: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            data-testid={`${props.type}:${props.scope}:input`}
            value={props.data || ''}
            disabled={props.disabled}
            onChange={(e) => props.onChange(e.target.value)}
          />
        </TestWrapper>
      )
    },
  },
  object: {
    collapsible: (props) => {
      return (
        <TestWrapper {...props}>
          <details data-iscollapsible>
            <summary>Collapsible</summary>
            {props.children}
          </details>
        </TestWrapper>
      )
    },
    default: (props) => <TestWrapper {...props}>{props.children}</TestWrapper>,
  },
  array: {
    stringList: (props) => {
      const childrens = Array.isArray(props.children) ? props.children : [props.children]
      return (
        <TestWrapper {...props}>
          <button data-testid="stringlistelement:addbtn" onClick={() => props.addItem()}>
            Add item
          </button>
          {childrens.map((child, index) => (
            <div key={child.key} data-testid={`stringlistelement:${index}`}>
              <span key={index}>{child}</span>
              <button onClick={() => props.removeItem(index)}>-</button>
            </div>
          ))}
        </TestWrapper>
      )
    },
    default: ({ type, scope, children, addItem, removeItem, schema }) => {
      return (
        <div data-testid={`${type}:${scope}`}>
          <section data-testid={`${type}:${scope}:container`}>{children}</section>
          <button data-testid={`${type}:${scope}:addbtn`} onClick={() => addItem()}>
            Add Item
          </button>
          <button data-testid={`${type}:${scope}:removebtn`} onClick={() => removeItem(0)}>
            Remove first
          </button>
          <script type="application/json" data-testid={`${type}:${scope}:schema`}>
            {JSON.stringify(schema, null, 2)}
          </script>
        </div>
      )
    },
  },
  boolean: {
    default: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            type="checkbox"
            disabled={props.disabled}
            data-testid={`${props.type}:${props.scope}:input`}
            checked={props.data || false}
            onChange={(e) => props.onChange(Boolean(e.target.value))}
          />
        </TestWrapper>
      )
    },
  },
  number: {
    default: (props) => {
      return (
        <TestWrapper {...props}>
          <input
            type="number"
            disabled={props.disabled}
            data-testid={`${props.type}:${props.scope}:input`}
            value={props.data || ''}
            onChange={(e) => props.onChange(parseFloat(e.target.value))}
          />
        </TestWrapper>
      )
    },
  },
  discriminatedUnion: {
    default: (props) => {
      return (
        <TestWrapper {...props}>
          <select
            data-testid={`${props.type}:${props.scope}:select`}
            onChange={(e) => props.setDiscriminator(e.target.value)}
            value={props.discriminatorValue || undefined}
          >
            {props.discriminatorOptions?.map((option) => <option key={option}>{option}</option>)}
          </select>
          <div data-testid={`${props.type}:${props.scope}:inner`}>{props.children}</div>
        </TestWrapper>
      )
    },
  },
}

const traverseSchemaTest = (schema: JSONSchema, callback: (path: string[], child: JSONSchema) => void) => {
  const traverse = (path: string[], child: JSONSchema) => {
    if (child.type === 'object' && child.properties) {
      for (const [key, value] of Object.entries(child.properties)) {
        traverse([...path, key], value)
      }
    }
    if (child.type === 'array') {
      if (Array.isArray(child.items)) {
        child.items.forEach((item, index) => {
          traverse([...path, index.toString()], item)
        })
      } else {
        traverse([...path, '0'], child.items!)
      }
    }
    callback(path, child)
  }
  return traverse([], schema)
}
