import _ from 'lodash'

interface Nodes {
  obj: Object
  path: string[]
}

/**
 * Returns the full path and value of every keys and subkeys of an object.
 * Can be used to easily check the difference between two objects.
 *
 * const myObject = {
 *  id: 1,
 *  profile: {
 *    name: 'test',
 *    age: 15
 *  }
 * }
 * Result: {
 *  'id': 1,
 *  'profile.name': 'test',
 *  'profile.age': 15
 * }
 *
 * @param root Any kind of object
 */
export function getPaths(sourceObject: any): any {
  const nodes: Nodes[] = [{ obj: sourceObject, path: [] }]
  const result: any = {}

  while (nodes.length > 0) {
    const node = nodes.pop()

    node &&
      Object.keys(node.obj).forEach(key => {
        const value = node.obj[key]
        const currentPath = node.path.concat(key)

        if (Array.isArray(value) || typeof value !== 'object') {
          result[currentPath.join('.')] = value
        } else {
          nodes.unshift({ obj: value, path: currentPath })
        }
      })
  }

  return result
}
