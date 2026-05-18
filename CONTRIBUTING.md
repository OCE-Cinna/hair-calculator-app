# Contributing

This is a student project and the codebase is currently maintained by one person. That said, it is open source under AGPLv3, so this document explains how the project is structured for anyone who wants to explore, fork, or contribute.

## Running the project locally

Prerequisites: Node.js v18 or higher.

```bash
git clone https://github.com/OCE-Cinna/hair-calculator-app.git
cd hair-calculator-app
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

You will also need the 3D models in `public/models/` and the scalp mask in `public/textures/`. These are not included in the repository due to file size. See the README for the full asset list.

## Branch structure

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, stable state |
| `debug` | Staging and integration testing |
| `feature/*` | In-progress feature work |

Changes should go into a `feature/` branch and merge into `debug` before `main`.

## Making changes

Keep changes small and focused. If a fix touches more than two or three files, it is worth a second look to see if it can be broken into smaller pieces.

Before submitting:
- Run `npm test` and make sure all tests pass
- Run `npm run lint` and fix any warnings
- Check the application in a browser at both desktop and mobile viewport sizes

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add thickness-density auto-scaling to raycasting hook
fix: correct head collision sphere not reading from DEV_CONFIG
chore: remove legacy OBJLoader.js
docs: update ARCHITECTURE.md with physics loop detail
```

Types used in this project: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

Do not include co-author lines, AI tool credits, or promotional text in commit messages.

## Code style

- React components are named exports (not default exports), except for `App.jsx`
- Zustand selectors use `useShallow` to prevent unnecessary re-renders
- Static configuration objects live in `CONFIG_MAPS` in `hairStore.js`, not inside components
- Three.js math objects (`Vector3`, `Matrix4`, `Quaternion`) are hoisted above loops to reduce garbage collection pressure
- Mobile guards check `navigator.userAgent` once with `useMemo`, not on every render

## Testing

Tests live alongside the files they cover. The test runner is Vitest with React Testing Library.

```bash
npm test          # run all tests once
npm run test:watch  # watch mode (if configured)
```

Three.js and R3F are mocked in the test environment. Do not import WebGL-dependent code directly in tests without a mock.

## License

By contributing, you agree that your contributions will be licensed under the same AGPLv3 license as the rest of the project.
