# SharePoint AI Hub

Komplette, listengetriebene AI-Hub-Single-Page-App für SharePoint Online — modern + classic, deutsch + englisch.

## Was steckt drin

- **Drei Hosting-Varianten** der gleichen App:
  - `Pages/AIHub.aspx` — Standalone Classic-Style ASPX (SiteAssets-Hosting).
  - `Pages/AIHub-WebPart.aspx` — Classic Web Part Page mit Content Editor Web Part.
  - `Pages/AIHub-Modern.aspx` — Anleitungs-Stub; die echte Modern-Page wird vom Provisionierungs-Skript per `Add-PnPPage` mit Embed-WebPart erstellt (empfohlen für Tenants mit aktivem NoScriptSite).
- **`Pages/AIHub-Content.html` + `Assets/aihub.css`/`aihub.js`/`aihub-data.js`** — die Single-Page-App lädt sämtliche Inhalte zur Laufzeit aus 18 SharePoint-Listen über REST.
- **18 SP-Listen + 2 Bibliotheken** (alle mit `AIHub_`-Präfix), inkl. einer `Language`-Spalte (DE/EN) pro Item.
- **PnP.PowerShell-Provisionierung** (`Provisioning/Provision-AIHub.ps1`) — idempotent: legt Listen, Spalten, Default-Werte und Seed-Daten an, lädt Assets hoch.
- **Seed-Daten in DE + EN** für jede Liste unter `Provisioning/SeedData/`.

## Quick Start

```powershell
# einmalig
Install-Module PnP.PowerShell -Scope CurrentUser

# Provisionierung
cd SharePoint_AI_Hub/Provisioning
.\Provision-AIHub.ps1 -SiteUrl https://<tenant>.sharepoint.com/sites/<site>

# danach erreichbar:
# Variante A:  /SiteAssets/AIHub/AIHub.aspx
# Variante B:  /SiteAssets/AIHub/AIHub-WebPart.aspx
# Variante C:  /SitePages/AIHub.aspx     (modern, empfohlen)
```

Mit `-SkipModernPage` lässt sich Variante C überspringen, mit `-ReseedData` werden bestehende Seed-Items gelöscht und neu angelegt.

## Architektur in Kürze

1. **Frontend (`Pages/AIHub-Content.html`)** lädt nur Markup + Skripte.
2. **`aihub-data.js`** definiert Mapping-Konfiguration (Listenname → In-Memory-Key, Field-Map).
3. **`aihub.js`** macht beim Boot ~36 REST-GETs (18 Listen × 2 Sprachen) parallel, baut `window.AIHub.data.de` und `window.AIHub.data.en` auf, cached für 5 Min in `sessionStorage` und rendert die Seite.
4. **Sprache** liegt in `Language`-Choice-Spalte (`de`/`en`) jedes Items; UI-Strings landen in `AIHub_I18nStrings` als Key/Value-Paare.
5. **Sprachneutrale Choice-Werte** (Status `live|pilot|backlog`, Phase `quickwin|capability|strategic`, Impact `vhigh|high|medium`, …) — JS-Vergleiche bleiben sprachunabhängig stabil.
6. **Self-Assessment** ist clientseitig: Score = Summe / 5 → `< 1` Starter, `< 2` Pathseeker, `< 3` Transformer, sonst High-Performer.

## Verzeichnisstruktur

```text
SharePoint_AI_Hub/
├── README.md                              # dieses File
├── Pages/
│   ├── AIHub.aspx                         # Variante A (Classic Standalone)
│   ├── AIHub-WebPart.aspx                 # Variante B (Classic Web Part Page)
│   ├── AIHub-Modern.aspx                  # Variante C (Anleitung; provisioniert dynamisch)
│   └── AIHub-Content.html                 # die zur Laufzeit listengetriebene HTML
├── Assets/
│   ├── aihub.css                          # Styles
│   ├── aihub-data.js                      # Listen/Feld-Konfiguration
│   └── aihub.js                           # Renderer + REST-Loader + i18n
├── Provisioning/
│   ├── Provision-AIHub.ps1                # PnP-Master-Skript
│   ├── Cleanup-AIHub.ps1                  # Rollback
│   ├── Schema-AIHub.json                  # Listen-/Spalten-/Choice-Schema
│   └── SeedData/                          # 18 JSON-Files mit Demo-Inhalten DE+EN
└── Docs/
    ├── DataModel.md                       # Spalten-Referenz pro Liste
    ├── ChoiceValues.md                    # Glossar sprachneutraler Werte
    ├── DeploymentGuide.md                 # Schritt-für-Schritt-Deployment
    └── Architecture.md                    # Architektur, REST-Flow, Hosting-Vergleich
```

## Verifikation

```powershell
# 36 REST-Endpunkte sind nach Provisionierung erreichbar:
Get-PnPList | Where-Object Title -like 'AIHub_*' | Measure-Object  # ⇒ 18

Get-PnPListItem -List AIHub_KPIs   | Measure-Object                 # ⇒ 12 (6 de + 6 en)
Get-PnPListItem -List AIHub_UseCases | Measure-Object              # ⇒ 16 (8 de + 8 en)
```

Im Browser (DevTools-Konsole nach Aufruf der Page):

- Network: alle REST-Calls 200, je < 500 ms.
- `window.AIHub.data.de.kpis.length === 6`.
- Sprach-Switch DE↔EN aktualisiert alle Texte, URL erhält `?lang=en`.
- Self-Assessment liefert für `0,0,0,0,0` ⇒ Starter, `3,3,3,3,3` ⇒ High-Performer.
- Use-Case-Filter (`live`/`pilot`/`backlog`) wirkt unabhängig von der Sprache.

## Bekannte Limits & Risiken

| # | Risiko                                      | Mitigation                                          |
|---|---------------------------------------------|------------------------------------------------------|
| 1 | NoScriptSite blockiert Variante A           | Variante C (Modern Embed) als Default empfehlen.    |
| 2 | ContentEditor läuft nicht in Modern Pages   | Variante B nur als Classic-Page nutzen.             |
| 3 | Editoren benennen Choice-Werte um           | Spalten als „intern" dokumentiert, siehe `Docs/ChoiceValues.md`. |
| 4 | Hyperlink-Felder (`DocUrl`) brauchen `"url, text"`-Format | Provision-Skript baut das automatisch zusammen. |

Siehe `Docs/Architecture.md` für Tiefgang.
