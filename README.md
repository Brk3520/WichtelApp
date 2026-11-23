# Wichtelwerkstatt

Eine weihnachtliche, mobiloptimierte React-App für Klassen-Wichtelrunden. Klassen, Schüler:innen und Auslosungen werden in Firebase gespeichert. Jede Person schenkt genau einmal und bekommt genau einmal ein Geschenk – auch bei einer ungeraden Teilnehmerzahl.

## Starten

```sh
npm install
npm run dev
```

Für den Produktionsbuild:

```sh
npm run build
```

## Firebase

Die Firebase-Projektkonfiguration befindet sich in `utils/firebase.ts`. Cloud Firestore muss aktiviert sein. Die App verwendet:

- `classes`: Klassenname und Erstellungsdatum; `4bWI` wird beim ersten Start angelegt
- `students`: Vorname, Nachname, Anzeigename und Klassenzugehörigkeit
- `draws`: eine aktuelle Auslosung je Klasse mit den Feldern `classId`, `assignments` und `createdAt`

Legacy-Schülerdokumente ohne `classId` werden weiterhin der Startklasse `4bWI` zugeordnet. Neue Klassen erhalten jeweils eine eigene Namensliste und Ziehung; ein Klassenwechsel entfernt keine Daten. Die aktuelle Ziehung kann zurückgesetzt werden, um Teilnehmende zu ändern und neu auszulosen.

Vor- und Nachnamen sind getrennte Felder: erlaubt sind Buchstaben, Leerzeichen, Bindestriche und Apostrophe; jede Namenshälfte darf höchstens 32 Zeichen haben. Der Anfangsbuchstabe wird automatisch großgeschrieben. Für den Mehrfachimport gilt eine Person pro Zeile: `Vorname Nachname` oder `Vorname;Nachname`.

Die App benötigt Firestore-Lese- und Schreibzugriff. Da derzeit keine Anmeldung verwendet wird, sollten für echte Schülerdaten keine öffentlichen Lese-/Schreibregeln eingesetzt werden; ergänze vor einem produktiven Einsatz eine geeignete Authentifizierung und sichere Regeln.

## Aufbau

- `src/components/`: Schülerverwaltung, Klassenwechsel, Teilnehmendenauswahl, Auslosung und Validierung
- `src/App.tsx`: Firebase-Abonnements und Ablauf der Wichtelrunde
- `utils/firebase.ts`: Firebase- und Firestore-Initialisierung
