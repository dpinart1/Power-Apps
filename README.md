# PS AI HUB Journey

> Eine moderne, neo-futuristische Power Apps Canvas App für ganzheitliches **KI-Enablement** im Unternehmen — von Prompting über EU AI Act bis Frontier LLMs.

---

## Was ist drin?

| Bereich | Inhalt |
|---|---|
| 🎯 **Lernreisen** | Kuratierte Journeys: Prompting Mastery, EU AI Act, Frontier Models 2026, RAG & Agentic AI, Governance, Copilot Power-User, Reifegrade, Responsible AI, Vector DBs, Branchen-Use-Cases |
| 🎬 **Medien-Vielfalt** | Video (YouTube/Stream), Podcast (Audio-Player), PDF (eingebettet), PowerPoint (Office Online), Articles (Web), Interaktive Quizzes |
| 🏆 **Gamification** | XP-Punkte, Streaks, Achievements/Badges, Fortschrittsbalken pro Journey |
| 🎨 **Neo-Futuristic Design** | Dark-Canvas, Neon-Akzente (Cyan/Purple/Pink/Lime/Amber), Orbital-Glows, Glassmorphism |
| 🔍 **Suche & Filter** | Globale Suche über Journeys & Module + Filter nach Level (Beginner/Intermediate/Advanced) |
| 👤 **Profil** | Avatar, Stats, Einstellungen (Sprache, Notifications), Achievements |

---

## Projektstruktur

```
Power-Apps/
├── PS_AI_HUB_Journey/
│   ├── CanvasManifest.json          # App-Metadaten für `pac canvas pack`
│   ├── Other/Theme.json             # Designsystem-Tokens (Single Source of Truth)
│   └── Src/
│       ├── App.fx.yaml              # OnStart: Theme + Demo-Collections + Navigate(Splash)
│       └── Screens/
│           ├── SplashScreen.fx.yaml
│           ├── HomeScreen.fx.yaml
│           ├── JourneysScreen.fx.yaml
│           ├── JourneyDetailScreen.fx.yaml
│           ├── MediaPlayerScreen.fx.yaml
│           ├── CategoriesScreen.fx.yaml
│           ├── SearchScreen.fx.yaml
│           ├── ProgressScreen.fx.yaml
│           └── ProfileScreen.fx.yaml
└── data/
    ├── SharePoint_List_Schema.json  # Schemata für 8 SP-Listen + Power-Automate-Flows
    └── sample_journeys.json         # Beispiel-Datensätze
```

---

## Setup in 4 Schritten

### 1. Power Platform CLI installieren
```bash
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
pac install latest
```

### 2. Quellcode → `.msapp` packen
```bash
pac canvas pack \
  --sources ./PS_AI_HUB_Journey \
  --msapp   ./PS_AI_HUB_Journey.msapp
```

### 3. SharePoint-Listen anlegen
- Lege im Ziel-SharePoint-Site **8 Listen** gemäß `data/SharePoint_List_Schema.json` an.
- Importiere `data/sample_journeys.json` als Startdatenset (z. B. via Power Automate oder PnP PowerShell).
- Optional: Tausche die SharePoint-Anbindung gegen **Dataverse** für Enterprise-Skalierung.

### 4. App importieren & verbinden
1. **Power Apps Studio** → *Apps* → *Import canvas app* → wähle `PS_AI_HUB_Journey.msapp`.
2. Datenquellen reconnect: 8 SharePoint-Listen + `Office365Users` (+ optional `Office365Outlook`, `MicrosoftTeams`).
3. App veröffentlichen & teilen.
4. **Optional:** Die Demo-`ClearCollect`-Aufrufe in `App.OnStart` entfernen, sobald deine Listen befüllt sind — dann lädt die App live aus SharePoint.

---

## Live-Demo ohne SharePoint
Die App läuft **out-of-the-box** mit Demo-Daten (`ClearCollect` in `App.OnStart`). Du kannst sie direkt nach dem Pack-Schritt starten — perfekt für POC, Showcase oder Workshop.

---

## Power-Fx Highlights

```powerfx
// Filter Journeys nach Kategorie + Level (live in JourneysScreen.JourneysGrid.Items)
Filter(
    colJourneys,
    (IsBlank(selectedCategory)    Or category = selectedCategory.id) &&
    (IsBlank(selectedLevelFilter) Or level    = selectedLevelFilter)
)

// Universeller Media Player — adaptive Visibility pro Modultyp
Visible: =selectedModule.mediaType = "Video"   // Video iframe
Visible: =selectedModule.mediaType = "Podcast" // Audio Control
Visible: =selectedModule.mediaType = "PDF"     // PDF iframe
Visible: =selectedModule.mediaType = "PowerPoint" // Office embed
Visible: =selectedModule.mediaType = "Quiz"    // Quiz Cards

// Modul abschließen → SharePoint patchen + XP gutschreiben
Patch(
    AI_HUB_UserProgress,
    Defaults(AI_HUB_UserProgress),
    {
        User: { Claims: "i:0#.f|membership|" & User().Email },
        Module: LookUp(AI_HUB_Modules, ModuleId = selectedModule.id),
        Status: "completed",
        CompletedOn: Now(),
        Score: 100
    }
);
Notify("✓ Modul abgeschlossen — +50 XP!", NotificationType.Success)
```

---

## Roadmap (nach v1)

- ✨ **AI-Coach**: GPT-5/Claude Opus integration via Power Automate für personalisierte Lern-Empfehlungen
- 📱 **Mobile-Layout**: Responsive Variante für Phone-Form-Factor
- 🌐 **Mehrsprachigkeit**: i18n-Resource-File pro Sprache
- 🎓 **Zertifikate**: Auto-Generierung als PDF nach Journey-Abschluss
- 📊 **Manager-Dashboard**: Power BI Embed für Team-Übersicht
- 🤖 **Adaptive Pfade**: Modul-Reihenfolge basierend auf User-Performance dynamisch anpassen

---

**Built with ❤ on Power Apps & Power Fx.**
