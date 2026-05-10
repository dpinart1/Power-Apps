# AI Hub — Architektur

## Überblick

Eine Single-Page-App, die zur Laufzeit aus 18 SharePoint-Listen ihre Inhalte zusammenträgt und in drei austauschbaren Hosting-Varianten ausgeliefert wird.

```
                  ┌──────────────────────────────────────┐
                  │  Browser                              │
                  │  ┌─────────────────────────────────┐  │
                  │  │ AIHub-Content.html (oder ASPX)  │  │
                  │  │  ├─ aihub.css                   │  │
                  │  │  ├─ aihub-data.js  ──┐          │  │
                  │  │  └─ aihub.js   ──────┴── REST   │  │
                  │  └────────┬────────────────────────┘  │
                  └───────────┼──────────────────────────┘
                              │   (Promise.all over 36 GETs)
                              ▼
   ┌────────────────────────────────────────────────────┐
   │ SharePoint Online — Web                            │
   │  /_api/web/lists/getbytitle('AIHub_X')/items?...   │
   │                                                     │
   │  ┌──────────────────────────────────────────────┐  │
   │  │ 18 Listen (AIHub_*) + 2 Bibliotheken         │  │
   │  │  Language=de | Language=en                    │  │
   │  └──────────────────────────────────────────────┘  │
   └────────────────────────────────────────────────────┘
```

## Komponenten

### Frontend
| Datei | Verantwortlichkeit |
|---|---|
| `Pages/AIHub-Content.html` | Markup-Skelett (alle Sektionen mit IDs) |
| `Assets/aihub.css` | Komplettes Styling, Dark Theme, Responsive Grid |
| `Assets/aihub-data.js` | List-Mapping (Title → Felder → In-Memory-Form) |
| `Assets/aihub.js` | REST-Loader, i18n-Helper, Renderer, Boot-Logik |

### Backend (SharePoint)
| Komponente | Zweck |
|---|---|
| 18 Custom Lists `AIHub_*` | Inhaltsspeicher, je Item DE oder EN |
| `AIHubAssets` (Library) | Hostet HTML/CSS/JS/ASPX |
| `AIHub_Policies` (Library) | PDF/DOCX Governance-Dokumente |

## Hosting-Varianten — Vergleich

| Variante | Datei | URL | NoScriptSite | Empfehlung |
|---|---|---|---|---|
| A | `AIHub.aspx` | `/SiteAssets/AIHub/AIHub.aspx` | muss `false` sein | Klassisches Look-and-feel, kein Embed-Overhead |
| B | `AIHub-WebPart.aspx` | `/SiteAssets/AIHub/AIHub-WebPart.aspx` | muss `false` sein | für Tenants, die noch Classic-Web-Part-Pages standardisiert haben |
| C | Modern Page (Embed) | `/SitePages/AIHub.aspx` | egal | **empfohlen** — kein Tenant-Admin nötig, navigiert wie eine moderne SP-Seite |

> Variante C wird durch das Provisioning-Skript dynamisch erstellt (`Add-PnPPage` + `Add-PnPPageWebPart -DefaultWebPartType Embed`). Die Datei `Pages/AIHub-Modern.aspx` enthält nur die Anleitung als Kommentar — sie wird **nicht** uploaded.

## REST-Flow

1. Beim Boot lädt `aihub.js` über `Promise.all` für **beide Sprachen** alle 18 Listen (=36 GETs).
2. URL-Pattern:
   ```
   {webUrl}/_api/web/lists/getbytitle('AIHub_KPIs')/items
       ?$select=Title,KPIKey,Value,...
       &$filter=Language eq 'de'
       &$orderby=SortOrder
       &$top=5000
   ```
   Header: `Accept: application/json;odata=nometadata`. Cookie-Auth (same-origin).
3. Mapping: `aihub-data.js` definiert pro Liste eine `map(item)`-Funktion → einheitliche In-Memory-Struktur.
4. **Caching**: 5 Min in `sessionStorage` unter Key `aihub.cache.v1`. Manuell invalidieren via `window.AIHub.reload()`.

## Sprachstrategie

- **Spalten-Variante** statt MUI: jede Zeile hat `Language` (Choice de/en).
- Alle UI-Strings (Buttons, Labels, Footer, Banner) in `AIHub_I18nStrings` als Key/Value.
- Choice-Spalten mit Suffix `Internal` sind sprachneutral (siehe `Docs/ChoiceValues.md`).
- Frontend zeigt Daten der aktiven Sprache (`state.lang`); URL führt `?lang=de|en`.

## Self-Assessment

```js
let total = answers.reduce((s, ai, i) => s + questions[i].opts[ai].score, 0)
let avg = total / 5

avg < 1 → "starter"
avg < 2 → "pathseeker"
avg < 3 → "transformer"
sonst   → "highperformer"
```

Levels werden über i18n-Keys `assessment.level.<id>` und `assessment.advice.<id>` lokalisiert.

## Sicherheit

- Nur **Read**-REST (GET) — kein RequestDigest erforderlich.
- Cookie-Auth: alle Calls laufen unter dem aktuellen User; SP enforced ItemLevelPermissions automatisch.
- Steering-Sektion: aktuell nur **clientseitiger Banner** + visuelles Schloss in der Navigation. Für echte Zugriffsbeschränkung Listenberechtigungen auf `AIHub_Risks`, `AIHub_Phases`, `AIHub_SteeringKPIs` einschränken (z. B. nur SteeringGroup-Mitglieder).

## Erweiterungspunkte

| Anforderung | Wo |
|---|---|
| Neuer Bereich (z. B. „AI Champions") | Liste in `Schema-AIHub.json`, Mapping in `aihub-data.js`, Render-Funktion in `aihub.js`, neuer Nav-Eintrag in `AIHub_Navigation`. |
| Weitere Sprache (z. B. `fr`) | `Language`-Choice erweitern (Schema), `SUPPORTED_LANGS` in `aihub.js`, Seeds anlegen. |
| Echte Auth-Gates für Steering | SP-Listenberechtigungen + REST-Fehler werden vom JS toleriert (leere Section). |
| Telemetry | `loadAllData()` um `performance.mark`/`Application Insights` erweitern. |
