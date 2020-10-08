import { EntityExtractionResult } from 'nlu-core/typings'

import { Duckling, DucklingDimension, DucklingReturn, DucklingType, DucklingValue, ValueUnit } from './typings'

export function mapDucklingToEntity(duck: Duckling): EntityExtractionResult {
  const dimensionData = getUnitAndValue(duck)
  return {
    confidence: 1,
    start: duck.start,
    end: duck.end,
    type: duck.dim,
    value: dimensionData.value,
    metadata: {
      extractor: 'system',
      source: duck.body,
      entityId: `system.${duck.dim}`,
      unit: dimensionData.unit
    }
  } as EntityExtractionResult
}

export function getUnitAndValue(duck: Duckling): ValueUnit {
  if (_isDuration(duck)) {
    return duck.value.normalized
  }

  if (_isTime(duck)) {
    const time = duck.value

    if (_isTimeValue(time)) {
      return {
        value: time.value,
        unit: time.grain
      }
    }

    if (_isTimeInterval(time)) {
      const { from } = time
      return {
        value: from.value,
        unit: from.grain
      }
    }
  }

  if (_isValueUnit(duck.value)) {
    return {
      value: duck.value.value,
      unit: duck.value.unit
    }
  }

  return {
    value: '',
    unit: ''
  }
}

const _isDuration = (duck: Duckling): duck is DucklingReturn<'duration'> => {
  return duck.dim === 'duration'
}

const _isTime = (duck: Duckling): duck is DucklingReturn<'time'> => {
  return duck.dim === 'time'
}

const _isTimeInterval = (
  duckTime: DucklingValue<'time', DucklingType>
): duckTime is DucklingValue<'time', 'interval'> => {
  return duckTime.type === 'interval'
}

const _isTimeValue = (duckTime: DucklingValue<'time', DucklingType>): duckTime is DucklingValue<'time', 'value'> => {
  return duckTime.type === 'value'
}

const _isValueUnit = (
  duckValue: DucklingValue<DucklingDimension, DucklingType>
): duckValue is { type: DucklingType } & ValueUnit => {
  return !!((duckValue as ValueUnit).value && (duckValue as ValueUnit).unit)
}
