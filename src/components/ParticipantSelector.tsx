import { Icon } from './Icon'
import type { Student } from './types'

interface ParticipantSelectorProps {
  students: Student[]
  selectedIds: string[]
  drawExists: boolean
  onToggle: (studentId: string) => void
  onSelectAll: () => void
  onClear: () => void
}

export function ParticipantSelector({
  students,
  selectedIds,
  drawExists,
  onToggle,
  onSelectAll,
  onClear,
}: ParticipantSelectorProps) {
  const canEdit = !drawExists

  return (
    <section className="panel participants-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">SCHRITT 02</p>
          <h2>Wer wichtelt mit?</h2>
        </div>
        <span className="participant-counter"><strong>{selectedIds.length}</strong> / {students.length}</span>
      </div>
      <p className="panel-description">
        {canEdit
          ? 'Jede Person schenkt genau einmal und bekommt einmal ein Geschenk. Auch bei ungerader Zahl geht die Ziehung auf.'
          : 'Die Runde ist ausgelost. Setze sie zurück, wenn du Teilnehmende ändern und neu ziehen möchtest.'}
      </p>
      <div className="selection-actions">
        <span>TEILNEHMER:INNEN</span>
        <div>
          <button type="button" onClick={onSelectAll} disabled={!canEdit || students.length === 0}>Alle</button>
          <span className="action-divider">·</span>
          <button type="button" onClick={onClear} disabled={!canEdit || selectedIds.length === 0}>Keine</button>
        </div>
      </div>
      <div className="participant-list">
        {students.length === 0 ? (
          <div className="empty-state participant-empty">Füge zuerst Schüler:innen in deine Klasse ein.</div>
        ) : [...students].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((student, index) => {
          const checked = selectedIds.includes(student.id)
          return (
            <label className={`participant-row ${checked ? 'is-selected' : ''} ${!canEdit ? 'is-locked' : ''}`} key={student.id}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!canEdit}
                onChange={() => onToggle(student.id)}
              />
              <span className={`student-avatar avatar-color-${index % 5}`}>{student.name.trim().charAt(0).toLocaleUpperCase()}</span>
              <span className="student-name">{student.name}</span>
              <span className="custom-checkbox"><Icon name="check" size={13} /></span>
            </label>
          )
        })}
      </div>
      <div className="selection-summary">
        <span className="summary-snow"><Icon name="snowflake" size={16} /></span>
        <span>
          {selectedIds.length < 2
            ? 'Für die Ziehung brauchst du mindestens 2 Wichtel.'
            : `${selectedIds.length} Wichtel sind startklar!`}
        </span>
      </div>
    </section>
  )
}
