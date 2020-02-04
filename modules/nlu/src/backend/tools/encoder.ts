import _ from 'lodash'

export function encodeOH(classes: string[] | number[], values: string[] | number[]): number[] {
  const initialDic: _.Dictionary<number> = classes.reduce((dic, cls) => ({ ...dic, [cls]: 0 }), {})
  return (
    _.chain(values)
      .reduce((dic, value: string | number) => {
        if (dic[value] !== undefined) {
          dic[value]++
        }
        return dic
      }, initialDic)
      .toPairs() // [ key, value ]
      .orderBy('0') // key index
      .map('1') // value index
      // .map(x => Math.min(x[1], 5) / 5) // value index
      .value()
  )
}
