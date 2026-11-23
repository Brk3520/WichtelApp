import { useState } from 'react'
import { Icon } from './Icon'
import type { Assignment, Student } from './types'

interface DrawPanelProps {
  students: Student[]
  assignments: Assignment[]
  selectedCount: number
  saving: boolean
  onDraw: () => Promise<void>
  onReset: () => Promise<void>
}

export function DrawPanel({
  students,
  assignments,
  selectedCount,
  saving,
  onDraw,
  onReset,
}: DrawPanelProps) {
  const [giverId, setGiverId] = useState('')
  const [revealedId, setRevealedId] = useState('')
  const hasDraw = assignments.length > 0
  const selectedStudent = students.find((student) => student.id === giverId)
  const receiverId = assignments.find((assignment) => assignment.giverId === giverId)?.receiverId
  const receiver = students.find((student) => student.id === receiverId)

  function updateGiver(value: string) {
    setGiverId(value)
    setRevealedId('')
  }

  return (
    <section className={`draw-panel ${hasDraw ? 'draw-complete' : ''}`}>
      <div className="draw-decoration" aria-hidden="true">
        <span className="draw-star star-a">✦</span><span className="draw-star star-b">✧</span>
        <span className="draw-tree">✳</span>
      </div>
      <div className="draw-copy">
        <p className="section-kicker">{hasDraw ? 'DIE WICHTELRUNDE IST BEREIT' : 'SCHRITT 03 · DER MAGISCHE MOMENT'}</p>
        <h2>{hasDraw ? 'Die Lose sind gezogen!' : 'Zeit für ein bisschen Wichtelmagie'}</h2>
        <p>
          {hasDraw
            ? 'Die Auslosung bleibt auch beim Klassenwechsel gespeichert. Wählt eine Person aus und verratet ihr ganz geheim, wen sie beschenkt.'
            : 'Niemand zieht sich selbst. Auch bei ungerader Teilnehmerzahl bekommt jede Person genau einen Wichtel.'}
        </p>
        {!hasDraw ? (
          <button type="button" className="draw-button" onClick={() => void onDraw()} disabled={saving || selectedCount < 2}>
            <Icon name="sparkles" size={18} />
            {saving ? 'Wird ausgelost …' : 'Wichtel auslosen'}
            {!saving && <Icon name="chevron" size={17} />}
          </button>
        ) : (
          <div className="reveal-controls">
            <label htmlFor="giver-select">Wähle, wem du das Geheimnis verrätst</label>
            <div className="reveal-select-row">
              <select id="giver-select" value={giverId} onChange={(event) => updateGiver(event.target.value)}>
                <option value="">Person auswählen …</option>
                {assignments.map(({ giverId: id }) => {
                  const student = students.find((item) => item.id === id)
                  return student ? <option value={id} key={id}>{student.name}</option> : null
                })}
              </select>
              <button
                type="button"
                className="reveal-button"
                disabled={!giverId || !receiver}
                onClick={() => setRevealedId(giverId)}
              >
                <Icon name="lock" size={16} /> Wichtel zeigen
              </button>
            </div>
            {revealedId === giverId && selectedStudent && receiver && (
              <div className="revealed-card" role="status">
                <span className="reveal-gift"><Icon name="gift" size={22} /></span>
                <span><small>PSSST, {selectedStudent.name.toLocaleUpperCase()}!</small><strong>Du beschenkst {receiver.name} 🎁</strong></span>
              </div>
            )}
          </div>
        )}
        {hasDraw && (
          <button type="button" className="reset-draw" onClick={() => void onReset()}>
            Ziehung zurücksetzen &amp; ändern <Icon name="arrow" size={14} />
          </button>
        )}
      </div>
      <div className="draw-side">
        <div className="draw-gift-illustration" aria-hidden="true">
          <span className="illustration-bow" />
          <span className="illustration-ribbon" />
          <span className="illustration-sparkle">✧</span>
        </div>
        <span className="draw-side-caption">{hasDraw ? `${assignments.length} geheime Wichtel-Zuordnungen` : 'Ein Geschenk. Ein Lächeln. Ganz viel Freude.'}</span>
      </div>
    </section>
  )
}
