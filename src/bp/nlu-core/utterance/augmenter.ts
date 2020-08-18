import _ from 'lodash'

export interface Augmentation {
  slotName: string
  examples: string[]
}

/** Stateful augmenter that returns a new phrase with iterating each slot examples equally */
export const createAugmenter = (vars: Augmentation[]) => {
  const indexes: { [key: string]: number } = {}
  return function(phrase: string): string {
    return vars.reduce((acc, curr) => {
      return acc.replace(new RegExp('\\$' + curr.slotName, 'gi'), function() {
        indexes[curr.slotName] = (indexes[curr.slotName] ?? -1) + 1
        const occ = curr.examples[indexes[curr.slotName] % curr.examples.length]
        return `[${occ}](${curr.slotName})`
      })
    }, phrase)
  }
}

/** Zips and flattens multiple arrays so that each are alternated equally until exausted
 * eg. [ [a,b,c,d], [1,2,3], [_, -] ] ==> [a,1,_,b,2,-,c,3,d]
 */
export const interleave = (...arrs: string[][]): string[] => {
  return _.flatten(_.zip(...arrs) as string[][]).filter(_.identity)
}
