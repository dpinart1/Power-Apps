# AI Hub — Choice-Werte-Glossar

> ⚠️ Die internen Choice-Werte sind **sprachneutral und versionsstabil**. Sie werden vom JavaScript für Vergleiche genutzt (z. B. `if (uc.st === 'live')`). Bitte **nicht umbenennen**. Anzeige-Labels kommen aus `AIHub_I18nStrings`.

## AIHub_UseCases

| Spalte | Werte (intern) | Anzeige (DE) | Anzeige (EN) |
|---|---|---|---|
| StatusInternal | `live` | Live | Live |
|                | `pilot` | Pilot | Pilot |
|                | `backlog` | Backlog | Backlog |
| PhaseInternal  | `quickwin` | Quick Win | Quick Win |
|                | `capability` | Capability Builder | Capability Builder |
|                | `strategic` | Strategic Bet | Strategic Bet |
| ImpactInternal | `vhigh` | Sehr hoch | Very high |
|                | `high` | Hoch | High |
|                | `medium` | Mittel | Medium |

## AIHub_LearningPaths

| Spalte | Werte (intern) | Anzeige siehe `LevelLabel`-Spalte |
|---|---|---|
| LevelInternal | `beginner` |
|               | `intermediate` |
|               | `advanced` |
|               | `leader` |

## AIHub_Events

| Spalte | Werte (intern) | i18n-Key |
|---|---|---|
| TypeInternal | `workshop` | `event.type.workshop` |
|              | `training` | `event.type.training` |
|              | `webinar` | `event.type.webinar` |
|              | `meetup` | `event.type.meetup` |
|              | `summit` | `event.type.summit` |

## AIHub_Risks

| Spalte | Werte (intern) | i18n-Key |
|---|---|---|
| LevelInternal | `high` | `risks.level.high` |
|               | `medium` | `risks.level.medium` |
|               | `low` | `risks.level.low` |

## AIHub_GovRoadmap

| Spalte | Werte (intern) | i18n-Key |
|---|---|---|
| StatusInternal | `done` | `roadmap.status.done` |
|                | `inprogress` | `roadmap.status.inprogress` |
|                | `planned` | `roadmap.status.planned` |

## AIHub_Phases

| Spalte | Werte (intern) | i18n-Key |
|---|---|---|
| StatusInternal | `active` | `phases.status.active` |
|                | `planned` | `phases.status.planned` |
|                | `open` | `phases.status.open` |
|                | `done` | `phases.status.done` |

## AIHub_Policies (Bibliothek)

| Spalte | Werte (intern) |
|---|---|
| Risk | `high` / `medium` / `low` |
| Language | `de` / `en` |

## Sprache (alle Listen)

| Wert (intern) | Anzeige |
|---|---|
| `de` | Deutsch |
| `en` | English |

---

### Wenn ein neuer Choice-Wert hinzugefügt werden muss

1. Wert zu `Provisioning/Schema-AIHub.json` ergänzen.
2. Migration auf existierender Site: `Get-PnPField` + `Set-PnPField -Values @{Choices=...}` oder neu provisionieren.
3. **Frontend**: i18n-Eintrag in `AIHub_I18nStrings` mit Schlüssel-Pattern `<bereich>.<spalte>.<wert>` anlegen (DE + EN).
4. Optional Logik in `Assets/aihub.js` ergänzen (z. B. neuer CSS-Modifier).
