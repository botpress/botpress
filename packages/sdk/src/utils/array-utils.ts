export const safePush = <T>(arr: T[] | undefined, ...values: T[]): T[] => (arr ? [...arr, ...values] : [...values])
