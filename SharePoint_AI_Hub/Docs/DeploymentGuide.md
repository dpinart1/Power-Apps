# AI Hub — Deployment-Guide

## Voraussetzungen

| # | Anforderung | Wie prüfen |
|---|---|---|
| 1 | PnP.PowerShell v2+ | `Get-Module PnP.PowerShell -ListAvailable` |
| 2 | SharePoint-Site (Communication oder Team) | `Get-PnPSite` |
| 3 | Site-Collection-Admin oder Owner-Rechte | `Get-PnPSiteCollectionAdmin` |
| 4 | Für Variante A: NoScriptSite ist `false` | Tenant-Admin oder `Set-PnPSite -NoScriptSite:$false` (idempotent im Skript enthalten) |

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

## 1. Provisionierung

```powershell
cd SharePoint_AI_Hub/Provisioning
.\Provision-AIHub.ps1 -SiteUrl https://contoso.sharepoint.com/sites/AIHub
```

Das Skript ist **idempotent**:
- Existierende Listen/Spalten werden nicht erneut angelegt.
- Listen mit Items werden nicht erneut geseedet (Override mit `-ReseedData`).
- Asset-Uploads überschreiben vorhandene Dateien (Add-PnPFile mit gleichem Namen).

Optionale Schalter:
- `-SkipModernPage` — Variante C nicht erstellen.
- `-ReseedData` — bestehende Items vor dem Seed löschen.

## 2. Smoke-Test (PowerShell)

```powershell
Connect-PnPOnline -Url https://contoso.sharepoint.com/sites/AIHub -Interactive

# 18 Listen?
Get-PnPList | Where-Object Title -like 'AIHub_*' | Select-Object Title, ItemCount

# Beispielzählung pro Liste
Get-PnPListItem -List AIHub_KPIs   | Measure-Object   # ⇒ 12 (6 de + 6 en)
Get-PnPListItem -List AIHub_UseCases | Measure-Object # ⇒ 16 (8 de + 8 en)

# Asset-Folder
Get-PnPFolderItem -FolderSiteRelativeUrl 'AIHubAssets/AIHub'
```

## 3. Smoke-Test (Browser)

Öffne in einer Reihenfolge:

| Variante | URL |
|---|---|
| A | `https://contoso.sharepoint.com/sites/AIHub/SiteAssets/AIHub/AIHub.aspx` |
| B | `https://contoso.sharepoint.com/sites/AIHub/SiteAssets/AIHub/AIHub-WebPart.aspx` |
| C | `https://contoso.sharepoint.com/sites/AIHub/SitePages/AIHub.aspx` |

In den DevTools (F12 → Konsole) nach Boot:

```js
window.AIHub.data.de.kpis.length     // 6
window.AIHub.data.en.kpis.length     // 6
window.AIHub.state.lang              // "de"
window.AIHub.setLang("en")           // wechselt + persistiert in URL
window.AIHub.reload()                // Cache leeren, neu laden
```

Manuelle Tests:
- ✅ Sprachumschalter DE↔EN: alle Texte ändern sich.
- ✅ Self-Assessment: 5 Fragen → Auswertung mit Level-Label.
- ✅ Use-Case-Filter All/Live/Pilot/Backlog filtert korrekt — auch nach Sprachwechsel.
- ✅ Prompt-Kopier-Button kopiert in die Zwischenablage.
- ✅ Steering-Banner zeigt Vertraulichkeits-Hinweis.

## 4. Inhalte pflegen

Editoren bearbeiten Inhalte **direkt in den SP-Listen**:

- **Texte ändern** → `AIHub_I18nStrings` Item editieren (jeweils DE und EN).
- **Use Case hinzufügen** → in `AIHub_UseCases` neuen Item anlegen, Pflichtfelder: `Title`, `UCKey`, `StatusInternal`, `Language`.
- **Choice-Werte erweitern** → Schema-JSON aktualisieren, neue i18n-Keys anlegen, ggf. JS-Logik prüfen.

## 5. Rollback

```powershell
cd SharePoint_AI_Hub/Provisioning
.\Cleanup-AIHub.ps1 -SiteUrl https://contoso.sharepoint.com/sites/AIHub -Force
```

Löscht alle `AIHub_*`-Listen, beide Bibliotheken und `SitePages/AIHub.aspx`.

## 6. Fehlerbild-Liste

| Symptom | Ursache | Fix |
|---|---|---|
| Variante A 404/Skript-Block | NoScriptSite aktiv | `Set-PnPSite -NoScriptSite:$false` (Site-Coll-Admin) |
| Variante B leer | Modern Page geöffnet | nur in Classic-Pages, URL muss `.aspx` aus SiteAssets sein |
| Variante C Embed leer | Iframe-Quelle blockiert | im Tenant-Admin Center → Modern Pages → Allowed Embed Domains: eigene SPO-Domain hinzufügen |
| `Promise.all` mit 403 für eine Liste | Berechtigung fehlt für Editoren | Site-Mitglieder = Read auf `AIHub_*` ist Default; ggf. Vererbung wiederherstellen |
| Hyperlink wird nicht gerendert | DocUrl als Plaintext gespeichert | Format `Url, Anzeigetext` (Skript baut das automatisch) |
