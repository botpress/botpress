class TreeNode {
  public value: string | undefined
  public children: Map<string, TreeNode> = new Map()

  constructor(value?: string) {
    if (value) {
      this.value = value
    }
  }
}

export class TreeSearch {
  private root: TreeNode = new TreeNode()
  private elements: number = 0

  constructor(private separator: string, private caseSensitive = false) {}

  public get length(): number {
    return this.elements
  }

  public getClosestParent(path: string): string | undefined {
    const split: string[] = this.preparePath(path)

    return this.searchNode(split, this.root)
  }

  private searchNode(split: string[], node: TreeNode) {
    if (split) {
      const name = split.shift()!
      const child = node.children.get(name)
      if (!child) {
        return undefined
      } else if (child.value && split.length !== 0) {
        return child.value
      } else {
        return this.searchNode(split, child)
      }
    }
  }

  public insert(path: string): void {
    const split: string[] = this.preparePath(path)
    this.addNode(path, split, this.root)
  }

  private addNode(path: string, split: string[], node: TreeNode) {
    if (split) {
      const name = split.shift()!
      const child = node.children.get(name)
      if (!child) {
        if (split.length !== 0) {
          const treeNode = new TreeNode()
          node.children.set(name, treeNode)

          this.addNode(path, split, treeNode)
        } else {
          node.children.set(name, new TreeNode(path))
        }
      } else {
        if (split.length !== 0) {
          this.addNode(path, split, child)
        } else {
          child.value = path
        }
      }
    }
  }

  private preparePath(path: string): string[] {
    path = path.trim()
    if (!this.caseSensitive) {
      path = path.toLowerCase()
    }

    return path.split(this.separator)
  }
}
