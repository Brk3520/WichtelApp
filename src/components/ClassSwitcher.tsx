import { useState } from 'react'
import { Icon } from './Icon'
import type { SchoolClass } from './types'
import { classNameError, MAX_CLASS_NAME_LENGTH, normalizeClassName } from './validation'

interface ClassSwitcherProps {
  classes: SchoolClass[]
  activeClassId: string
  onSelect: (classId: string) => void
  onAdd: (name: string) => Promise<boolean>
}

export function ClassSwitcher({ classes, activeClassId, onSelect, onAdd }: ClassSwitcherProps) {
  const [adding, setAdding] = useState(false)
  const [className, setClassName] = useState('')
  const error = className ? classNameError(className) : ''

  async function submitClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (error || !className.trim()) return
    const saved = await onAdd(normalizeClassName(className))
    if (saved) {
      setClassName('')
      setAdding(false)
    }
  }

  return (
    <div className="class-switcher">
      <label className="class-select-wrap">
        <span className="status-dot" />
        <span className="sr-only">Aktive Klasse auswählen</span>
        <select value={activeClassId} onChange={(event) => onSelect(event.target.value)} aria-label="Aktive Klasse">
          {classes.length === 0 && <option value="4bwi">4bWI</option>}
          {classes.map((schoolClass) => (
            <option value={schoolClass.id} key={schoolClass.id}>{schoolClass.name}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="add-class-button"
        onClick={() => setAdding((current) => !current)}
        aria-expanded={adding}
      >
        <Icon name="plus" size={14} /> Klasse
      </button>
      {adding && (
        <form className="class-add-popover" onSubmit={(event) => void submitClass(event)}>
          <label htmlFor="new-class-name">Neue Klasse</label>
          <div className="class-add-row">
            <input
              id="new-class-name"
              autoFocus
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="z. B. 4bWI"
              maxLength={MAX_CLASS_NAME_LENGTH}
            />
            <button type="submit" disabled={!className.trim() || Boolean(error)} aria-label="Klasse speichern">
              <Icon name="check" size={16} />
            </button>
          </div>
          <span className={error ? 'class-help class-help-error' : 'class-help'}>
            {error || 'Klassen bleiben mit eigener Liste und Ziehung gespeichert.'}
          </span>
        </form>
      )}
    </div>
  )
}
