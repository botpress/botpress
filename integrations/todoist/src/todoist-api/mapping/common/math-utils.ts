export const reverseScale = (value: number, min: number, max: number) => max - _clamp(value, min, max) + min

const _clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
