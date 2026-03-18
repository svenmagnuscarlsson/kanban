# MACA Kanban Board

MACA Kanban är en modern, snabb och helt fristående frontend-applikation för att visuellt hantera projekt, arbetsflöden och personliga uppgifter. Den är byggd utan tunga ramverk—istället används enbart ren **HTML5**, **Vanilla CSS** och **Vanilla JavaScript**, allt med inbyggd beständig datalagring lokalt i din webbläsare.

## 🚀 Funktioner

* **Drag & Drop (Desktop & Mobil):** Flytta kort smidigt mellan dina kolumner. Det inkluderar särskilt anpassad "touch-support" logik vilket gör att dra-och-släpp fungerar instinktivt och felfritt även på smartphones och surfplattor.
* **Lokal Datalagring (IndexedDB):** All din data sparas säkert, asynkront och sömlöst lokalt i webbläsarens inbyggda `IndexedDB`. Ingenting förloras vid uppdatering av sidan – ingen konfiguration av externa databaser krävs.
* **Modern & Responsiv Premium-Design:** Ett snyggt, levande och skräddarsytt gränssnitt med mjuka "box-shadows", rundade hörn och det stilrena typsnittet `Inter` (Google Fonts). 
  * På mindre skärmar (som mobiler) anpassas layouten automatiskt till en app-liknande horisontell vy (*snap-scroll*) som gör den extremt smidig att navigera på.
* **Automatisk Färgkodning för Taggar:** Skriv in en tagg på ett nytt kort (t.ex. `Frontend` eller `Design`) och applikationen beräknar och tilldelar automatiskt en konsekvent, vacker färg till just den specifika tagg-kategorin.
* **Raderingsmodal:** Ett inbyggt och specialdesignat bekräftelsefönster vid radering av uppgifter hindrar dig från att av misstag rensa skapade kort.

## 📂 Struktur

Applikationens fil- och mapparkitektur är extremt ren för att vara så underhållsvänlig som möjligt:

```text
/
├── index.html        # Applikationens struktur, kolumner & form-modaler
├── tasks/
│   └── todo.md       # (Utveckling) Projektets todolista
├── README.md         # Dokumentation
└── assets/           
    ├── css/
    │   └── style.css # All styling, CSS-variabler & responsiv design
    └── js/
        └── app.js    # All logik: IndexedDB, Drag & Drop-hantering, DOM
```

## 🛠️ Kom igång 

Eftersom applikationen enbart bygger på direkta, standardiserade webbteknologier och en klient-lokal databas, krävs inga ramverk eller komplexa byggsteg som Webpack eller liknande.

1. Klona eller navigera in i projektet i filutforskaren.
2. Beroende på din webbläsares säkerhetsinställningar (då IndexedDB kan begränsas via vanliga `file://` anrop på hårddisken), är det rekommenderat att använda en snabb lokal server:
   - Med tillägget **Live Server** i VS Code (högerklicka `index.html` > *Open with Live Server*).
   - Eller vi terminal i mappen: `npx http-server` alternativt `python -m http.server 8080`.
3. Ett fönster öppnar din nya tavla. Börja strukturera!