// Run: node test.js  (extracts the inline script from index.html and tests the pure logic)
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const m = { exports: {} };
new Function('module', src)(m);
const L = m.exports;

assert.strictEqual(L.calcCal(30, 40, 10, 0), 370);
assert.strictEqual(L.calcCal(0, 0, 0, 14), 98);
assert.strictEqual(L.shiftDay('2026-11-01', -1), '2026-10-31');
assert.strictEqual(L.shiftDay('2026-12-31', 1), '2027-01-01');
assert.strictEqual(L.shiftDay('2026-03-08', 1), '2026-03-09'); // DST start

const food = { id: 'm:x', name: 'Chicken, "grilled"', calories: 200, protein_g: 35.5, fat_g: 5, carbs_g: 0, alcohol_g: 0 };
const e1 = L.makeEntry(food, 1.5, '2026-11-10', '12:00', 'manual');
assert.deepStrictEqual([e1.calories, e1.protein_g, e1.fat_g], [300, 53.3, 7.5]);
const beer = { id: 'm:b', name: 'Beer', calories: 150, protein_g: 1, fat_g: 0, carbs_g: 13, alcohol_g: 14 };
const e2 = L.makeEntry(beer, 2, '2026-11-11', '19:30', 'manual');
const entries = [e1, e2, L.makeEntry(food, 1, '2026-11-01', '08:00', 'manual')]; // last one is outside the week

const w = L.weekSummary(entries, '2026-11-11');
assert.strictEqual(w.days.length, 7);
assert.strictEqual(w.days[0].date, '2026-11-05');
assert.strictEqual(w.logged, 2);
assert.deepStrictEqual(w.avg, { cal: 300, p: 27.7, f: 3.8, c: 13, a: 14 }); // averaged over 2 logged days, not 7

const csv = L.toCSV(entries, '2026-11-11').trim().split('\n');
assert.strictEqual(csv.length, 3);
assert.strictEqual(csv[0], 'date,time,name,servings,calories,protein_g,fat_g,carbs_g,alcohol_g,source');
assert.ok(csv[1].includes('"Chicken, ""grilled"""'));
assert.ok(csv[2].endsWith(',28,manual'));

const txt = L.summaryText(entries, '2026-11-11');
assert.ok(txt.includes('2026-11-09 | not logged'));
assert.ok(txt.includes('Avg of 2 logged days'));

// Open Food Facts shapes
const perServing = { status: 1, product: { product_name: 'Protein Bar', brands: 'Acme, Other', serving_size: '1 bar (60 g)',
  nutriments: { 'energy-kcal_serving': 210, proteins_serving: 20, fat_serving: 7, carbohydrates_serving: 22, 'energy-kcal_100g': 350 } } };
assert.deepStrictEqual(L.parseOFF(perServing), { name: 'Acme Protein Bar', serving: '1 bar (60 g)', protein_g: 20, fat_g: 7, carbs_g: 22, alcohol_g: 0, calories: 210 });
const per100 = { status: 1, product: { product_name: 'Oats', nutriments: { 'energy-kcal_100g': 379, proteins_100g: 13.2, fat_100g: 6.5, carbohydrates_100g: 67.7 } } };
assert.strictEqual(L.parseOFF(per100).serving, '100 g');
assert.strictEqual(L.parseOFF(per100).calories, 379);
assert.strictEqual(L.parseOFF({ status: 0 }), null);
assert.strictEqual(L.parseOFF({ status: 1, product: { product_name: 'Empty', nutriments: {} } }), null);

console.log('all logic tests passed');

// Claude link import
const imp = L.parseImport('Grilled chicken 6 oz;53;6;0;0;270|Rice 1 cup;4;0.4;45;0|Margarita;0;0;12;14;; |');
assert.strictEqual(imp.length, 3);
assert.deepStrictEqual(imp[0], { name: 'Grilled chicken 6 oz', serving: '1 serving', protein_g: 53, fat_g: 6, carbs_g: 0, alcohol_g: 0, calories: 270 });
assert.strictEqual(imp[1].calories, 200); // 4*4 + 4*45 + 9*0.4 = 199.6
assert.strictEqual(imp[2].calories, 146); // 48 + 98, blank calories field
assert.deepStrictEqual(L.parseImport(''), []);
console.log('import tests passed');

// recipe flag in link import
const rimp = L.parseImport("Kristina's chili (1 bowl);32;14;28;0;390;r|Cornbread 1 piece;4;7;28;0");
assert.strictEqual(rimp[0].recipe, true);
assert.strictEqual(rimp[1].recipe, undefined);
console.log('recipe tests passed');
