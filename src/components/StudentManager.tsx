import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import type { ImportSummary, Student, StudentName } from './types'
import {
  MAX_PERSON_NAME_LENGTH,
  namePartError,
  normalizeNamePart,
  parseStudentListLine,
} from './validation'

interface StudentManagerProps {
  students: Student[]
  loading: boolean
  selectedIds: string[]
  drawExists: boolean
  onAdd: (person: StudentName) => Promise<boolean>
  onAddMany: (people: Array<StudentName & { line: number }>) => Promise<ImportSummary | null>
  onRemove: (student: Student) => Promise<void>
}

export function StudentManager({
  students,
  loading,
  selectedIds,
  drawExists,
  onAdd,
  onAddMany,
  onRemove,
}: StudentManagerProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkFeedback, setBulkFeedback] = useState('')

  const filteredStudents = useMemo(
    () => students
      .filter((student) => student.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
      .sort((first, second) => first.name.localeCompare(second.name, 'de')),
    [students, search],
  )

  const firstNameError = firstName ? namePartError(firstName) : ''
  const lastNameError = lastName ? namePartError(lastName) : ''
  const canAdd = Boolean(firstName.trim() && lastName.trim()) && !firstNameError && !lastNameError

  async function submitStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canAdd || adding) return
    setAdding(true)
    setBulkFeedback('')
    try {
      if (await onAdd({ firstName: normalizeNamePart(firstName), lastName: normalizeNamePart(lastName) })) {
        setFirstName('')
        setLastName('')
      }
    } finally {
      setAdding(false)
    }
  }

  async function submitBulkList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (adding) return
    const invalid: string[] = []
    const people = bulkText.split(/\r?\n/).flatMap((line, index) => {
      if (!line.trim()) return []
      const person = parseStudentListLine(line)
      if (!person) {
        invalid.push(`Zeile ${index + 1}: Bitte „Vorname Nachname“ oder „Vorname;Nachname“ verwenden.`)
        return []
      }
      return [{ ...person, line: index + 1 }]
    })

    setAdding(true)
    setBulkFeedback('')
    try {
      const result = await onAddMany(people)
      if (!result) return
      const invalidLines = [...invalid, ...result.invalid]
      const feedback = [
        `${result.added} ${result.added === 1 ? 'Name' : 'Namen'} gespeichert.`,
        result.duplicates.length ? `${result.duplicates.length} doppelte Namen übersprungen.` : '',
        invalidLines.length ? `${invalidLines.length} ungültige Zeilen übersprungen.` : '',
      ].filter(Boolean)
      setBulkFeedback(feedback.join(' '))
      if (result.added > 0) setBulkText('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className="panel student-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">SCHRITT 01</p>
          <h2>Deine Klasse</h2>
        </div>
        <span className="count-badge">{students.length} <span>Personen</span></span>
      </div>
      <form className="add-student-form" onSubmit={(event) => void submitStudent(event)}>
        <div className="name-field">
          <label className="sr-only" htmlFor="student-first-name">Vorname</label>
          <input
            id="student-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            onBlur={() => setFirstName((value) => normalizeNamePart(value))}
            placeholder="Vorname"
            maxLength={MAX_PERSON_NAME_LENGTH}
            autoComplete="given-name"
            aria-invalid={Boolean(firstNameError)}
            aria-describedby={firstNameError ? 'first-name-error' : 'name-rules'}
          />
          {firstNameError && <span className="field-error" id="first-name-error">{firstNameError}</span>}
        </div>
        <div className="name-field">
          <label className="sr-only" htmlFor="student-last-name">Nachname</label>
          <input
            id="student-last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            onBlur={() => setLastName((value) => normalizeNamePart(value))}
            placeholder="Nachname"
            maxLength={MAX_PERSON_NAME_LENGTH}
            autoComplete="family-name"
            aria-invalid={Boolean(lastNameError)}
            aria-describedby={lastNameError ? 'last-name-error' : 'name-rules'}
          />
          {lastNameError && <span className="field-error" id="last-name-error">{lastNameError}</span>}
        </div>
        <button type="submit" className="add-button" disabled={!canAdd || adding} aria-label="Schüler:in hinzufügen">
          <Icon name="plus" size={19} />
        </button>
      </form>
      <p className="input-hint" id="name-rules">Nur Buchstaben, Leerzeichen, Bindestrich &amp; Apostroph · max. 32 Zeichen je Namensfeld</p>
      <button type="button" className="bulk-toggle" onClick={() => setShowBulk((visible) => !visible)} aria-expanded={showBulk}>
        <Icon name="users" size={15} />
        {showBulk ? 'Einzelliste schließen' : 'Viele Namen auf einmal einfügen'}
        <Icon name={showBulk ? 'close' : 'chevron'} size={14} />
      </button>
      {showBulk && (
        <form className="bulk-form" onSubmit={(event) => void submitBulkList(event)}>
          <label htmlFor="student-bulk-list">Eine Person pro Zeile</label>
          <textarea
            id="student-bulk-list"
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={'Anna Beispiel\nLuca; von Berg'}
            maxLength={12000}
            rows={4}
          />
          <p>Format: <strong>Vorname Nachname</strong> oder mit Semikolon getrennt, falls ein Name mehrere Wörter hat.</p>
          <div className="bulk-actions">
            {bulkFeedback && <span role="status">{bulkFeedback}</span>}
            <button type="submit" disabled={!bulkText.trim() || adding}>
              <Icon name="plus" size={15} /> {adding ? 'Wird gespeichert …' : 'Liste speichern'}
            </button>
          </div>
        </form>
      )}
      <label className="search-field">
        <Icon name="search" size={17} />
        <span className="sr-only">Schüler:innen suchen</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Schüler:in suchen …"
          autoComplete="off"
        />
        {search && <button type="button" className="clear-search" onClick={() => setSearch('')} aria-label="Suche leeren"><Icon name="close" size={14} /></button>}
      </label>
      <div className="student-list" aria-live="polite">
        {loading ? (
          <p className="empty-state">Die Schülerliste wird geladen …</p>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            {students.length === 0 ? 'Noch keine Namen – füge den ersten hinzu!' : 'Keine passenden Namen gefunden.'}
          </div>
        ) : filteredStudents.map((student, index) => (
          <div className="student-row" key={student.id}>
            <span className={`student-avatar avatar-color-${index % 5}`}>{student.firstName.trim().charAt(0).toLocaleUpperCase()}</span>
            <span className="student-name">
              <strong>{student.lastName}</strong> {student.firstName}
            </span>
            <span className={`student-participation ${selectedIds.includes(student.id) ? 'participating' : ''}`}>
              {selectedIds.includes(student.id) ? <><Icon name="check" size={13} /> dabei</> : '—'}
            </span>
            <button
              type="button"
              className="icon-button remove-student"
              onClick={() => void onRemove(student)}
              disabled={drawExists}
              aria-label={`${student.name} aus der Klasse löschen`}
              title={drawExists ? 'Erst die Wichtelziehung zurücksetzen' : 'Aus Klasse löschen'}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
      </div>
      <p className="panel-footnote"><Icon name="lock" size={13} /> Änderungen werden automatisch gespeichert</p>
    </section>
  )
}
