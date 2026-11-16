# Silicon

Personal food log, installable on Android as a web app.

- Scan a barcode (Open Food Facts lookup), quick-add from My foods, or enter macros manually
- Tracks calories, protein, fat, carbs, alcohol
- Day view grouped into eight 3-hour blocks (collapsible); tap an entry to move it to another block
- Queue: prepped food waits unchecked on today or a future day and only counts once checked off
- Copy a block or a whole past day to today
- 7-day view with CSV export and a copyable summary
- Staples: a usual meal (named set of foods) whose amounts can be adjusted per day before logging; amounts are in grams when the food's serving label or name states a gram weight, otherwise in servings
- Data stays on the phone (localStorage); use Save backup in the Week screen

Run the logic tests: `node test.js`

On every release, bump `APP_VERSION` in `index.html` (shown in the header) and `VERSION` in `sw.js`.

## Logging from a Claude chat (link format)

Claude resolves a described meal into macros and replies with a link. Tapping it opens the app with a confirm screen
where each amount can be adjusted and a time block picked. The same text can be pasted in via Manual -> Paste a meal.

    https://emdub170.github.io/Silicon/#add=<items>&date=YYYY-MM-DD

- `<items>`: `name;protein_g;fat_g;carbs_g;alcohol_g;calories;r;amount`, items separated by `|`, the whole value URL-encoded
- macros describe one serving; `amount` is how much was eaten: a count (`2`) or grams (`150g`)
- grams need a gram weight in the name, e.g. `Chicken breast cooked (100 g)` with macros per 100 g
- `calories` optional (blank = 4P + 4C + 9F + 7A); `r` optional (files the food under Recipes); `date` optional
- names must not contain `;` or `|`
- entries are logged with source `estimate`; each food is saved to My foods for reuse at any amount
