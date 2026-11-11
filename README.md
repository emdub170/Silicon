# Silicon

Personal food log, installable on Android as a web app.

- Scan a barcode (Open Food Facts lookup), quick-add from My foods, or enter macros manually
- Tracks calories, protein, fat, carbs, alcohol
- 7-day view with CSV export and a copyable summary
- Data stays on the phone (localStorage); use Save backup in the Week screen

Run the logic tests: `node test.js`

When `index.html` changes, bump `VERSION` in `sw.js` so installed phones pick up the new build.
