# Wetterstation

Neerslagradar voor Nederland met actuele weersgegevens, buienverwachting en 14-daagse verwachting.

## Server starten

```bash
npm install
npm run dev        # development server (http://localhost:5173)
```

Productiebuild:

```bash
npm run build      # build naar dist/
npm run preview    # serveer de build lokaal
```

Lint:

```bash
npm run lint
```

## Templates

React + Vite template met HMR en Oxlint-regels.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
