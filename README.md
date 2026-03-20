# 📊 Analyzátor hluku

Interaktivní webová aplikace pro analýzu měření hladiny hluku z Excel souborů.

## ✨ Funkce

- **📁 Import Excel souborů** - Nahraj .xlsx, .xls nebo .csv soubory s daty
- **📈 Interaktivní grafy** - Vizualizace dat s Recharts
- **⏰ Filtrování času** - Celý den / Den (6-22h) / Noc (22-6h)
- **📊 Kompletní statistiky**:
  - Min, Max, Leq (logaritmický průměr), Medián
  - Percentily (5., 10., 90., 95.) pro každou hodinu
  - Denní vs. Noční Leq
  - Hodinové Leq + percentily
- **🎨 Moderní UI** - Responzivní design s Tailwind CSS
- **⚠️ Správné průměrování** - Logaritmické pro decibely!

## 🚀 Spuštění

```bash
# Instalace závislostí
bun install

# Spuštění dev serveru
bun run dev

# Otevři http://localhost:3000
```

## 📄 Formát Excel souboru

Aplikace očekává Excel soubor s těmito sloupci:

### Formát 1 (Datum + Čas odděleně):
| Datum      | Čas  | Hodnota |
|------------|------|---------|
| 14.3.2026  | 8:00 | 55.2    |
| 14.3.2026  | 8:15 | 57.8    |

### Formát 2 (Datum+Čas dohromady):
| Datum a čas        | Hodnota |
|--------------------|---------|
| 14.3.2026 8:00     | 55.2    |
| 14.3.2026 8:15     | 57.8    |

## 🔬 Logaritmické průměrování

**DŮLEŽITÉ:** Decibely se nesmí průměrovat aritmeticky!

Aplikace používá správný logaritmický vzorec pro výpočet ekvivalentní hladiny hluku:

```
Leq = 10 × log₁₀(1/n × Σ 10^(Li/10))
```

Kde:
- **Leq** = ekvivalentní hladina hluku (dB)
- **n** = počet měření
- **Li** = jednotlivá měřená hodnota (dB)

### Proč logaritmicky?

Decibely jsou logaritmická jednotka. Zvýšení o 3 dB = dvojnásobek energie!

**Příklad:**
- Aritmetický průměr z `[60, 70]` = 65 dB ❌ (ŠPATNĚ)
- Logaritmický průměr z `[60, 70]` = 66.9 dB ✅ (SPRÁVNĚ)

## 📊 Statistické ukazatele (akustická notace)

⚠️ **DŮLEŽITÉ:** V akustice jsou percentily obrácené oproti statistice!

- **Leq** - Ekvivalentní hladina hluku (energetický průměr)
- **L5** - 5% času je hluk VYŠŠÍ (špičky)
- **L10** - 10% času je hluk VYŠŠÍ
- **L90** - 90% času je hluk VYŠŠÍ (pozadí)
- **L95** - 95% času je hluk VYŠŠÍ (minimum)

Například L5 = 70 dB znamená, že pouze 5% času hluk přesáhl 70 dB.

## 🎯 Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS
- Recharts (grafy)
- xlsx (Excel parser)
- date-fns (datumy)

## 📝 Licence

MIT - Použij jak chceš!
