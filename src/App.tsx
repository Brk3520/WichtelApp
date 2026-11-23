import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../utils/firebase'
import { ClassSwitcher } from './components/ClassSwitcher'
import { DrawPanel } from './components/DrawPanel'
import { Icon } from './components/Icon'
import { ParticipantSelector } from './components/ParticipantSelector'
import { StudentManager } from './components/StudentManager'
import type { Assignment, ImportSummary, SchoolClass, Student, StudentName } from './components/types'
import {
  classNameError,
  namePartError,
  normalizeClassName,
  normalizeStudentName,
  studentFullName,
} from './components/validation'
import './App.css'

const classesCollection = collection(db, 'classes')
const studentsCollection = collection(db, 'students')
const drawsCollection = collection(db, 'draws')
const currentYear = new Date().getFullYear()
const defaultClassId = '4bwi'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.'
}

function getSavedClassId() {
  try {
    return window.localStorage.getItem('wichtel-active-class') || defaultClassId
  } catch {
    return defaultClassId
  }
}

function getStudent(studentId: string, data: Record<string, unknown>): Student {
  const legacyName = typeof data.name === 'string' ? data.name.trim() : ''
  const legacyParts = legacyName.split(/\s+/)
  const firstName = String(data.firstName ?? legacyParts[0] ?? '')
  const lastName = String(data.lastName ?? legacyParts.slice(1).join(' '))
  const name = String(data.fullName ?? [firstName, lastName].filter(Boolean).join(' '))
  return { id: studentId, firstName, lastName, name }
}

function App() {
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [activeClassId, setActiveClassId] = useState(getSavedClassId)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function changeActiveClass(classId: string) {
    try {
      window.localStorage.setItem('wichtel-active-class', classId)
    } catch {
      setError('Die zuletzt ausgewählte Klasse kann in diesem Browser nicht gespeichert werden.')
    }
    setStudents([])
    setSelectedIds([])
    setAssignments([])
    setLoading(true)
    setActiveClassId(classId)
  }

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function subscribeToClasses() {
      try {
        const defaultClass = doc(db, 'classes', defaultClassId)
        const defaultSnapshot = await getDoc(defaultClass)
        if (!defaultSnapshot.exists()) {
          await setDoc(defaultClass, { name: '4bWI', createdAt: serverTimestamp() })
        }
        if (cancelled) return

        unsubscribe = onSnapshot(
          classesCollection,
          (snapshot) => {
            const nextClasses = snapshot.docs
              .map((classDoc) => ({
                id: classDoc.id,
                name: String(classDoc.data().name ?? ''),
              }))
              .filter((schoolClass) => schoolClass.name)
              .sort((first, second) => first.name.localeCompare(second.name, 'de'))
            setClasses(nextClasses)
            let savedClassId = defaultClassId
            try {
              savedClassId = window.localStorage.getItem('wichtel-active-class') || defaultClassId
            } catch {
              savedClassId = defaultClassId
            }
            if (!nextClasses.some((schoolClass) => schoolClass.id === savedClassId)) {
              changeActiveClass(defaultClassId)
            }
          },
          (snapshotError) => setError(`Klassen konnten nicht geladen werden: ${snapshotError.message}`),
        )
      } catch (classError) {
        if (!cancelled) setError(`Die Klasse 4bWI konnte nicht geladen werden: ${getErrorMessage(classError)}`)
      }
    }

    void subscribeToClasses()
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    const unsubscribeStudents = onSnapshot(
      studentsCollection,
      (snapshot) => {
        const classStudents = snapshot.docs
          .filter((studentDoc) => {
            const classId = studentDoc.data().classId
            return (typeof classId === 'string' ? classId : defaultClassId) === activeClassId
          })
          .map((studentDoc) => getStudent(studentDoc.id, studentDoc.data()))
        setStudents(classStudents)
        setLoading(false)
      },
      (snapshotError) => {
        setError(`Schüler:innen konnten nicht geladen werden: ${snapshotError.message}`)
        setLoading(false)
      },
    )
    const drawDocumentId = activeClassId === defaultClassId
      ? 'class-4a-current'
      : `${activeClassId}-current`
    const unsubscribeDraw = onSnapshot(
      doc(drawsCollection, drawDocumentId),
      (snapshot) => {
        const savedAssignments = snapshot.data()?.assignments
        if (Array.isArray(savedAssignments)) {
          const validAssignments = savedAssignments.filter(
            (item): item is Assignment =>
              typeof item?.giverId === 'string' && typeof item?.receiverId === 'string',
          )
          setAssignments(validAssignments)
          setSelectedIds(validAssignments.map((item) => item.giverId))
        } else {
          setAssignments([])
        }
      },
      (snapshotError) => {
        setError(`Die Wichtelrunde konnte nicht geladen werden: ${snapshotError.message}`)
      },
    )

    return () => {
      unsubscribeStudents()
      unsubscribeDraw()
    }
  }, [activeClassId])

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.includes(student.id)),
    [students, selectedIds],
  )
  const activeClassName = classes.find((schoolClass) => schoolClass.id === activeClassId)?.name ?? '4bWI'
  const activeDrawDocumentId = activeClassId === defaultClassId
    ? 'class-4a-current'
    : `${activeClassId}-current`
  const activeDrawDocument = doc(drawsCollection, activeDrawDocumentId)

  async function addClass(name: string) {
    setError('')
    const classError = classNameError(name)
    if (classError) {
      setError(classError)
      return false
    }
    const normalizedName = normalizeClassName(name)
    if (classes.some((schoolClass) => schoolClass.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      setError(`Die Klasse ${normalizedName} ist bereits angelegt.`)
      return false
    }

    try {
      const newClass = doc(classesCollection)
      await setDoc(newClass, { name: normalizedName, createdAt: serverTimestamp() })
      changeActiveClass(newClass.id)
      return true
    } catch (classError) {
      setError(`Klasse konnte nicht gespeichert werden: ${getErrorMessage(classError)}`)
      return false
    }
  }

  async function addStudent(person: StudentName): Promise<boolean> {
    setError('')
    const normalized = normalizeStudentName(person)
    const invalidPart = namePartError(normalized.firstName) || namePartError(normalized.lastName)
    if (invalidPart) {
      setError(`Ungültiger Name: ${invalidPart}`)
      return false
    }
    const fullName = studentFullName(normalized)
    if (students.some((student) => student.name.toLocaleLowerCase() === fullName.toLocaleLowerCase())) {
      setError(`${fullName} ist in der Klasse ${activeClassName} bereits eingetragen.`)
      return false
    }

    try {
      const newStudent = await addDoc(studentsCollection, {
        ...normalized,
        fullName,
        classId: activeClassId,
        createdAt: serverTimestamp(),
      })
      if (assignments.length === 0) setSelectedIds((current) => [...current, newStudent.id])
      return true
    } catch (addError) {
      setError(`Schüler:in konnte nicht gespeichert werden: ${getErrorMessage(addError)}`)
      return false
    }
  }

  async function addStudents(people: Array<StudentName & { line: number }>): Promise<ImportSummary | null> {
    setError('')
    const existingNames = new Set(students.map((student) => student.name.toLocaleLowerCase()))
    const duplicates: string[] = []
    const invalid: string[] = []
    const uniquePeople: StudentName[] = []

    for (const person of people) {
      const normalized = normalizeStudentName(person)
      const invalidPart = namePartError(normalized.firstName) || namePartError(normalized.lastName)
      if (invalidPart) {
        invalid.push(`Zeile ${person.line}: ${invalidPart}`)
        continue
      }
      const fullName = studentFullName(normalized)
      const normalizedKey = fullName.toLocaleLowerCase()
      if (existingNames.has(normalizedKey)) {
        duplicates.push(`Zeile ${person.line}: ${fullName}`)
        continue
      }
      existingNames.add(normalizedKey)
      uniquePeople.push(normalized)
    }

    if (uniquePeople.length === 0) return { added: 0, duplicates, invalid }

    try {
      const batch = writeBatch(db)
      const newIds: string[] = []
      for (const person of uniquePeople) {
        const studentDocument = doc(studentsCollection)
        newIds.push(studentDocument.id)
        const fullName = studentFullName(person)
        batch.set(studentDocument, {
          ...person,
          fullName,
          classId: activeClassId,
          createdAt: serverTimestamp(),
        })
      }
      await batch.commit()
      if (assignments.length === 0) {
        setSelectedIds((current) => [...new Set([...current, ...newIds])])
      }
      return { added: uniquePeople.length, duplicates, invalid }
    } catch (importError) {
      setError(`Die Namensliste konnte nicht gespeichert werden: ${getErrorMessage(importError)}`)
      return null
    }
  }

  async function removeStudent(student: Student) {
    setError('')
    try {
      await deleteDoc(doc(studentsCollection, student.id))
      setSelectedIds((current) => current.filter((id) => id !== student.id))
    } catch (deleteError) {
      setError(`Schüler:in konnte nicht gelöscht werden: ${getErrorMessage(deleteError)}`)
    }
  }

  function toggleStudent(studentId: string) {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    )
  }

  async function drawNames() {
    if (selectedStudents.length < 2) {
      setError('Für eine Wichtelrunde müssen mindestens zwei Schüler:innen teilnehmen.')
      return
    }

    setError('')
    setSaving(true)
    const shuffled = [...selectedStudents]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }
    const offset = 1 + Math.floor(Math.random() * (shuffled.length - 1))
    const nextAssignments = shuffled.map((student, index) => ({
      giverId: student.id,
      receiverId: shuffled[(index + offset) % shuffled.length].id,
    }))

    try {
      await setDoc(activeDrawDocument, {
        classId: activeClassId,
        assignments: nextAssignments,
        createdAt: serverTimestamp(),
      })
      setAssignments(nextAssignments)
    } catch (drawError) {
      setError(`Die Auslosung konnte nicht gespeichert werden: ${getErrorMessage(drawError)}`)
    } finally {
      setSaving(false)
    }
  }

  async function resetDraw() {
    if (!window.confirm('Ziehung wirklich zurücksetzen? Die Teilnehmenden bleiben ausgewählt; du kannst die Runde danach anpassen und neu auslosen.')) {
      return
    }
    setError('')
    try {
      await deleteDoc(activeDrawDocument)
      setAssignments([])
    } catch (resetError) {
      setError(`Die Wichtelrunde konnte nicht zurückgesetzt werden: ${getErrorMessage(resetError)}`)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Wichtelwerkstatt Startseite">
          <span className="brand-mark"><Icon name="gift" size={23} /></span>
          <span className="brand-name">wichtel<span>werkstatt</span></span>
        </a>
        <div className="topbar-right">
          <ClassSwitcher
            classes={classes}
            activeClassId={activeClassId}
            onSelect={changeActiveClass}
            onAdd={addClass}
          />
          <span className="topbar-divider" />
          <span className="season-label">Weihnachten {currentYear}</span>
          <span className="avatar" aria-label="Klassenleitung">W</span>
        </div>
      </header>

      <main>
        <section className="welcome">
          <div className="welcome-copy">
            <p className="eyebrow"><Icon name="sparkles" size={15} /> DIE SCHÖNSTE ZEIT DES JAHRES</p>
            <h1>Ein bisschen Magie.<br /><span>Ein Wichtel für alle.</span></h1>
            <p className="welcome-description">
              Verwandle eure Klasse in eine kleine Weihnachtswerkstatt – Namen sammeln,
              Wichtel ziehen und Freude verschenken.
            </p>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <span className="art-snowflake snowflake-one">✳</span>
            <span className="art-snowflake snowflake-two">✳</span>
            <span className="art-sparkle sparkle-one">✦</span>
            <span className="art-sparkle sparkle-two">✧</span>
            <div className="gift-box"><span className="gift-ribbon" /><span className="gift-bow" /></div>
            <div className="class-stamp"><span>WICHTEL-POST</span><strong>{activeClassName}</strong><i>FÜR DICH &amp; DEINE KLASSE</i></div>
            <span className="art-shadow" />
          </div>
          <div className="welcome-bottom">
            <span><Icon name="snowflake" size={16} /> Das Wichtelgeheimnis bleibt gewahrt</span>
            <span className="welcome-date">Frohe Vorfreude!</span>
          </div>
        </section>

        <section className="stat-grid" aria-label="Wichtelrunde auf einen Blick">
          <div className="stat-card">
            <span className="stat-icon green"><Icon name="users" /></span>
            <div><strong>{students.length}</strong><span>Schüler:innen</span></div>
            <span className="stat-note">in {activeClassName}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon red"><Icon name="gift" /></span>
            <div><strong>{selectedIds.length}</strong><span>machen mit</span></div>
            <span className="stat-note">ausgewählt</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon gold"><Icon name="sparkles" /></span>
            <div><strong>{assignments.length > 0 ? 'Bereit!' : 'Noch offen'}</strong><span>Wichtelziehung</span></div>
            <span className={`draw-status ${assignments.length > 0 ? 'is-ready' : ''}`}>
              <span className="status-dot" /> {assignments.length > 0 ? 'Ausgelost' : 'Nicht ausgelost'}
            </span>
          </div>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Hinweis schließen">×</button>
          </div>
        )}

        <div className="workspace-grid">
          <StudentManager
            key={activeClassId}
            students={students}
            loading={loading}
            selectedIds={selectedIds}
            drawExists={assignments.length > 0}
            onAdd={addStudent}
            onAddMany={addStudents}
            onRemove={removeStudent}
          />
          <ParticipantSelector
            students={students}
            selectedIds={selectedIds}
            drawExists={assignments.length > 0}
            onToggle={toggleStudent}
            onSelectAll={() => setSelectedIds(students.map((student) => student.id))}
            onClear={() => setSelectedIds([])}
          />
        </div>

        <DrawPanel
          key={activeClassId}
          students={students}
          assignments={assignments}
          selectedCount={selectedIds.length}
          saving={saving}
          onDraw={drawNames}
          onReset={resetDraw}
        />
      </main>
      <footer className="footer">
        <span>Mit <span className="footer-heart">♥</span> für eine zauberhafte Klassengemeinschaft</span>
        <span>Wichtelwerkstatt <span className="footer-year">· {currentYear}</span></span>
      </footer>
    </div>
  )
}

export default App
