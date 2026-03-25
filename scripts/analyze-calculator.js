const XLSX = require('xlsx');
const fs = require('fs');

// Load the Excel file
const workbook = XLSX.readFile('/Users/clawdbot/kalkulátor.xlsx', {
  cellFormula: true,
  cellStyles: true,
  sheetStubs: true
});

console.log('📊 AKUSTICKÝ KALKULÁTOR - ANALÝZA\n');
console.log('=' .repeat(80));
console.log('\n📑 SEZNAM LISTŮ:\n');

workbook.SheetNames.forEach((name, idx) => {
  console.log(`${idx + 1}. ${name}`);
});

console.log('\n' + '='.repeat(80));

// Analyze each sheet
workbook.SheetNames.forEach((sheetName, sheetIdx) => {
  console.log(`\n\n📄 LIST ${sheetIdx + 1}: ${sheetName}`);
  console.log('-'.repeat(80));

  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

  console.log(`\nRozsah: ${sheet['!ref']}`);
  console.log(`Řádků: ${range.e.r + 1}, Sloupců: ${range.e.c + 1}\n`);

  // Get all cells with formulas
  const formulas = [];
  const values = [];

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];

      if (cell) {
        if (cell.f) {
          formulas.push({
            address: cellAddress,
            formula: cell.f,
            value: cell.v,
            type: cell.t
          });
        } else if (cell.v !== undefined && cell.v !== '') {
          values.push({
            address: cellAddress,
            value: cell.v,
            type: cell.t
          });
        }
      }
    }
  }

  // Display content in readable format
  console.log('📊 OBSAH (s hodnotami):');
  const jsonData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false
  });

  jsonData.forEach((row, idx) => {
    if (row.some(cell => cell !== '')) {
      const rowNum = idx + 1;
      console.log(`Řádek ${rowNum}:`, row.map(cell => {
        if (typeof cell === 'string' && cell.length > 50) {
          return cell.substring(0, 47) + '...';
        }
        return cell;
      }));
    }
  });

  if (formulas.length > 0) {
    console.log('\n\n🧮 VZORCE:');
    formulas.forEach(f => {
      console.log(`  ${f.address}: ${f.formula} = ${f.value}`);
    });
  }

  console.log('\n' + '='.repeat(80));
});

console.log('\n\n✅ Analýza dokončena!');
