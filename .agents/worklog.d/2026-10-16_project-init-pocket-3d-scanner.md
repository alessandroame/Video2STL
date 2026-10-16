# ADR 2026-10-16 — Inizializzazione Progetto Pocket 3D Scanner

## Contesto
Avvio di un laboratorio sperimentale non-informatico basato su ricostruzione 3D (Fotogrammetria / 3D Gaussian Splatting) a partire da brevi video smartphone. L'ispezione hardware (`nvidia-smi`) ha rilevato che l'ambiente corrente gira su un portatile con `NVIDIA RTX 500 Ada Generation Laptop GPU (4094 MiB)`, mentre l'utente dispone di un PC fisso con `RTX 3090 (24 GB)` montata e una seconda `RTX 3090` in armadio.

## Decisioni
1. **Struttura Progetto Dedicata**: Creazione del workspace autonomo `c:\Users\aame\Downloads\pocket-3d-scanner` conforme agli standard Antigravity (persistenza cognitiva 3+1 file, architettura Headless Core in `src/core/`, suite di test di governance in `tests/`).
2. **Pianificatore Adattivo Multi-GPU (`src/core/scan-planner.js`)**: Implementazione del motore matematico puro che dimensiona automaticamente l'estrazione dei fotogrammi, la risoluzione e gli step di addestramento 3D in base alla VRAM disponibile (`4 GB` per test rapidi su portatile, `24 GB` per ricostruzione ad alta fedeltà su RTX 3090, `48 GB` per doppia 3090).
3. **Selettore Anti-Blur a Finestra Mobile (`src/core/frame-selector.js`)**: Algoritmo deterministico per selezionare solo i fotogrammi più nitidi da una sequenza video, scartando i frame mossi prima della ricostruzione 3D.

## Impatto
- Il progetto è immediatamente eseguibile e testabile sia sul portatile attuale sia spostando/condividendo la cartella sul PC con la RTX 3090.
- Copertura di test unitari e statici al 100% verificabile con `npm test`.
