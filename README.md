# Lab Equipment Inventory

A single-page web application (SPA) for automating the tracking and management of laboratory equipment. Built for purely local execution (in the browser) with GitHub Pages support.

## Features
- **Equipment tracking**: Add, edit, and delete equipment (with strict validation).
- **Status workflow**: Manage states (`Available`, `Issued`, `Maintenance`).
- **History Logs**: Automatic auditing of all operations.
- **Real-time Analytics**: Dashboard with item counts across statuses.
- **Persistence**: Data automatically saved to browser's `LocalStorage`.
- **Static Deployment**: Easily deployable via GitHub Pages with no backend required.

## Stack
- HTML5
- Vanilla JS (ES Modules)
- Vanilla CSS (Modern aesthetic, variables, glassmorphism)
- LocalStorage

## How to Run Locally
1. Clone the repository.
2. Open `index.html` directly in your browser.
3. Click "Скинути демо-дані" (Reset Demo Data) to populate the inventory with sample equipment.

## Deployment
This application is configured for deployment via GitHub Pages using GitHub Actions. Upon pushing to the `main` or `master` branch, the workflow located in `.github/workflows/deploy.yml` will automatically build and publish the site.

## Limitations
* Note that because data is stored in `LocalStorage`, clearing browser history or cache will wipe the inventory data. There is no central server synchronization in this purely static version.
