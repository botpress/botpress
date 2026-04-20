import { PLUGIN_PREFIX_SEPARATOR } from '../consts'
import { describe, it, expect } from 'vitest'
import { unprefixTagsOwnedByPlugin, prefixTagsIfNeeded } from './tag-prefixer'

describe.concurrent('unprefixTagsOwnedByPlugin', () => {
  it('should unprefix tags owned by the plugin and eliminate other tags', () => {
    // Arrange
    const pluginAlias = 'plugin1'
    const tags = {
      [`${pluginAlias}${PLUGIN_PREFIX_SEPARATOR}foo`]: 'foo',
      [`otherPlugin${PLUGIN_PREFIX_SEPARATOR}bar`]: 'bar',
      baz: 'baz',
    }

    // Act
    const unprefixed = unprefixTagsOwnedByPlugin({ tags }, { alias: pluginAlias })

    // Assert
    expect(unprefixed.tags).toStrictEqual({
      foo: 'foo',
    })
  })
})

describe.concurrent('prefixTagsIfNeeded', () => {
  it('should prefix tags if needed', () => {
    // Arrange
    const pluginAlias = 'plugin1'
    const tags = {
      foo: 'foo',
      [`${pluginAlias}${PLUGIN_PREFIX_SEPARATOR}bar`]: 'bar',
      baz: 'baz',
    }

    // Act
    const prefixed = prefixTagsIfNeeded({ tags }, { alias: pluginAlias })

    // Assert
    expect(prefixed.tags).toStrictEqual({
      [`${pluginAlias}${PLUGIN_PREFIX_SEPARATOR}foo`]: 'foo',
      [`${pluginAlias}${PLUGIN_PREFIX_SEPARATOR}bar`]: 'bar',
      [`${pluginAlias}${PLUGIN_PREFIX_SEPARATOR}baz`]: 'baz',
    })
  })
})
