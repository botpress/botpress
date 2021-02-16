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

  public get count(): number {
    return this.elements
  }

  public get(key: string, returnOnFirstHit = false): T | undefined {
    if (!key) {
      return
    }

    const chunks: string[] = this.prepareKey(key)

    return this.searchNode(chunks, this.root, returnOnFirstHit)
  }

  public insert(key: string, value: T, override = false): void {
    if (!key) {
      return
    }

    const chunks: string[] = this.prepareKey(key)

    const inserted = this.addNode(chunks, value, override, this.root)
    if (inserted) {
      this.elements++
    }
  }

  public remove(key: string): void {
    if (!key) {
      return
    }

    const chunks: string[] = this.prepareKey(key)

    const deleted = this.removeNode(chunks, this.root)
    if (deleted) {
      this.elements--
    }
  }

  private searchNode(chunks: string[], node: TreeNode<T>, returnOnFirstHit: boolean): T | undefined {
    if (chunks) {
      const name = chunks.shift()!
      const child = node.children.get(name)

      if (!child) {
        return undefined
      } else if ((returnOnFirstHit || chunks.length === 0) && child.value) {
        return child.value
      } else {
        return this.searchNode(chunks, child, returnOnFirstHit)
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
