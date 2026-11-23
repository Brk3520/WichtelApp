import type { StudentName } from './types'

export const MAX_PERSON_NAME_LENGTH = 32
export const MAX_CLASS_NAME_LENGTH = 24

export function normalizeNamePart(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('de-AT'))
}

export function namePartError(value: string) {
  const normalized = normalizeNamePart(value)
  if (!normalized) return 'Bitte ausfüllen.'
  if (normalized.length > MAX_PERSON_NAME_LENGTH) {
    return `Maximal ${MAX_PERSON_NAME_LENGTH} Zeichen.`
  }
  if (!/^\p{L}[\p{L}\s'’-]*$/u.test(normalized)) {
    return 'Nur Buchstaben, Leerzeichen, Bindestriche und Apostrophe.'
  }
  return ''
}

export function normalizeStudentName(value: StudentName): StudentName {
  return {
    firstName: normalizeNamePart(value.firstName),
    lastName: normalizeNamePart(value.lastName),
  }
}

export function studentFullName(value: StudentName) {
  return `${value.firstName} ${value.lastName}`.trim()
}

export function normalizeClassName(value: string) {
  return value.trim().replace(/\s+/g, ' ').replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase('de-AT'))
}

export function classNameError(value: string) {
  const normalized = normalizeClassName(value)
  if (!normalized) return 'Bitte einen Klassennamen eingeben.'
  if (normalized.length > MAX_CLASS_NAME_LENGTH) {
    return `Maximal ${MAX_CLASS_NAME_LENGTH} Zeichen.`
  }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u.test(normalized)) {
    return 'Erlaubt sind Buchstaben, Zahlen, Leerzeichen und Bindestriche.'
  }
  return ''
}

export function parseStudentListLine(line: string): StudentName | null {
  const parts = line.includes(';')
    ? line.split(';').map((part) => part.trim())
    : line.trim().split(/\s+(.+)/, 2).filter(Boolean)

  if (parts.length !== 2) return null
  const student = normalizeStudentName({ firstName: parts[0], lastName: parts[1] })
  if (namePartError(student.firstName) || namePartError(student.lastName)) return null
  return student
}
