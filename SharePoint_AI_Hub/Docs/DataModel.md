# AI Hub — Datenmodell

Quelle der Wahrheit ist `Provisioning/Schema-AIHub.json`. Diese Datei beschreibt das Modell narrativ.

## Konventionen

- **Namensgebung**: `AIHub_<Bereich>` (kein Underscore in der Mitte – grenzt von Canvas-App-Listen `AI_HUB_*` ab).
- **`Language`** (Choice `de`/`en`, required) ist auf jeder Liste vorhanden.
- **`SortOrder`** (Number, default `100`) steuert die Anzeigereihenfolge im Frontend.
- **Choice-Spalten mit dem Suffix `Internal`** sind sprachneutral – der angezeigte Text kommt entweder aus `AIHub_I18nStrings` oder aus einer Begleitspalte (z. B. `LevelLabel` neben `LevelInternal`).
- **`Title`** wird stets befüllt (SP-Pflicht); für viele Listen ist es identisch mit dem fachlichen Titel, in `AIHub_I18nStrings` ist es der Key.

## Listen-Übersicht

| Liste | Items (Seed) | Zweck |
|---|---|---|
| AIHub_I18nStrings        | ~120 (DE+EN) | UI-Strings, Labels, Footer, Banner |
| AIHub_Navigation         | 14           | 7 Rail-Items × 2 Sprachen |
| AIHub_KPIs               | 12           | Home-Dashboard-KPIs |
| AIHub_News               | 8            | News-Feed Home |
| AIHub_PromptOfWeek       | 2            | Hero-Prompt |
| AIHub_AssessmentQuestions| 10           | 5 Fragen × 2 Sprachen |
| AIHub_LearningPaths      | 12           | 6 Lernpfade × 2 Sprachen |
| AIHub_UseCases           | 16           | 8 Use Cases × 2 Sprachen |
| AIHub_Prompts            | 8            | 4 Best-Practice-Prompts × 2 |
| AIHub_Resources          | 12           | 6 Resources × 2 Sprachen |
| AIHub_GovFAQ             | 8            | 4 FAQ × 2 Sprachen |
| AIHub_GovDocs            | 12           | 6 Doku-Links × 2 Sprachen |
| AIHub_GovRoadmap         | 8            | 4 EU-AI-Act-Meilensteine × 2 |
| AIHub_GovBlocks          | 6            | 3 Säulen × 2 Sprachen |
| AIHub_Events             | 10           | 5 Events × 2 Sprachen |
| AIHub_Risks              | 10           | 5 Risiken × 2 Sprachen |
| AIHub_Phases             | 6            | 3 Phasen × 2 Sprachen |
| AIHub_SteeringKPIs       | 12           | 6 Cockpit-KPIs × 2 |

## Spalten-Referenz (Auszug)

### AIHub_I18nStrings
| Feld | Typ | Anmerkung |
|---|---|---|
| Title | Text (SP-Pflicht) | identisch mit `Key` (für Listenanzeige) |
| Key | Text, indiziert | Lookup-Schlüssel im Frontend |
| Value | Note | Anzeigetext |
| Language | Choice de/en | required |

### AIHub_KPIs
| Feld | Typ | Anmerkung |
|---|---|---|
| KPIKey | Text | sprachneutraler Identifier |
| Value, Label, Target | Text | Anzeige |
| Color | Text (Hex/CSS) | z. B. `#6c8cff` |
| Progress | Number 0–100 | Balkenfüllung |
| AchievementPct | **Calculated** | `=IF(ISNUMBER(Progress),ROUND(Progress,0),0)` |
| SortOrder, Language | … | … |

### AIHub_UseCases
Sprachneutrale Choice-Werte:
- `StatusInternal`: `live | pilot | backlog`
- `PhaseInternal`: `quickwin | capability | strategic`
- `ImpactInternal`: `vhigh | high | medium`

`ROI` ist Text (kann `"€0.6M / yr"` oder `"tbd"` enthalten).

### AIHub_Phases
- `Budget` ist `Number` (in EUR) — clientseitig formatiert über `Intl.NumberFormat`.
- `ItemsJson` ist eine `Note`-Spalte mit JSON-Array (`["Item 1", "Item 2"]`) — JS parst beim Laden.

### AIHub_GovDocs
- `DocUrl` ist `URL` (Hyperlink-Feld) — Frontend nimmt `Url` aus dem ODATA-Object.

## Berechnete Spalten

| Liste | Spalte | Formel | Output |
|---|---|---|---|
| AIHub_KPIs | AchievementPct | `=IF(ISNUMBER(Progress),ROUND(Progress,0),0)` | Number |

> Self-Assessment wird **nicht** in SP berechnet — `score = sum(answers)/5`, Mapping zu Level passiert clientseitig in `aihub.js`. Begründung: Score ist nutzerspezifisch, flüchtig, keine Persistenz nötig.

## Document Libraries

| Bibliothek | Zweck | Felder |
|---|---|---|
| AIHubAssets | Hostet `AIHub-Content.html`, `aihub.css`, `aihub.js`, `aihub-data.js`, ASPX-Pages. Unterordner `AIHub/`. | – |
| AIHub_Policies | Governance-Dokumente (PDF/DOCX). | `Risk` (Choice high/medium/low), `ValidFrom` (DateTime), `Language` (Choice de/en) |
