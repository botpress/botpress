import { type ZodErrorMap, util, ZodIssueCode, ZodParsedType } from '../../index'

/**
 * Русская локализация сообщений об ошибках Zod
 *
 * Для использования установите эту карту ошибок глобально:
 * import { z } from 'zod'
 * import { errorMap } from './locales/ru'
 * z.setErrorMap(errorMap)
 */
export const errorMap: ZodErrorMap = (issue, _ctx) => {
  let message: string
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = 'Обязательное поле'
      } else {
        message = `Ожидалось ${issue.expected}, получено ${issue.received}`
      }
      break
    case ZodIssueCode.invalid_literal:
      message = `Недопустимое значение, ожидалось ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`
      break
    case ZodIssueCode.unrecognized_keys:
      message = `Неизвестные ключи в объекте: ${util.joinValues(issue.keys, ', ')}`
      break
    case ZodIssueCode.invalid_union:
      message = 'Некорректные данные'
      break
    case ZodIssueCode.invalid_union_discriminator:
      message = `Недопустимое значение дискриминатора. Ожидалось ${util.joinValues(issue.options)}`
      break
    case ZodIssueCode.invalid_enum_value:
      message = `Недопустимое значение. Ожидалось ${util.joinValues(issue.options)}, получено '${issue.received}'`
      break
    case ZodIssueCode.invalid_arguments:
      message = 'Некорректные аргументы функции'
      break
    case ZodIssueCode.invalid_return_type:
      message = 'Некорректный тип возвращаемого значения'
      break
    case ZodIssueCode.invalid_date:
      message = 'Некорректная дата'
      break
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === 'object') {
        if ('includes' in issue.validation) {
          message = `Строка должна содержать "${issue.validation.includes}"`

          if (typeof issue.validation.position === 'number') {
            message = `${message} на позиции не меньше ${issue.validation.position}`
          }
        } else if ('startsWith' in issue.validation) {
          message = `Строка должна начинаться с "${issue.validation.startsWith}"`
        } else if ('endsWith' in issue.validation) {
          message = `Строка должна заканчиваться на "${issue.validation.endsWith}"`
        } else {
          util.assertNever(issue.validation)
        }
      } else if (issue.validation !== 'regex') {
        message = `Некорректный формат: ${issue.validation}`
      } else {
        message = 'Некорректный формат'
      }
      break
    case ZodIssueCode.too_small:
      if (issue.type === 'array') {
        message = `Массив должен содержать ${
          issue.exact ? 'ровно' : issue.inclusive ? 'минимум' : 'более'
        } ${issue.minimum} элемент(ов)`
      } else if (issue.type === 'string') {
        message = `Строка должна содержать ${
          issue.exact ? 'ровно' : issue.inclusive ? 'минимум' : 'более'
        } ${issue.minimum} символ(ов)`
      } else if (issue.type === 'number') {
        message = `Число должно быть ${
          issue.exact ? 'равно ' : issue.inclusive ? 'не меньше ' : 'больше '
        }${issue.minimum}`
      } else if (issue.type === 'date') {
        message = `Дата должна быть ${
          issue.exact ? 'равна ' : issue.inclusive ? 'не раньше ' : 'позже '
        }${new Date(Number(issue.minimum))}`
      } else message = 'Некорректные данные'
      break
    case ZodIssueCode.too_big:
      if (issue.type === 'array') {
        message = `Массив должен содержать ${
          issue.exact ? 'ровно' : issue.inclusive ? 'максимум' : 'менее'
        } ${issue.maximum} элемент(ов)`
      } else if (issue.type === 'string') {
        message = `Строка должна содержать ${
          issue.exact ? 'ровно' : issue.inclusive ? 'максимум' : 'менее'
        } ${issue.maximum} символ(ов)`
      } else if (issue.type === 'number') {
        message = `Число должно быть ${
          issue.exact ? 'равно' : issue.inclusive ? 'не больше' : 'меньше'
        } ${issue.maximum}`
      } else if (issue.type === 'bigint') {
        message = `Число должно быть ${
          issue.exact ? 'равно' : issue.inclusive ? 'не больше' : 'меньше'
        } ${issue.maximum}`
      } else if (issue.type === 'date') {
        message = `Дата должна быть ${
          issue.exact ? 'равна' : issue.inclusive ? 'не позже' : 'раньше'
        } ${new Date(Number(issue.maximum))}`
      } else message = 'Некорректные данные'
      break
    case ZodIssueCode.custom:
      message = 'Некорректные данные'
      break
    case ZodIssueCode.invalid_intersection_types:
      message = 'Невозможно объединить типы пересечения'
      break
    case ZodIssueCode.not_multiple_of:
      message = `Число должно быть кратно ${issue.multipleOf}`
      break
    case ZodIssueCode.not_finite:
      message = 'Число должно быть конечным'
      break
    case ZodIssueCode.unresolved_reference:
      message = 'Неразрешённая ссылка'
      break
    default:
      message = _ctx.defaultError
      util.assertNever(issue)
  }
  return { message }
}

export default errorMap
