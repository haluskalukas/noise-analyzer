# 🧮 AKUSTICKÝ KALKULÁTOR - Specifikace

Analýza Excel kalkulátoru pro vytvoření webové aplikace.

---

## 📊 PŘEHLED VŠECH VÝPOČTŮ

### 1️⃣ **LOGARITMICKÝ SOUČET HLADIN**

**Účel:** Sčítání hladin zvuku (energetický součet)

**Vzorec:**
```
L_sum = 10 × log₁₀(∑ 10^(Li/10))
```

**Vstupy:**
- L1, L2, L3, L4, L5, L6 (až 6 hladin v dB)

**Výstup:**
- Výsledná hladina L_sum (dB)

**Excel vzorec:**
```excel
=10*(LOG(POWER(10,(0.1*B2))+POWER(10,(0.1*B3))+POWER(10,(0.1*B4))+POWER(10,(0.1*B5))+POWER(10,(0.1*B6))+POWER(10,(0.1*B7))))
```

**Příklad:**
- L1 = 58.8 dB, L2 = 58.4 dB → Výsledek = 61.6 dB

---

### 2️⃣ **LOGARITMICKÝ ODEČET HLADIN**

**Účel:** Odečtení hluku pozadí od celkového hluku

**Vzorec:**
```
L_diff = 10 × log₁₀(10^(L1/10) - ∑ 10^(Li/10))
```

**Vstupy:**
- L1 (celková hladina v dB)
- L2, L3, L4, L5, L6 (hladiny k odečtení v dB)

**Výstupy:**
- Výsledná hladina L_diff (dB)
- Rozdíl = L1 - L_diff (dB)

**Excel vzorec:**
```excel
=10*(LOG10(POWER(10,(0.1*H2))-POWER(10,(0.1*H3))-POWER(10,(0.1*H4))-POWER(10,(0.1*H5))-POWER(10,(0.1*H6))-POWER(10,(0.1*H7))))
Rozdíl: =H2-K2
```

**Příklad:**
- L1 = 27.7 dB, L2 = 21.8 dB → Výsledek = 26.4 dB, Rozdíl = 1.3 dB

---

### 3️⃣ **ÚTLUM VLIVEM VZDÁLENOSTI**

#### 3a) **Z akustického výkonu - bodový zdroj**

**Vzorec:**
```
Lp = Lw + 10×log₁₀(Q/(4πr²))
```

**Vstupy:**
- Lw = akustický výkon zdroje (dB)
- Q = směrovost zdroje (-)
- r = vzdálenost od zdroje (m)

**Výstup:**
- Lp = hladina akustického tlaku (dB)

**Excel vzorec:**
```excel
=C19+10*LOG10(C20/(4*PI()*C21*C21))
```

**Příklad:**
- Lw = 57 dB, Q = 2, r = 5 m → Lp = 35.0 dB

---

#### 3b) **Z akustického tlaku - bodový zdroj (změna vzdálenosti)**

**Vzorec:**
```
Lp2 = Lp1 + 20×log₁₀(r1/r2)
```

**Vstupy:**
- Lp1 = hladina tlaku ve vzdálenosti r1 (dB)
- r1 = výchozí vzdálenost (m)
- r2 = nová vzdálenost (m)

**Výstup:**
- Lp2 = hladina tlaku ve vzdálenosti r2 (dB)

**Excel vzorec:**
```excel
=H19+20*LOG10(H20/H21)
```

**Příklad:**
- Lp1 = 72.1 dB, r1 = 10 m, r2 = 50 m → Lp2 = 58.1 dB

---

#### 3c) **Z akustického tlaku - liniový zdroj (změna vzdálenosti)**

**Vzorec:**
```
Lp2 = Lp1 + 10×log₁₀(r1/r2)
```

**Vstupy:**
- Lp1 = hladina tlaku ve vzdálenosti r1 (dB)
- r1 = výchozí vzdálenost (m)
- r2 = nová vzdálenost (m)

**Výstup:**
- Lp2 = hladina tlaku ve vzdálenosti r2 (dB)

**Excel vzorec:**
```excel
=N19+10*LOG10(N20/N21)
```

**Příklad:**
- Lp1 = 64.5 dB, r1 = 7.5 m, r2 = 70 m → Lp2 = 54.8 dB

---

#### 3d) **Z akustického výkonu - čárový zdroj konečné délky**

**Vzorec:**
```
Lp = Lw + 10×log₁₀(arctg(a/d)) - 10×log₁₀(4π×a×d)
```

**Vstupy:**
- Lw = akustický výkon zdroje (dB)
- a = délka čárového zářiče (m)
- d = kolmá vzdálenost od zářiče (m)

**Výstup:**
- Lp = hladina akustického tlaku (dB)

**Excel vzorec:**
```excel
=S19+10*LOG10((ATAN(S20/S21)))-10*LOG10(4*PI()*S20*S21)
```

**Příklad:**
- Lw = 81 dB, a = 100 m, d = 6 m → Lp = 44.0 dB

---

#### 3e) **Z akustického výkonu - plošný zdroj s odrazem**

**Vzorec:**
```
Lp = Lw - 10×log₁₀(S + 4πr²/Q)
```

**Vstupy:**
- Lw = akustický výkon zdroje (dB)
- S = plocha (m²)
- Q = směrovost (-)
- r = vzdálenost (m)

**Výstup:**
- Lp = hladina akustického tlaku (dB)

**Excel vzorec:**
```excel
=B32-10*LOG10(B35+(4*PI()*B34*B34)/B33)
```

**Příklad:**
- Lw = 70 dB, Q = 4, r = 28 m, S = 784 m² → Lp = 34.9 dB

---

#### 3f) **Z akustického výkonu - pouze plocha**

**Vzorec:**
```
Lp = Lw - 10×log₁₀(S)
```

**Vstupy:**
- Lw = akustický výkon zdroje (dB)
- S = plocha (m²)

**Výstup:**
- Lp = hladina akustického tlaku (dB)

**Excel vzorec:**
```excel
=B32-10*LOG10(B35)
```

**Příklad:**
- Lw = 70 dB, S = 784 m² → Lp = 41.1 dB

---

### 4️⃣ **DÉLKA PŮSOBENÍ ZDROJE (jeden zdroj)**

**Účel:** Přepočet na referenční časový interval

**Vzorec:**
```
LAeq,T = 10×log₁₀((10^(LAeq,t/10) × t) / T)
```

**Vstupy:**
- LAeq,t = naměřená hladina pro dobu t (dB)
- t = doba působení zdroje (hod/min)
- T = referenční časový interval (hod/min)

**Výstup:**
- LAeq,T = přepočtená hladina pro interval T (dB)

**Excel vzorec:**
```excel
=10*(LOG(((POWER(10,(0.1*H30)))*H32)/H31))
```

**Příklad:**
- LAeq,t = 105 dB, t = 6 hod, T = 14 hod → LAeq,T = 101.3 dB

---

### 5️⃣ **PRŮMĚRNÁ EXPOZICE HLUKU**

**Účel:** Logaritmický průměr z více měření

**Vzorec:**
```
LAeq = 10×log₁₀(1/n × ∑ 10^(Li/10))
```

**Vstupy:**
- L1, L2, ..., Ln = jednotlivé naměřené hodnoty (dB)
- n = počet měření

**Výstup:**
- LAeq = průměrná ekvivalentní hladina (dB)

**Excel vzorec:**
```excel
=10*LOG10(AVERAGE(O31:O41))
kde O31 = POWER(10,(0.1*N31))
```

**Příklad:**
- Průměr z 11 hodnot → LAeq = 56.6 dB
- Průměr z 8 hodnot → LAeq = 40.9 dB

---

### 6️⃣ **DÉLKY PŮSOBENÍ VÍCE ZDROJŮ**

**Účel:** Výpočet celkové expozice z více zdrojů s různými dobami působení

**Vzorec:**
```
LAeq,T = 10×log₁₀((∑(10^(Li/10) × ti)) / T)
```

**Vstupy:**
- L1, L2, ..., Ln = hladiny jednotlivých zdrojů (dB)
- t1, t2, ..., tn = doby působení zdrojů (min)
- T = celkový referenční interval (min)

**Výstup:**
- LAeq,T = výsledná ekvivalentní hladina (dB)

**Excel vzorec:**
```excel
=10*(LOG((((IF(H41=0,0,POWER(10,(0.1*G41))*H41))+(IF(H42=0,0,POWER(10,(0.1*G42))*H42))+...)/H39)))
```

**Příklad:**
- Zdroj 1: 75 dB × 1.5 min
- Celkový interval: 480 min
- Výsledek: LAeq,T = 49.9 dB

---

### 7️⃣ **NEPRŮZVUČNOST SLOŽENÉ KONSTRUKCE**

**Účel:** Výpočet výsledné neprůzvučnosti stavební konstrukce složené z více prvků

**Vzorec:**
```
R'w,res = 10×log₁₀(S_celk) - 10×log₁₀(∑(Si × 10^(-Rwi/10)))
```

**Vstupy:**
- S_celk = celková plocha konstrukce (m²)
- Rw1, Rw2, ..., Rwn = vážené neprůzvučnosti jednotlivých prvků (dB)
- S1, S2, ..., Sn = plochy jednotlivých prvků (m²)

**Výstup:**
- R'w,res = výsledná vážená neprůzvučnost konstrukce (dB)

**Excel vzorec:**
```excel
=10*LOG10(H54)-10*LOG10(I57*POWER(10,-0.1*H57)+I58*POWER(10,-0.1*H58)+...)
```

**Příklad:**
- Celková plocha: 15 m²
- Stěna: Rw = 52 dB, plocha = 10 m²
- Zasklení: Rw = 45 dB, plocha = 5 m²
- Výsledek: R'w,res = 48.3 dB

---

## 🎨 UI/UX DOPORUČENÍ

### Struktura aplikace:
1. **Karty/Záložky** pro každou sekci výpočtu
2. **Formuláře** s popisky a jednotkami
3. **Okamžitý výpočet** při změně hodnoty
4. **Historie výpočtů** - možnost uložit/načíst
5. **Export do PDF/Excel**

### Validace vstupů:
- Rozsahy hodnot (např. dB: 0-200, vzdálenost > 0)
- Kontrola fyzikální správnosti
- Zvýraznění neplatných hodnot

### Vizualizace:
- Grafické znázornění útlumu vzdáleností
- Barevné kódování výsledků
- Tooltips s vysvětlením vzorců

---

## 📐 MATEMATICKÉ KONSTANTY

- π (PI) = 3.14159265...
- log₁₀ = dekadický logaritmus (základ 10)
- arctg = arkustangens (inverzní funkce tangens)

---

## 🔢 TYPICKÉ HODNOTY

### Směrovost Q:
- 1 = všesměrový zdroj (volný prostor)
- 2 = poloprostor (na zemi)
- 4 = čtvrt prostoru (roh místnosti)
- 8 = osmina prostoru (roh na zemi)

### Akustický výkon Lw:
- 50-70 dB: tichá zařízení
- 70-90 dB: běžná zařízení
- 90-110 dB: hlučná zařízení
- 110+ dB: velmi hlučná zařízení

### Neprůzvučnost Rw:
- 30-40 dB: dřevěné příčky, okna
- 40-50 dB: lehké stěny, dřevěné podlahy
- 50-60 dB: cihelné stěny, železobetonové desky
- 60+ dB: těžké stěny, speciální konstrukce

---

**Vytvořeno:** 2026-03-22
**Autor:** Claude Code
**Verze:** 1.0
