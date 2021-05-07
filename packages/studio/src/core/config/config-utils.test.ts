import { ADD_PROP_KEY, getPropertiesRecursive, LeafNode, NestedNode, resolveAdditionalProperties } from './config-utils'

describe('Config utils', () => {
  describe('getPropertiesRecursive', () => {
    it('returns empty array when top level has no properties', () => {
      const properties = getPropertiesRecursive({ type: 'string' })

      expect(properties).toHaveLength(0)
    })

    it('returns all levels of properties', () => {
      const deeplyNestedSchema: NestedNode = {
        type: 'object',
        properties: {
          key0: <LeafNode>{
            type: 'boolean'
          },
          key1: <NestedNode>{
            type: 'object',
            properties: {
              nested1: <LeafNode>{
                type: 'string'
              },
              nested2: <NestedNode>{
                type: 'object',
                properties: {
                  deep0: <LeafNode>{
                    type: 'string'
                  },
                  deep1: <LeafNode>{
                    type: 'number'
                  },
                  $deep2: <LeafNode>{
                    type: 'number'
                  }
                }
              }
            }
          },
          key2: <NestedNode>{
            type: 'object',
            properties: {
              nested1: <LeafNode>{
                type: 'string'
              }
            }
          }
        }
      }

      const properties = getPropertiesRecursive(deeplyNestedSchema)

      expect(properties.length).toEqual(5)
      expect(properties).toContain('key0')
      expect(properties).toContain('key1.nested1')
      expect(properties).toContain('key1.nested2.deep0')
      expect(properties).toContain('key1.nested2.deep1')
      expect(properties).toContain('key2.nested1')
    })

    it('returns additionalProperties with add prop key', () => {
      const schema: NestedNode = {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            type: <LeafNode>{
              description:
                'Defines which authentication strategy to use. When the strategy is changed, accounts created before may no longer log in.',
              default: 'basic',
              enum: ['basic', 'ldap', 'oauth2', 'saml'],
              type: 'string'
            },
            options: <NestedNode>{
              type: 'object',
              properties: {
                maxLoginAttempt: {
                  description:
                    'The maximum number of wrong passwords the user can enter before his account is locked out.\nSet it to 0 for unlimited tries',
                  default: 0,
                  type: 'number'
                }
              }
            }
          }
        }
      }

      const props = getPropertiesRecursive(schema)

      expect(props.length).toEqual(3)
      expect(props).toContain('ADDPROP.id')
      expect(props).toContain('ADDPROP.type')
      expect(props).toContain('ADDPROP.options.maxLoginAttempt')
    })

    it('returns only nested props of union node', () => {
      const schema = {
        anyOf: [
          <LeafNode>{
            type: 'string'
          },
          <NestedNode>{
            type: 'object',
            properties: {
              key0: <LeafNode>{
                type: 'boolean'
              },
              key1: <LeafNode>{
                type: 'number'
              }
            }
          }
        ]
      }

      const properties = getPropertiesRecursive(schema)

      expect(properties.length).toEqual(2)
      expect(properties).toContain('key0')
      expect(properties).toContain('key1')
    })
  })

  describe('resolveAdditionalProperties', () => {
    it('returns truncated path only when no corresponding runtime data keys', () => {
      const paths = [
        `some.${ADD_PROP_KEY}.options.key1`,
        `some.${ADD_PROP_KEY}.options.key2`,
        `some.${ADD_PROP_KEY}.max`
      ]
      const runtimeData = {}

      const resolved = resolveAdditionalProperties(paths, runtimeData)

      expect(resolved).toEqual(expect.arrayContaining(['some']))
    })

    it('omits known keys', () => {
      const paths = [
        'some.key',
        `some.${ADD_PROP_KEY}.options.key1`,
        `some.${ADD_PROP_KEY}.options.key2`,
        `some.${ADD_PROP_KEY}.max`
      ]
      const runtimeData = { some: { key: 'hey' } }

      const resolved = resolveAdditionalProperties(paths, runtimeData)

      expect(resolved.length).toEqual(2)
      expect(resolved).toEqual(expect.arrayContaining(['some', 'some.key']))
    })

    it('returns truncated and all paths including optionals when one or multiple corresponding runtime data key', () => {
      const paths = [
        'some.key',
        `some.${ADD_PROP_KEY}.options.key1`,
        `some.${ADD_PROP_KEY}.options.key2`,
        `some.${ADD_PROP_KEY}.max`
      ]

      const runtimeData = {
        some: {
          key: 'hey',
          def: { options: { key1: 'l', key2: 'p' }, max: 1 },
          jam: { max: 1 } // omit options ==> mimics optional keys
        }
      }

      const resolved = resolveAdditionalProperties(paths, runtimeData)

      expect(resolved.length).toEqual(8)
      expect(resolved).toContain('some')
      expect(resolved).toContain('some.key')
      expect(resolved).toContain('some.def.options.key1')
      expect(resolved).toContain('some.def.options.key2')
      expect(resolved).toContain('some.def.max')
      expect(resolved).toContain('some.jam.options.key1')
      expect(resolved).toContain('some.jam.options.key2')
      expect(resolved).toContain('some.jam.max')
    })

    it('resolves multi level of additional props paths', () => {
      const paths = [
        `some.${ADD_PROP_KEY}.options.${ADD_PROP_KEY}.max`,
        `some.${ADD_PROP_KEY}.options.${ADD_PROP_KEY}.min`
      ]

      const runtimeData = {
        some: {
          def: { options: { deep0: { max: 1, min: 1 }, deep1: { max: 1, min: 0 } } },
          jam: { options: { music: { max: 1, min: 1 }, record: { max: 1, min: 0 } } }
        }
      }

      const resolved = resolveAdditionalProperties(paths, runtimeData)

      expect(resolved.length).toEqual(11)
      expect(resolved).toContain('some')
      expect(resolved).toContain('some.def.options')
      expect(resolved).toContain('some.def.options.deep0.max')
      expect(resolved).toContain('some.def.options.deep0.min')
      expect(resolved).toContain('some.def.options.deep1.max')
      expect(resolved).toContain('some.def.options.deep1.min')
      expect(resolved).toContain('some.jam.options')
      expect(resolved).toContain('some.jam.options.music.max')
      expect(resolved).toContain('some.jam.options.music.min')
      expect(resolved).toContain('some.jam.options.record.max')
      expect(resolved).toContain('some.jam.options.record.min')
    })

    it('returns array as is no add prop provided', () => {
      const paths = ['some.key', 'some.deep.key0', 'some.deep.key1']
      const runtimeData = { some: { key: 1, deep: { key0: 1, key1: 1 } } }

      const resolved = resolveAdditionalProperties(paths, runtimeData)

      expect(resolved).toEqual(expect.arrayContaining(paths))
    })
  })
})
