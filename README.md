# Video2STL

Pipeline di ricostruzione 3D fotogrammetrica e generazione Mesh CAD (`.STL`, `.OBJ`, `.3MF`) calibrate in millimetri per **Autodesk Fusion 360**, ottimizzata per **NVIDIA RTX 3090 (24 GB / 48 GB VRAM)** a partire da qualsiasi sorgente video o sequenza fotografica.

## Avvio Rapido sul PC con RTX 3090

```bash
git pull
npm test
npm run probe
```

## Struttura del Progetto
- `src/core/scan-planner.js`: Pianificatore hardware e ottico adattivo (`preview-4gb`, `single-3090-24gb`, `dual-3090-48gb`).
- `src/core/frame-selector.js`: Filtro nitidezza fotogrammi (Laplacian variance) per scarto automatico del motion blur.
- `src/core/cad-export-planner.js`: Pianificatore decimazione poligonale (`10k` facce B-Rep / `80k` facce Section Sketch) e calibrazione metrica (`mm`) per Fusion 360.
- `src/cli/probe-hardware.js`: Sonda `nvidia-smi` per verifica VRAM e generazione profilo esecutivo.
- `workspace_scans/`: Cartella di deposito per i file video (`.mp4`, `.mov`, `.mkv`) o sequenze di immagini.
