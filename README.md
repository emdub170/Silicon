# Silicon

Personal food log, installable on Android as a web app.

- Scan a barcode (Open Food Facts lookup), quick-add from My foods, or enter macros manually
- Tracks calories, protein, fat, carbs, alcohol
- 7-day view with CSV export and a copyable summary
- Data stays on the phone (localStorage); use Save backup in the Week screen

Run the logic tests: `node test.js`

On every release, bump `APP_VERSION` in `index.html` (shown in the header) and `VERSION` in `sw.js`.

## Logging from a Claude chat (link format)

Claude resolves a described meal into macros and replies with a link. Tapping it opens the app with a confirm screen.

    https://emdub170.github.io/Silicon/#add=<items>&date=YYYY-MM-DD

- `<items>`: `name;protein_g;fat_g;carbs_g;alcohol_g;calories`, items separated by `|`, the whole value URL-encoded
- `calories` is optional (blank = 4P + 4C + 9F + 7A); `date` is optional (default = the day open in the app)
- Names must not contain `;` or `|`
- Entries are logged with source `estimate`
