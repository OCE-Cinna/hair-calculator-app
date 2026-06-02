# Firebase Hosting Setup — Hair Calculator App (PAH Visualizer)

This document outlines the steps taken to set up Firebase Hosting for the PAH Visualizer web application.

---

## Overview

- **Live URL:** https://cinna-pah.web.app
- **Firebase Project ID:** `hair-calculator-cinna`
- **Firebase Project Name:** Hair Calculator App
- **Framework:** React + Vite

---

## Prerequisites

- Node.js and npm installed
- A Firebase account (logged in)
- GitHub repository: `OCE-Cinna/hair-calculator-app`

---

## Steps Taken

### 1. Install Firebase SDK

The Firebase SDK was installed as a local dependency in the project:

```bash
npm install firebase
```

### 2. Install Firebase CLI

The Firebase CLI tools were installed globally to enable project management and deployments from the terminal:

```bash
npm install -g firebase-tools
```

### 3. Log In to Firebase

Authenticated the Firebase CLI with the Google account:

```bash
firebase login
```

The CLI confirmed: **Already logged in**

### 4. Create the Firebase Project

Instead of using the interactive `firebase init` flow, the project was created directly via the CLI:

```bash
firebase projects:create hair-calculator-cinna --display-name "Hair Calculator App"
```

Output confirmed:
- **Project ID:** `hair-calculator-cinna`
- **Console:** https://console.firebase.google.com/project/hair-calculator-cinna/overview

### 5. Create a Custom Hosting Site

A custom hosting site was created to use the URL `cinna-pah.web.app` instead of the default project URL:

```bash
firebase hosting:sites:create cinna-pah --project hair-calculator-cinna
```

Output confirmed:
- **Site ID:** `cinna-pah`
- **Site URL:** https://cinna-pah.web.app

### 6. Configure `firebase.json`

A `firebase.json` file was created in the project root to configure Firebase Hosting:

```json
{
  "hosting": {
    "site": "cinna-pah",
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Key configuration decisions:
- **`site`** — targets the custom `cinna-pah` hosting site.
- **`public: "dist"`** — Vite outputs the production build to the `dist/` folder.
- **`rewrites`** — all routes redirect to `index.html`, which is required for React single-page app (SPA) routing to work correctly.

### 7. Configure `.firebaserc`

A `.firebaserc` file was created to associate this project directory with the Firebase project:

```json
{
  "projects": {
    "default": "hair-calculator-cinna"
  }
}
```

---

## Deployment

To deploy the app, run the following commands:

```bash
# 1. Build the production bundle
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy
```

The app will be live at: **https://cinna-pah.web.app**

---

## Re-deploying After Changes

Any time you make changes to the app, just repeat the deploy steps:

```bash
npm run build
firebase deploy
```

---

## Useful Firebase CLI Commands

| Command | Description |
|---|---|
| `firebase login` | Log in to your Firebase account |
| `firebase projects:list` | List all your Firebase projects |
| `firebase hosting:sites:list` | List all hosting sites in a project |
| `firebase deploy` | Deploy to Firebase Hosting |
| `firebase deploy --only hosting` | Deploy only the hosting (skips other services) |
| `firebase serve` | Preview the app locally using Firebase |

---

## Troubleshooting

### PowerShell Execution Policy Error
If you see `npm.ps1 cannot be loaded because running scripts is disabled on this system`, run npm commands using `cmd.exe` instead:
```bash
cmd.exe /c npm install firebase
```

### Project Not Found Error
If `firebase deploy` returns `Failed to get Firebase project`, make sure:
1. The project ID in `.firebaserc` matches exactly what was created in the Firebase console.
2. You are logged in with the correct account (`firebase login`).

### Wrong URL After Deploy
If the app deploys to the wrong URL, verify that `firebase.json` has the `"site": "cinna-pah"` field set correctly.
