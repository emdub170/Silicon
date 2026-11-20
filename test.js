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

// grams per serving, for staple amounts
assert.strictEqual(L.servingGrams({ serving: '32.0g', name: 'Beef stick' }), 32);
assert.strictEqual(L.servingGrams({ serving: '1 bar (60 g)', name: 'Bar' }), 60);
assert.strictEqual(L.servingGrams({ serving: '1 serving', name: "Kristina's discard bread (50 g)" }), 50);
assert.strictEqual(L.servingGrams({ serving: '1 serving', name: 'Eggs, 2 large' }), 0);
assert.strictEqual(L.servingGrams({ serving: '2 Tbsp', name: 'Salsa 150 mg sodium' }), 0);
console.log('staple tests passed');

// time blocks
assert.strictEqual(L.BLOCKS.length, 8);
assert.deepStrictEqual(['00:00', '02:59', '03:00', '08:59', '09:00', '12:00', '20:59', '23:59', ''].map(L.blockOf), [0, 0, 1, 2, 3, 4, 6, 7, 0]);
console.log('block tests passed');

// per-100 g foods with an amount, and paste parsing
const meal = 'Chicken breast cooked (100 g);31;3.6;0;0;165;;150g|Green beans cooked (100 g);1.9;0.3;7.9;0;35;;100g|Sweet potato roasted (100 g);2;0.2;20.7;0;90;;50g|Egg 1 large;6.3;4.8;0.4;0;72;;3';
const mi = L.parseImport(meal);
assert.deepStrictEqual(mi.map(x => [x.serving, x.qty]), [['100 g', 1.5], ['100 g', 1], ['100 g', 0.5], ['1 serving', 3]]);
assert.strictEqual(L.parseImport('Toast;3;1;15;0;;r')[0].qty, undefined);
assert.strictEqual(L.parseImport('Toast;3;1;15;0;;;40g')[0].qty, undefined); // grams given but no gram weight in the name
const link = 'https://emdub170.github.io/Silicon/#add=' + encodeURIComponent(meal) + '&date=2026-11-16';
assert.deepStrictEqual(L.parsePaste(link), mi);
assert.deepStrictEqual(L.parsePaste('[Log: dinner](' + link + ')'), mi);
assert.deepStrictEqual(L.parsePaste(meal.split('|').join('\n')), mi);
assert.deepStrictEqual(L.parsePaste('hello there'), [{ name: 'hello there', serving: '1 serving', protein_g: 0, fat_g: 0, carbs_g: 0, alcohol_g: 0, calories: 0 }]);
console.log('meal import tests passed');

// targets
assert.deepStrictEqual(L.parseTargets('1900;180;63;158'), { cal: 1900, p: 180, f: 63, c: 158 });
assert.deepStrictEqual(L.parseTargets(';180;63;158'), { cal: 1919, p: 180, f: 63, c: 158 });
assert.strictEqual(L.parseTargets(''), null);
assert.ok(L.summaryText(entries, '2026-11-11', { cal: 1900, p: 180, f: 63, c: 158 }).endsWith('Daily target | 1900 | 180 | 63 | 158'));
console.log('target tests passed');

// bad database calories (the Monster can: 18700 kcal listed, label says 220)
const monster = { status: 1, product: { product_name: 'MEAN BEAN JAVA MONSTER COFFEE + ENERGY', serving_size: '1 serving (425.243 g)',
  nutriments: { 'energy-kcal_serving': 18700, proteins_serving: 8, fat_serving: 4.5, carbohydrates_serving: 37 } } };
const mo = L.parseOFF(monster);
assert.strictEqual(mo.calories, 221); assert.strictEqual(mo.calFixed, 18700);
assert.strictEqual(L.parseOFF(perServing).calFixed, undefined);
assert.strictEqual(L.calSuspect(920, 8, 37, 4.5, 0), true);   // kJ entered as kcal
assert.strictEqual(L.calSuspect(150, 1, 13, 0, 0), false);    // beer: alcohol calories not in the macros
assert.strictEqual(L.calSuspect(100, 10, 0.3, 2.2, 0), false); // beef stick row: off, but not absurd
assert.strictEqual(L.calSuspect(190, 20, 22, 7, 0), false);   // fibre / sugar alcohols
assert.strictEqual(L.calSuspect(20, 20, 22, 7, 0), true);
// unit for amount boxes
assert.strictEqual(L.gramUnit({ serving: '1 serving (425.243 g)', name: 'Monster' }), 0);
assert.strictEqual(L.gramUnit({ serving: '100 g', name: 'Chicken breast cooked (100 g)' }), 100);
assert.strictEqual(L.gramUnit({ serving: '32.0g', name: 'Beef stick' }), 32);
assert.strictEqual(L.gramUnit({ serving: '1 serving', name: "Kristina's discard bread (50 g)" }), 50);
assert.strictEqual(L.gramUnit({ serving: '1 bar (60 g)', name: 'Bar' }), 0);
console.log('sanity tests passed');
