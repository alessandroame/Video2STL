# MEMORY — Vincoli Architetturali & Lezioni Apprese

## 1. Topologia Hardware & Gestione VRAM
- **Topologia Ibrida Laptop (RTX 500 Ada 4GB) vs Desktop (RTX 3090 24GB)**:
  - *Insidia*: La sessione corrente gira su un laptop con `RTX 500 Ada Generation (4094 MiB VRAM)`, mentre la `RTX 3090 (24576 MiB VRAM)` risiede sul PC fisso.
  - *Regola*: Il planner calcola automaticamente il profilo esecutivo in base alla VRAM rilevata (`lite-4gb` per pre-processing/preview locale fino a `720p/60 frame`, `full-24gb` sul nodo 3090 per training 4K/300 frame).
- **Power Limit Doppia RTX 3090**:
  - *Insidia*: Due RTX 3090 a default (`2x 350W`) generano picchi transitori `> 900W` che mandano in blocco alimentatori standard.
  - *Regola*: Quando si abilita la seconda 3090, applicare `nvidia-smi -pl 240` su entrambe le GPU prima di lanciare workload CUDA prolungati.

## 2. Acquisizione Video & Qualità Fotogrammetrica
- **Motion Blur & Riflessi Speculari**:
  - *Insidia*: I frame mossi estratti da qualsiasi sorgente video (smartphone, action cam, drone, mirrorless) degradano la convergenza di COLMAP e creano artefatti superficiali.
  - *Regola*: Filtrare sempre i frame tramite punteggio di nitidezza (Laplacian variance) scegliendo il frame più nitido all'interno di ogni finestra temporale.
- **Limiti Poligonali e Scala Metrica in Autodesk Fusion 360**:
  - *Insidia*: Il Gaussian Splatting classico genera nuvole volumetriche (`.splat`) non importabili in Fusion 360, mentre una mesh fotogrammetrica grezza (`> 1M` triangoli, priva di scala reale) blocca il comando `Convert Mesh` di Fusion 360.
  - *Regola*: Per Fusion 360 generare sempre una mesh superficiale chiusa (`.obj`/`.stl`/`.3mf`), calibrata in `mm` su una misura reale nota e decimata a `~10.000` facce per conversione diretta in solido B-Rep o `~80.000` facce per ricalco sezioni (`Create Mesh Section Sketch`).

## 3. Purezza Headless Core & Governance
- **Isolamento Headless (`src/core/`)**:
  - *Insidia*: Accoppiare calcoli geometrici o pianificazione VRAM al DOM o a eseguibili di sistema impedisce il test deterministico.
  - *Regola*: `src/core/` deve restare 100% puro JavaScript ESM senza riferimenti a `window`, `document`, `localStorage` o invocazioni dirette di sottoprocessi.
