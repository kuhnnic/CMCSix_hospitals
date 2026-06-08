# CMCSix Hospitals

Demo-App zur Spitalbettenverwaltung mit Supabase als Datenquelle.

## App

Die App läuft über GitHub Pages:

https://kuhnnic.github.io/CMCSix_hospitals/

Aktuelle produktive Frontend-Dateien:

- `index.html`
- `styles.css`
- `supabase-config.js`
- `assets/main-db-loader.js`
- `assets/main-db.js`

Die App zeigt keine lokalen Demo-Betten mehr an. Betten und SASIS-Stammdaten werden aus Supabase gelesen. Änderungen an Status und Geschlecht werden direkt in Supabase gespeichert.

## Datenmodell

Die wichtigsten Entitäten sind jetzt:

- `sasis_hospitals`: Spital-Stammdaten
- `stations`: Stationen als eigene Identität
- `beds`: Betten

Beziehungen:

- Ein Spital hat mehrere Stationen.
- Eine Station gehört genau zu einem Spital.
- Eine Station ist genau einem Fachgebiet zugeteilt.
- Eine Station hat mehrere Betten.
- Ein Bett referenziert seine Station über `station_id`.

Das bisherige Textfeld `beds.station` bleibt als Rückwärtskompatibilität und Anzeige-Fallback bestehen, wird aber per DB-Trigger aus `stations.name` gepflegt.

## Supabase Setup

Bei einem Neuaufbau der Datenbank die SQL-Dateien in dieser Reihenfolge ausführen:

1. `supabase-sasis-hospitals.sql`
2. `supabase-schema.sql`
3. `supabase-link-beds-to-sasis.sql`
4. `supabase-room-bed-rules.sql`
5. `supabase-sasis-api-view.sql`
6. `supabase-stations-design.sql`
7. `supabase-reset-seed-beds-current-rules.sql`

## Wichtige Regeln

- Ein Spital wird über SASIS-Stammdaten ausgewählt.
- Stationen sind über `hospital_id` mit den SASIS-Spitälern verknüpft.
- Stationen sind jeweils einem Fachgebiet zugeteilt.
- Betten sind über `station_id` mit einer Station verknüpft.
- Pro Zimmer sind maximal 4 Betten erlaubt.
- Ein Isolationsbett steht immer alleine im Zimmer.
- `gender` erlaubt `unassigned`, `female`, `male`.
- `occupied` und `reserved` dürfen nicht `unassigned` sein.
- Freie Betten im selben Zimmer wie belegte/reservierte Betten verwenden denselben Gender-Status.

## Aktuelle Seed-Datei

Für Betten und Stationen ist aktuell diese Seed-Datei relevant:

- `supabase-reset-seed-beds-current-rules.sql`

Die Stationsstruktur selbst wird mit dieser Datei ergänzt:

- `supabase-stations-design.sql`

Ältere Seed- und Reparaturdateien wurden aus dem Repo entfernt.
