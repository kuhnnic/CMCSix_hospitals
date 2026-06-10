# CMCSix Bed Availability Dashboard

Separate Demo-App für die zentrale, aggregierte Anzeige der Spitalbettenverfügbarkeit.

## Zweck

Die App liest die Bettenverfügbarkeit aus derselben Supabase-Datenquelle wie die App `Spitalbettenverwaltung` (`beds`), zeigt aber keine Einzelbetten an. Die Übersicht aggregiert pro Spital und zeigt nur Spitäler mit freien Betten (`status = free`).

## MVP-Funktionen

- Mobile- und Desktop-optimierte Dashboard-Oberfläche
- Standardfilter: Region, Spital, Fachrichtung, Telemetriebedarf, Geschlecht und Suche
- Aggregierte Anzeige freier Betten pro Spital
- Anzeige von Fachgebieten mit freien Betten und Gültigkeitsregion
- Auto-Refresh alle 5 Minuten plus Supabase-Realtime-Subscription, sofern aktiv
- Stammdatenverwaltung mit schreibgeschützten SASIS-Feldern
- Ergänzbare Felder: `contact_info` und `remarks`
- Lokaler Fallback für Demo-/RLS-Situationen

## Datenquellen

- `beds`: operative Bettenverfügbarkeit aus der bestehenden Spitalbettenverwaltung
- `hospital_profiles`: optionale Ergänzungstabelle für Kontaktinformation und Bemerkungen
- SASIS-Stammdaten sind statisch eingebettet und werden nicht überschrieben

## Optionales Supabase-Profil-Schema

Siehe `supabase-schema.sql`. Die Dashboard-App funktioniert auch ohne diese Tabelle; Kontaktinformation und Bemerkungen werden dann lokal im Browser gespeichert.
