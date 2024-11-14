export const safePush = <T>(arr: T[] | undefined, value: T): T[] => (arr ? [...arr, value] : [value])
