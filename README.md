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

## Supabase Setup

Bei einem Neuaufbau der Datenbank die SQL-Dateien in dieser Reihenfolge ausführen:

1. `supabase-sasis-hospitals.sql`
2. `supabase-schema.sql`
3. `supabase-link-beds-to-sasis.sql`
4. `supabase-room-bed-rules.sql`
5. `supabase-sasis-api-view.sql`
6. `supabase-reset-seed-beds-current-rules.sql`

## Wichtige Regeln

- Ein Spital wird über SASIS-Stammdaten ausgewählt.
- Betten sind über `hospital_id` mit den SASIS-Spitälern verknüpft.
- Pro Zimmer sind maximal 4 Betten erlaubt.
- Ein Isolationsbett steht immer alleine im Zimmer.
- `gender` erlaubt `unassigned`, `female`, `male`.
- `occupied` und `reserved` dürfen nicht `unassigned` sein.
- Freie Betten im selben Zimmer wie belegte/reservierte Betten verwenden denselben Gender-Status.

## Aktuelle Seed-Datei

Für Betten ist aktuell nur diese Seed-Datei relevant:

- `supabase-reset-seed-beds-current-rules.sql`

Ältere Seed- und Reparaturdateien wurden aus dem Repo entfernt.
