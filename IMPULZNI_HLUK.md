# 💥 Modul: Impulzní hluk

Nový modul pro analýzu impulzních akustických událostí.

## ✨ Funkce

- **📁 Import dat** - Excel/CSV soubory s měřeními impulzů
- **📊 Statistiky** - Min, Max, Průměr, Medián
- **📈 Interaktivní graf** - Časový průběh s limitními hodnotami
- **📋 Tabulka** - Podrobné zobrazení všech událostí
- **⚠️ Hodnocení limitů** - Automatické porovnání s předpisy
- **📥 Export** - Export do Excel

## 📊 Měřené veličiny

### L<sub>Cpeak</sub> - Špičková hladina [dB(C)]
- Maximální okamžitá hodnota akustického tlaku
- Měřeno s C-váhováním (citlivější na nízké frekvence)
- **Povinné** v datovém souboru

### L<sub>Aeq</sub> - Ekvivalentní hladina [dB(A)]
- Energetický průměr během impulzu
- Měřeno s A-váhováním
- *Volitelné* v datovém souboru

### Délka impulzu [ms]
- Trvání impulzní události
- Typicky 0,1 - 1000 ms
- *Volitelné* v datovém souboru

### Zdroj
- Textový popis zdroje impulzu
- Např.: "Výbuch", "Úder", "Výstřel", "Pád předmětu"
- *Volitelné* v datovém souboru

## ⚠️ Limitní hodnoty

### Pracovní prostředí (NV 272/2011 Sb.)
**L<sub>Cpeak</sub> < 135 dB(C)**
- Denní expozice hluku
- Platí pro pracoviště s rizikem impulzního hluku

### Obytná zástavba (výbušniny)
**L<sub>Cpeak</sub> < 125 dB(C)**
- Ochrana okolí při práci s výbušninami
- Platí ve vzdálenosti obytné zástavby

### Střelnice
- Specifické limity dle druhu zbraně
- Závislost na vzdálenosti od zdroje
- Kategorizace dle ČSN ISO 17201

## 📁 Formát souboru

### Požadované sloupce:

| Název sloupce | Typ | Poznámka |
|---------------|-----|----------|
| Datum a čas | Datum | Nebo odděleně Datum + Čas |
| LCpeak | Číslo | [dB(C)] - Povinné |

### Volitelné sloupce:

| Název sloupce | Typ | Poznámka |
|---------------|-----|----------|
| LAeq | Číslo | [dB(A)] |
| Délka | Číslo | [ms] |
| Zdroj | Text | Popis zdroje |

### Příklad souboru:

```
Datum a čas       | LCpeak | LAeq  | Délka | Zdroj
14.3.2024 10:15  | 128.5  | 98.2  | 150   | Výbuch
14.3.2024 10:47  | 132.1  | 102.8 | 180   | Výbuch
14.3.2024 11:20  | 126.3  | 95.7  | 120   | Výbuch
```

## 🎯 Použití

### 1. Otevření modulu
```
Hlavní stránka → 💥 Impulzní hluk
```

### 2. Import dat
- Klikni na "Nahrát data impulzního hluku"
- Vyber Excel/CSV soubor
- Data se automaticky načtou a zpracují

### 3. Prohlížení výsledků

**Statistiky:**
- Celkový počet událostí
- Min, Max, Průměr, Medián L<sub>Cpeak</sub>
- Hodnocení limitních hodnot
- Rozdělení podle zdrojů

**Graf:**
- Časový průběh všech impulzů
- Referenční čáry limitů (135 dB, 125 dB)
- Možnost zobrazit/skrýt L<sub>Aeq</sub>

**Tabulka:**
- Kompletní seznam všech událostí
- Řazení podle sloupců (klikni na záhlaví)
- Barevné označení překročení limitů
  - 🔴 Červená: ≥ 135 dB(C)
  - 🟠 Oranžová: ≥ 125 dB(C)
  - 🟢 Zelená: < 125 dB(C)

### 4. Export výsledků
```
Tabulka událostí → 📥 Export do Excelu
```
- Exportuje kompletní tabulku s výsledky
- Včetně hodnocení limitů
- Soubor: `impulzni_hluk_YYYY-MM-DD_HHmmss.xlsx`

## 📚 Právní rámec

### České předpisy

**NV 272/2011 Sb. - Ochrana zdraví před nepříznivými účinky hluku a vibrací**
- § 11: Limity expozice hluku na pracovišti
- L<sub>Cpeak</sub> = 135 dB(C) pro denní expozici
- L<sub>Cpeak</sub> = 137 dB(C) pro týdenní expozici

**Zákon 258/2000 Sb. - Ochrana veřejného zdraví**
- Ochrana před nadměrným hlukem
- Pravomoci hygienické služby

**Vyhláška 523/2006 Sb. - Práce s výbušninami**
- Ochranná pásma při trhacích pracích
- Limity hluku v okolí

### Normy

**ČSN ISO 1999** - Akustika - Odhad ztráty sluchu vlivem hluku
- Hodnocení rizika poškození sluchu
- Implikace pro impulzní hluk

**ČSN EN ISO 9612** - Akustika - Stanovení expozice hluku
- Metodika měření
- Strategie vzorkování pro impulzní události

**ČSN ISO 17201-1 až 5** - Akustika - Hluk ze střelnic
- Část 1: Stanovení akustického výkonu střelných zbraní
- Část 2: Odhad rozšíření impulzního zvuku
- Část 3: Směrnice pro omezení hluku
- Část 4: Predikce úrovní impulzního hluku
- Část 5: Měření hlukových emisí

## 🔬 Technické pozadí

### Proč C-vážování pro špičky?

**A-vážování:**
- Potlačuje nízké a vysoké frekvence
- Odpovídá citlivosti lidského ucha při běžných hlasitostech
- Používá se pro L<sub>Aeq</sub> (průměrné hodnoty)

**C-vážování:**
- Méně potlačuje nízké frekvence
- Lépe zachycuje energii impulzů (často obsahují nízké frekvence)
- Používá se pro špičkové hodnoty L<sub>Cpeak</sub>
- Relevantnější pro posouzení rizika poškození sluchu

### Měření impulzního hluku

**Parametry měřicího přístroje:**
- **Časová konstanta:** FAST (125 ms) nebo IMPULSE (35 ms)
- **Max hold:** Zachycení maximální hodnoty
- **Trigger:** Automatické spuštění při překročení prahu
- **Sampling rate:** Minimálně 48 kHz pro správné zachycení špiček

**Umístění mikrofonu:**
- **Pracovní prostředí:** Úroveň ucha pracovníka (cca 1,5 m)
- **Okolí výbušnin:** Body referenční zástavby
- **Střelnice:** Dle ČSN ISO 17201 (pozice pozorovatele)

## 💡 Tipy pro měření

1. **Kalibrace** - Vždy zkalibrovat před měřením
2. **Pozadí** - Dokumentovat pozadí před impulsem
3. **Vzdálenost** - Zaznamenat vzdálenost od zdroje
4. **Počasí** - Poznamenat povětrnostní podmínky (vítr, teplota)
5. **Opakování** - Změřit více událostí pro statistiku
6. **Dokumentace** - Fotodokumentace umístění měřicích bodů

## 📧 Podpora

Pro dotazy k modulu nebo nahlášení chyb kontaktujte vývojáře.

---

**Verze:** 1.0.0
**Datum:** 25.3.2026
**Autor:** Acoustic Tools
