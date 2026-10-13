# COS — Calculation of Salary

A detailed monthly budget calculator for salary, taxes, rent, bills, food, transportation, other expenses and savings.

**Calculator:** https://yazanfattal.github.io/COS/

## Features

- Monthly salary before tax or take-home pay
- Taxes as a monthly amount or a percentage
- Rent / mortgage, utilities, mobile services, internet and insurance
- Food, transportation, entertainment and debt payments
- Additional expenses with custom names
- Monthly savings goal and annual savings plan
- Itemized budget breakdown and remaining balance or shortfall
- Currency selection, example budget and copyable summary
- Responsive desktop and mobile layouts

All calculations run in the visitor's browser. No backend, dependencies, API keys or build step are required. Entries are not transmitted to a server or retained after reloading the page. The example amounts are illustrative. Taxes use the visitor's own figures, without an automatic country-specific tax calculation.

## Edit and publish

The site is published with GitHub Pages from the `main` branch's `/docs` folder. Updates to that folder are published automatically.

- `docs/index.html` — page structure
- `docs/styles.css` — responsive layout
- `docs/calculator.js` — budget calculations and interactions
- `docs/.nojekyll` — serve the static files directly

Open `docs/index.html` to use the calculator locally. All asset links are relative so they also work under the `/COS/` repository path.

## Hosting

This GitHub Pages copy is public and does not require ChatGPT sign-in. The existing private COS Site is a separate deployment.

[GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
