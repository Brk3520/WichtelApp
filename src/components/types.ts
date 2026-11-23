export interface StudentName {
  firstName: string
  lastName: string
}

export interface Student extends StudentName {
  id: string
  name: string
}

export interface SchoolClass {
  id: string
  name: string
}

export interface Assignment {
  giverId: string
  receiverId: string
}

export interface ImportSummary {
  added: number
  duplicates: string[]
  invalid: string[]
}
