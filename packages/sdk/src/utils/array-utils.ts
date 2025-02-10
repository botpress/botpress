export const safePush = <T>(arr: T[] | undefined, ...values: T[]): T[] => (arr ? [...arr, ...values] : [...values])

export const unique = <T>(arr: T[]): T[] => Array.from(new Set(arr))
