const XLSX = require('xlsx');

const workbook = XLSX.readFile('/Users/clawdbot/kalkulátor.xlsx', {
  cellFormula: true,
  cellStyles: true,
  sheetStubs: true
});

const sheet = workbook.Sheets['kalkulátor'];
const data = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: '',
  blankrows: true
});

console.log('🧮 AKUSTICKÝ KALKULÁTOR - DETAILNÍ STRUKTURA\n');
console.log('='.repeat(100));

// Helper to get cell value and formula
const getCell = (row, col) => {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[addr];
  if (!cell) return { v: '', f: null };
  return { v: cell.v || '', f: cell.f || null };
};

// Section 1: Součet (Rows 1-7)
console.log('\n📊 SEKCE 1: LOGARITMICKÝ SOUČET HLADIN');
console.log('-'.repeat(100));
console.log('Vzorec: 10 × log₁₀(∑ 10^(Li/10))');
console.log('\nVstupní hodnoty:');
for (let i = 1; i <= 6; i++) {
  const label = data[i][0];
  const value = data[i][1];
  if (value) console.log(`  ${label} ${value} dB`);
}
const sumCell = getCell(1, 4);
console.log(`\nVýsledek: ∑ = ${sumCell.v} dB`);
console.log(`Vzorec v Excelu: ${sumCell.f}`);

// Section 2: Odečet (Rows 1-7)
console.log('\n\n📊 SEKCE 2: LOGARITMICKÝ ODEČET HLADIN');
console.log('-'.repeat(100));
console.log('Vzorec: 10 × log₁₀(10^(L1/10) - ∑ 10^(Li/10))');
console.log('\nVstupní hodnoty:');
for (let i = 1; i <= 6; i++) {
  const label = data[i][6];
  const value = data[i][7];
  if (value && label) console.log(`  ${label} ${value} dB`);
}
const diffCell = getCell(1, 10);
console.log(`\nVýsledek: ∑ = ${diffCell.v} dB`);
console.log(`Rozdíl: ${data[1][12]} dB`);

// Section 3: Útlum vzdáleností (Rows 8-13)
console.log('\n\n📊 SEKCE 3: ÚTLUM VLIVEM VZDÁLENOSTI');
console.log('-'.repeat(100));

console.log('\n3a) Z akustického výkonu (bodový zdroj):');
console.log('    Lp = Lw + 10×log(Q/(4πr²))');
console.log(`    Lw = ${data[9][1]} dB, Q = ${data[10][1]}, r = ${data[11][1]} m`);
console.log(`    Výsledek: Lp = ${getCell(12, 2).v} dB`);

console.log('\n3b) Z akustického tlaku (změna vzdálenosti):');
console.log('    Lp = Lp + 20×log(r1/r2)');
console.log(`    Lp = ${data[9][7]} dB, r1 = ${data[10][6]} m, r2 = ${data[11][6]} m`);
console.log(`    Výsledek: Lp = ${getCell(12, 7).v} dB`);

console.log('\n3c) Z akustického tlaku (10×log variant):');
console.log('    Lp = Lp + 10×log(r1/r2)');
console.log(`    Lp = ${data[9][12]} dB, r1 = ${data[10][12]} m, r2 = ${data[11][12]} m`);
console.log(`    Výsledek: Lp = ${getCell(12, 13).v} dB`);

console.log('\n3d) Z akustického výkonu (čárový zdroj):');
console.log('    Lp = Lw + 10×log(arctg(a/d)) - 10×log(4π×a×d)');
console.log(`    Lw = ${data[9][17]} dB, a = ${data[10][18]} m, d = ${data[11][18]} m`);
console.log(`    Výsledek: Lp = ${getCell(12, 18).v} dB`);

// Section 4: More distance calculations (Rows 14-21)
console.log('\n\n3e) Z akustického výkonu (plocha + odraz):');
console.log('    Lp = Lw - 10×log(S + 4πr²/Q)');
const s = getCell(19, 1).v;
console.log(`    Lw = ${data[16][1]} dB, Q = ${data[17][1]}, r = ${data[18][1]} m, S = ${s} m²`);
console.log(`    Výsledek: Lp = ${getCell(20, 1).v} dB`);

console.log('\n3f) Z akustického výkonu (pouze plocha):');
console.log('    Lp = Lw - 10×log(S)');
console.log(`    Výsledek: Lp = ${getCell(20, 4).v} dB`);

// Section 5: Délka působení (Rows 14-33)
console.log('\n\n📊 SEKCE 4: DÉLKA PŮSOBENÍ ZDROJE');
console.log('-'.repeat(100));
console.log('Vzorec: LAeqT = 10×log((∑(10^(Li/10) × ti))/T)');
console.log(`\nČasový interval: ${data[15][6]} hod`);
console.log(`LAeqT (vstup): ${data[14][7]} dB`);
console.log(`Doba působení: ${data[16][6]} hod`);
console.log(`\nVýsledná hladina: ${data[17][6]} dB`);

// Section 6: Průměrná expozice (columns M-W, rows 14-32)
console.log('\n\n📊 SEKCE 5: PRŮMĚRNÁ EXPOZICE HLUKU');
console.log('-'.repeat(100));
console.log('Výpočet průměru z více měření (logaritmický průměr)');
console.log(`\nVýsledek 1: ${data[15][15]} dB (průměr z ${11} hodnot)`);
console.log(`Výsledek 2: ${data[15][22]} dB (průměr z ${8} hodnot)`);

// Section 7: Délky působení zdrojů (Rows 23-48)
console.log('\n\n📊 SEKCE 6: DÉLKY PŮSOBENÍ VÍCE ZDROJŮ');
console.log('-'.repeat(100));
console.log('Vzorec: LAeqT = 10×log((∑(10^(Li/10) × ti))/T)');
console.log(`\nČasový interval: ${data[23][6]} min`);
console.log('\nVstupní zdroje:');
for (let i = 25; i <= 30; i++) {
  const laeq = data[i - 1][5];
  const time = data[i - 1][6];
  if (laeq && time) {
    console.log(`  Zdroj ${i - 24}: LAeqT = ${laeq} dB, doba = ${time} min`);
  }
}
console.log(`\nDoplnění 0: ${data[31][7]} min`);
console.log(`Výsledná hladina: ${getCell(32, 6).v} dB`);

// Section 8: Neprůzvučnost (Rows 34-46)
console.log('\n\n📊 SEKCE 7: NEPRŮZVUČNOST SLOŽENÉ KONSTRUKCE');
console.log('-'.repeat(100));
console.log('Vzorec: R\'w,res = 10×log(S) - 10×log(∑Si × 10^(-Rwi/10))');
console.log(`\nCelková plocha: ${data[34][7]} m²`);
console.log(`Výsledek R'w,res: ${getCell(34, 9).v} dB`);
console.log('\nPrvky konstrukce:');
for (let i = 36; i <= 45; i++) {
  const name = data[i][6];
  const rw = data[i][7];
  const area = data[i][8];
  if (name && rw && area) {
    console.log(`  ${name}: Rw = ${rw} dB, plocha = ${area} m²`);
  }
}

console.log('\n\n' + '='.repeat(100));
console.log('✅ Extrakce dokončena!');
