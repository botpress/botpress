declare module 'analytics' {
  export type Graph = {
    name: string
    type: 'count' | 'countUniq' | 'percent' | 'piechart'
    description: string
    variables: string[]
    /**
     * (String function definition) that is used to calculate result - optional
     */
    fn?
    /**
     * (String function definition) that gets used for 'percent' type to calculate average value - optional
     */
    fnAvg?
  }
}
