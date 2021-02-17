export const PATH_SEPARATOR = '/'
export const SPACE_SEPARATOR = ' '

class TreeNode<T> {
  public value: T | undefined
  public children: Map<string, TreeNode<T>> = new Map()

  constructor(value?: T) {
    if (value) {
      this.value = value
    }
  }
}

export class TreeSearch<T = string> {
  private root: TreeNode<T> = new TreeNode()
  private elements: number = 0

  constructor(private separator?: string) {}

  /**
   * The number of elements in the tree
   */
  public get count(): number {
    return this.elements
  }

  /**
   * Operate a tree search to find the value associated with a certain key
   * @param key The key used to retrieve its associated value in the tree
   * @returns A value of type T or undefined when there is not hit
   */
  public get(key: string): T | undefined {
    if (!key) {
      return
    }

    const chunks: string[] = this.prepareKey(key)

    return this.searchNode(chunks, this.root)
  }

  /**
   * Operate a tree search to find the parent value of a certain key
   * @param key The key used to retrieve the parent value associated with it
   * @returns A value of type T or undefined when the `key` has no parent value
   */
  public getParent(key: string): T | undefined {
    if (!key) {
      return
    }

    const chunks: string[] = this.prepareKey(key)

    return this.searchNode(chunks, this.root, true)
  }

  /**
   * Inserts a value with a given key into the tree so it can be retrieved fast
   * @param key The key used to insert and retrieve the value
   * @param value The value to insert
   * @param override (default: false) Whether or not to override the value associated with a given key
   * @returns Whether or not the value was inserted for the first time. _Note: in case of an update (e.g. `overrides=true` with an existing key), the returned value is false._
   */
  public insert(key: string, value: T, override = false): boolean {
    if (!key) {
      return false
    }

    const chunks: string[] = this.prepareKey(key)

    const inserted = this.addNode(chunks, value, override, this.root)
    if (inserted) {
      this.elements++
    }

    return inserted
  }

  /**
   * Removes a value from the tree
   * @param key The key used access the value
   * @returns Whether or not the value was removed from the tree
   */
  public remove(key: string): boolean {
    if (!key) {
      return false
    }

    const chunks: string[] = this.prepareKey(key)

    const deleted = this.removeNode(chunks, this.root)
    if (deleted) {
      this.elements--
    }

    return deleted
  }

  private searchNode(
    chunks: string[],
    node: TreeNode<T>,
    returnParent = false,
    parent: T | undefined = undefined
  ): T | undefined {
    if (chunks) {
      const name = chunks.shift()!
      const child = node.children.get(name)

      if (!child) {
        return undefined
      } else if (returnParent && chunks.length === 0 && child.value) {
        // We found the element in the tree. Let's return its parent value.
        return parent
      } else if (chunks.length === 0) {
        // We might have found the value
        return child.value
      } else if (child.value) {
        // Use the child value as the closest parent and go one level deeper
        return this.searchNode(chunks, child, returnParent, child.value)
      } else {
        // Searching one level deeper with the same parent
        return this.searchNode(chunks, child, returnParent, parent)
      }
    }
  }

  private removeNode(chunks: string[], node: TreeNode<T>): boolean {
    const name = chunks.shift()!
    const child = node.children.get(name)

    if (!child) {
      return false
    } else {
      if (chunks.length !== 0) {
        return this.removeNode(chunks, child)
      } else {
        if (child.children.size > 0) {
          child.value = undefined
        } else {
          node.children.delete(name)
        }
        return true
      }
    }
  }

  private addNode(chunks: string[], value: T, override: boolean, node: TreeNode<T>): boolean {
    const name = chunks.shift()!
    const child = node.children.get(name)

    if (!child) {
      if (chunks.length !== 0) {
        const treeNode = new TreeNode<T>()
        node.children.set(name, treeNode)

        return this.addNode(chunks, value, override, treeNode)
      } else {
        node.children.set(name, new TreeNode(value))

        return true
      }
    } else {
      if (chunks.length !== 0) {
        return this.addNode(chunks, value, override, child)
      } else {
        if (!child.value || override) {
          const newInsert = child.value === undefined
          child.value = value

          return newInsert
        }
        return false
      }
    }
  }

  private prepareKey(key: string): string[] {
    key = key.trim().toLowerCase()

    if (this.separator) {
      return key.split(this.separator)
    } else {
      return [key]
    }
  }
}
