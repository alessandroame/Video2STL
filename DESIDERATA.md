# DESIDERATA — Video2STL (RTX 3090 CAD Scanner Lab)

## 1. Backlog Attivo & Funzionalità Pianificate

| ID | Funzionalità | Stato | Note |
| :--- | :--- | :---: | :--- |
| **FEAT-002** | **Estrattore Frame Nitidi (Anti-Blur Laplacian)** | 🔴 Prioritario | Campionamento automatico da video con scarto fotogrammi mossi tramite varianza del Laplaciano. |
| **FEAT-003** | **Pipeline Calibrazione Ottica & Nuvole Punti (COLMAP/GLOMAP)** | ⚪ Pianificato | Automazione feature matching su CUDA e stima pose camera senza configurazione manuale. |
| **FEAT-004** | **Training 2DGS / Mesh Densa su RTX 3090** | ⚪ Pianificato | Profilo 24 GB VRAM per ricostruzione superfici chiuse (da qualsiasi sorgente video/foto). |
| **FEAT-005** | **Visualizzatore 3D Web Interattivo & Righello Metrico** | ⚪ Pianificato | Ispezione locale del modello con selezione di 2 punti di riferimento per calibrazione in `mm`. |
| **FEAT-006** | **Esportatore Mesh Decimata per Fusion 360 (`.OBJ`/`.STL`/`.3MF`)** | 🟢 Completato | Pianificatore [`cad-export-planner.js`](file:///C:/github/Video2STL/src/core/cad-export-planner.js) con decimazione a `10k`/`80k` facce e scala millimetrica. |

---

## 2. Funzionalità Completate & Consolidate

| ID | Funzionalità | Stato | Note |
| :--- | :--- | :---: | :--- |
| **FEAT-001** | **Scaffolding Progetto & Pianificatore Hardware/Ottico Core** | 🟢 Completato | Architettura headless `src/core/`, supporto sorgenti video universali e profili Laptop + 3090. |
| **FEAT-006** | **Pianificatore Esportazione CAD Fusion 360 & Scala Metrica** | 🟢 Completato | Calcolo fattore di scala in `mm` e budget poligonale per `Convert Mesh` B-Rep e `Section Sketch`. |
