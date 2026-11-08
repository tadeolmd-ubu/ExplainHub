# loteria-mexicana

Loteria Mexicana is a React Native/Expo mobile app that recreates the traditional Mexican bingo game with the 54 classic cards. It shuffles the deck, calls cards automatically or on demand, tracks the called-card history, and persists the current game on the device. The interface is written in TypeScript with Expo Router, and Python helper scripts generate the icons, sounds, and card artwork.


## Overview

| Technology |
|------------|
| TypeScript |
| JavaScript |
| Node.js |
| Python |

| Technology | File |
|------------|------|

## Project Structure

```
loteria-mexicana/
├── .gitignore
├── AppLoteria
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── README.md
│   ├── app
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── app.json
│   ├── assets
│   │   ├── cartas
│   │   │   ├── 01-gallo.jpg
│   │   │   ├── 02-diablito.jpg
│   │   │   ├── 03-dama.jpg
│   │   │   ├── 04-catrin.jpg
│   │   │   ├── 05-paraguas.jpg
│   │   │   ├── 06-sirena.jpg
│   │   │   ├── 07-escalera.jpg
│   │   │   ├── 08-botella.jpg
│   │   │   ├── 09-barril.jpg
│   │   │   ├── 10-arbol.jpg
│   │   │   ├── 11-melon.jpg
│   │   │   ├── 12-valiente.jpg
│   │   │   ├── 13-gorrito.jpg
│   │   │   ├── 14-muerte.jpg
│   │   │   ├── 15-pera.jpg
│   │   │   ├── 16-bandera.jpg
│   │   │   ├── 17-bandolon.jpg
│   │   │   ├── 18-violoncello.jpg
│   │   │   ├── 19-garza.jpg
│   │   │   ├── 20-pajaro.jpg
│   │   │   ├── 21-mano.jpg
│   │   │   ├── 22-bota.jpg
│   │   │   ├── 23-luna.jpg
│   │   │   ├── 24-cotorro.jpg
│   │   │   ├── 25-borracho.jpg
│   │   │   ├── 26-negrito.jpg
│   │   │   ├── 27-corazon.jpg
│   │   │   ├── 28-sandia.jpg
│   │   │   ├── 29-tambor.jpg
│   │   │   ├── 30-camaron.jpg
│   │   │   ├── 31-jaras.jpg
│   │   │   ├── 32-musico.jpg
│   │   │   ├── 33-arana.jpg
│   │   │   ├── 34-soldado.jpg
│   │   │   ├── 35-estrella.jpg
│   │   │   ├── 36-cazo.jpg
│   │   │   ├── 37-mundo.jpg
│   │   │   ├── 38-apache.jpg
│   │   │   ├── 39-nopal.jpg
│   │   │   ├── 40-alacran.jpg
│   │   │   ├── 41-rosa.jpg
│   │   │   ├── 42-calavera.jpg
│   │   │   ├── 43-campana.jpg
│   │   │   ├── 44-cantarito.jpg
│   │   │   ├── 45-venado.jpg
│   │   │   ├── 46-sol.jpg
│   │   │   ├── 47-corona.jpg
│   │   │   ├── 48-chalupa.jpg
│   │   │   ├── 49-pino.jpg
│   │   │   ├── 50-pescado.jpg
│   │   │   ├── 51-palma.jpg
│   │   │   ├── 52-maceta.jpg
│   │   │   ├── 53-arpa.jpg
│   │   │   └── 54-rana.jpg
│   │   ├── images
│   │   │   ├── android-icon-background.png
│   │   │   ├── android-icon-foreground.png
│   │   │   ├── android-icon-monochrome.png
│   │   │   ├── favicon.png
│   │   │   ├── icon.png
│   │   │   ├── primer-carta.png
│   │   │   └── splash-icon.png
│   │   └── sonidos
│   │       ├── barajar.wav
│   │       ├── carta.wav
│   │       ├── pausa.wav
│   │       └── reanudar.wav
│   ├── eslint.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── scripts
│   │   ├── generar_iconos.py
│   │   ├── generar_sonidos.py
│   │   └── importar_cartas.py
│   ├── src
│   │   ├── components
│   │   │   ├── barra-progreso.tsx
│   │   │   ├── control-velocidad.tsx
│   │   │   ├── historial.tsx
│   │   │   └── tarjeta-grande.tsx
│   │   ├── data
│   │   │   └── cartas.ts
│   │   ├── hooks
│   │   │   └── use-game.ts
│   │   ├── storage
│   │   │   └── storage.ts
│   │   ├── theme.ts
│   │   └── utils
│   │       ├── sonidos.ts
│   │       └── voz.ts
│   └── tsconfig.json
├── INSTALAR.md
├── Loteria-Mexicana-v1.3.6.apk
├── README.md
├── mockup-loteria-v2.png
└── primer-carta.png
```

## Modules

| Module | Files | Description |
| ------ | ------ | ------ |
| [AppLoteria](docs/AppLoteria.md) | 1 | ESLint configuration for the Expo project root |
| [app](docs/app.md) | 2 | Navigation layout and main game screen |
| [scripts](docs/scripts.md) | 3 | Icon, sound, and card-image generation scripts |
| [src](docs/src.md) | 1 | Shared colour palette for the app |
| [components](docs/components.md) | 4 | Progress bar, speed control, history, and large card |
| [data](docs/data.md) | 1 | Catalog of the 54 Lotería cards |
| [hooks](docs/hooks.md) | 1 | Game state, deck shuffling, and persistence |
| [storage](docs/storage.md) | 1 | Saved-game persistence with AsyncStorage |
| [utils](docs/utils.md) | 2 | Sound-effect and Spanish speech helpers |
