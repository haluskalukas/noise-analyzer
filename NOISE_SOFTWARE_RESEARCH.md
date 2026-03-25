# Hloubkový průzkum softwaru pro zpracování hluku

## Obsah
1. [Přehled hlavních softwarových řešení](#přehled-hlavních-softwarových-řešení)
2. [Technické aspekty a workflows](#technické-aspekty-a-workflows)
3. [Výpočetní metody a standardy](#výpočetní-metody-a-standardy)
4. [Datové vstupy a integrace](#datové-vstupy-a-integrace)
5. [Výkonnost a optimalizace](#výkonnost-a-optimalizace)
6. [Architektura a deployment](#architektura-a-deployment)
7. [Návrh vlastního řešení](#návrh-vlastního-řešení)

---

## 1. Přehled hlavních softwarových řešení

### CadnaA (DataKustik)

**Pozice na trhu:** Vedoucí komerční software pro environmentální hluk, používaný v 60+ zemích

**Klíčové vlastnosti:**
- **64-bit technologie** s podporou vícejádrových procesorů
- **Multiplatformní import:** 30+ formátů (AutoCAD, GIS, Google Maps, OpenStreetMap)
- **Flexibilní licencování:** jednorázový nákup nebo předplatné (cloud/USB dongle)
- **3D vizualizace** s real-time aktualizací map
- **DYNMAP funkce:** automatická aktualizace hlukových map v přednastavených intervalech pomocí měření nebo dat o provozu

**Výpočetní metody:**
- CNOSSOS-HU
- IoA Good Practice Guide pro větrné turbíny
- Projektový koncept: "jeden software – jeden soubor na projekt"

**Nové funkce v 2026:**
- Import GeoPackage (.gpkg)
- SOSI 5.0 import
- Zvýšená výkonnost pro projekty jakékoliv velikosti

**Connectivity:**
- Integrace do GIS systémů
- Připojení k Noise Monitor Systems
- Export do běžných GIS/CAD formátů
- Vysoké rozlišení grafiky pro reporting

**Pricing:** Individuální cenové plány:
- CadnaA Industry Plan
- CadnaA Road Plan
- CadnaA City Plan
- CadnaA City & Airport Plan
- CadnaA Basic Plan
- CadnaA CALC Plan

*Poznámka: Konkrétní ceny nejsou veřejně dostupné - vždy na poptávku*

**Zdroje:**
- [CadnaA 2026 Release](https://scantekinc.com/blog/cadnaa-released/)
- [CadnaA Features](https://www.datakustik.com/products/cadnaa/features)
- [CadnaA Connectivity](https://www.datakustik.com/products/cadnaa/features/connectivity/)
- [CadnaA Pricing](https://www.getapp.com/business-intelligence-analytics-software/a/cadnaa/)

---

### HlukPLUS (České řešení)

**Pozice na trhu:** Specializovaný český software pro posuzování hluku v českém legislativním prostředí

**Klíčové vlastnosti:**
- **Verze 15** (dokončována k lednu 2026)
- **Velikost území:** až 35 km²
- **Plně v souladu s českou legislativou**

**Podporované zdroje hluku:**
- Automobilová doprava
- Železniční doprava
- Trolejbusová doprava
- Stacionární zdroje hluku

**Modelování terénu:**
- Práce s vrstevnicemi
- Digitální model terénu
- Terénní úpravy

*Poznámka: Podrobné informace o uživatelském rozhraní a workflow nejsou veřejně dostupné*

**Zdroje:**
- [HlukPLUS oficiální web](https://www.hlukplus.cz/)

---

### iNoise (DGMR Software)

**Pozice na trhu:** Intuitivní software s důrazem na soulad se standardy ISO

**Klíčové vlastnosti:**
- **Založeno na ISO 9613** a **ISO 17534**
- **Quality Assured Implementation** - garantovaná přesnost výpočtů
- Intuitivní uživatelské rozhraní

**Podporované zdroje:**
- Silniční doprava
- Železniční doprava
- Bodové/liniové/plošné zdroje
- Větrné turbíny

**SourceDB - databáze akustických výkonů:**
- Přednastavená knihovna hodnot akustického výkonu
- Údaje z technických specifikací výrobců
- Časová úspora při modelování

**Výpočetní přesnost:**
- Implementace splňující požadavky ISO 17534-3
- Testované shody mezi různými softwary
- Redukce rozdílů až o 5-10 dB oproti nestandardizovaným implementacím

**Zdroje:**
- [iNoise DGMR](https://dgmrsoftware.com/products/inoise/)
- [Quality Assured ISO 9613 Implementation](https://noisenewsinternational.net/quality-assured-implementation-of-iso-9613-in-inoise/)

---

### LIMA / Predictor-LimA (Brüel & Kjær)

**Pozice na trhu:** Kompletní řešení s nejrychlejšími výpočetními jádry

**Klíčové vlastnosti:**
- **Nejrychlejší výpočetní jádra** na trhu
- **Integrovaný systém správy projektů** (bookkeeping)
- **Otevřená architektura** pro snadnou integraci
- Moduly běží i za externím softwarem (např. ArcGIS)

**Automatizace:**
- **Makro funkce** pro automatické změny modelu
- **Command line input** - kombinace příkazů do "one line" sekvencí
- **Macro files** - automatizace geometrického zpracování
- **Kompletní automatizace workflow:** od importu dat přes výpočet až po tvorbu hlukových map

**GIS integrace:**
- Nástroje pro plnou integraci do jiných GIS systémů
- Import dat z GIS
- WMS podpora
- 3D vizualizace

**Výpočetní metody:**
- Průmysl
- Silnice
- Železnice
- Letadla
- Větrné turbíny

**Historie:**
- LIMA a Predictor byly původně dva samostatné systémy
- Nyní sloučeny do jednoho řešení
- Společné charakteristiky: meteorologické proměnné, útlum terénu, směrovost zdrojů, identifikace příspěvků, bodové/liniové/plošné zdroje, design akustických bariér

**Zdroje:**
- [Predictor-LimA Product Info](https://marketing-toolbox.s3.us-west-2.amazonaws.com/Product%20Data/Product%20Data%20A4/Product%20Data%20-%20Predictor-LimA%20-%20BP1602-41%20-%20A4.pdf)
- [Predictor-LimA Suite](https://mininglifeonline.net/equipment/noise-mapping-and-prediction/predictor-lima-software-suite-type-7810/1772)
- [LIMA Automation](https://www.bksv.com/media/doc/bp1962.pdf)

---

### SoundPLAN (SoundPLAN GmbH)

**Pozice na trhu:** Modulární software s podporou 50+ mezinárodních standardů

**Klíčové vlastnosti:**
- **Modulární struktura** - přizpůsobitelná individuálním potřebám
- **50+ mezinárodních standardů**
- **3D graficky orientovaný**
- Optimalizační utility pro bariéry

**Hlavní moduly:**

**1. Industrial Noise Module:**
- Komplexní průmyslové areály
- Zpětný výpočet akustického výkonu z měření
- Výpočet akustického výkonu z technických parametrů
- Expert systém: dokumentace status quo, ranking zdrojů podle příspěvku, návrh řešení (tlumiče, absorbéry)

**2. Room Acoustics Module:**
- Šíření zvuku uvnitř budov (VDI 3760)
- Pokročilý model částic s difrakcí
- Výpočet doby dozvuku
- Parametry jako STI (srozumitelnost řeči), EDT, RT, Clarity
- Auralizace
- Typy místností: open-plan kanceláře, konferenční sály, koncertní síně, restaurace
- Standardy: ISO 3382-3:2012, VDI 2569:2019

**3. Emission Library:**
- Převod naměřeného akustického tlaku na akustický výkon
- Data pro emisní hladiny vozidel
- Letecká data
- Směrovost zdrojů
- 24hodinové dopravní profily
- Emisní data vlaků
- Přenos zvuku
- Posuzování hluku

**4. Wall/Barrier Design Optimization:**
- Nástroj pro optimalizaci návrhu bariér
- Genetické algoritmy

**Podporované výpočty:**
- Bodové, liniové a plošné zdroje
- Průmyslové haly
- Větrné turbíny
- Parkoviště
- Open-air koncerty
- Hluk na pracovišti (expoziční hladiny)

**Zdroje:**
- [SoundPLAN Modules](https://www.soundplan.eu/en/software/soundplannoise/modules)
- [SoundPLAN Room Acoustics](https://noisenewsinternational.net/soundplan-room-acoustics-module/)
- [SoundPLAN Navcon](https://navcon.com/resources/software/soundplan/)

---

### NoiseModelling (Open-Source)

**Pozice na trhu:** Bezplatné open-source řešení, alternativa ke komerčním řešením

**Klíčové vlastnosti:**
- **GPL v3 licence** - zcela zdarma
- **Java knihovna** s webovým rozhraním
- **Navržen pro velmi velká městská území**
- **Propojení s H2GIS/PostGIS** pro prostorovou analýzu

**Architektura - 4 modulární Java knihovny:**
1. **Emission** - výpočet akustických výkonů souvisejících s dopravou
2. **Pathfinder** - určení profilů řezů zdroj-přijímač
3. **Propagation** - výpočet útlumu zvuku
4. **JDBC** - správa dat a komunikace mezi knihovnami

**Výpočetní metody:**
- **CNOSSOS-EU** road emission a propagation
- **CNOSSOS-EU** rail emission a propagation
- Ray tracing propagační model

**GIS integrace:**
- **OGC standardy:** WMS (Web Map Service), WPS (Web Processing Service)
- Import/export WKT, GeoJSON, SHP, OSM
- Propojení s H2GIS a PostGIS databázemi
- WMS server možnosti

**Workflow automatizace:**
- Command line rozhraní
- Grafické rozhraní
- Scriptovatelné procesy
- Národní měřítko - automatická produkce všech indikátorů a map

**Výhody:**
- Žádné licenční náklady
- Přístup ke zdrojovému kódu
- Komunita vývojářů
- Akademický výzkum

**Nevýhody:**
- Méně uživatelsky přívětivé než komerční řešení
- Vyžaduje technické znalosti (Java, SQL, GIS)
- Omezená technická podpora

**Zdroje:**
- [NoiseModelling Official](https://noise-planet.org/noisemodelling.html)
- [NoiseModelling Documentation](https://noisemodelling.readthedocs.io/)
- [NoiseModelling Open-Source](https://noisenewsinternational.net/noisemodelling-an-open-source-software-for-outdoor-noise-mapping/)

---

## 2. Technické aspekty a workflows

### 2.1 Ray Tracing a propagační modely

**Hlavní metody:**

**1. Ray Tracing (RT):**
- Sledování akustických paprsků od zdroje k přijímači
- Výpočet všech možných propagačních cest (přímé, odražené, difraktované)

**2. Angle Scanning (AS):**
- Skenování úhlů pro nalezení propagačních cest

**3. Shooting and Bouncing Rays (SBR):**
- Vystřelování paprsků z geodetické sféry centrované ve zdroji
- Přibližný počet propagačních cest s přesnou geometrickou přesností
- Používá se v MATLAB Ray Tracing Engine

**CNOSSOS-EU propagační model:**
```
Ray tracing založený přístup:
1. Výpočet všech možných propagačních cest mezi každou pozicí zdroje a každým bodem přijímače
2. Uvažování přímé, odražené a difraktované cesty
3. Pro každou cestu se vypočítá příspěvek hladiny zdroje
4. Energetické sčítání všech příspěvků
```

**Pokročilé modely:**
- **Nord2000:** Pokročilý ray-tracing model s refrakcí atmosférou a difrakcí kolem terénu
- **ODEON:** 3D akustická simulace pro interiéry
- **Simcenter 3D:** Průmyslová akustická simulace
- **EVERTims:** Real-time auralizace

**Optimalizace výpočtu:**
- Paralelizace na vícejádrových procesorech
- GPU akcelerace (perspektiva)
- Adaptivní gridové sítě

**Zdroje:**
- [Ray Tracing Noise Modeling](https://www.mdpi.com/2076-3417/15/3/1009)
- [Noise Propagation Models](https://noisemodelling.readthedocs.io/)
- [Ray Tracing Methods](https://www.researchgate.net/publication/228823125_Software_for_Calculation_of_Noise_Maps_Implemented_on_Supercomputer)

---

### 2.2 Výpočetní grid - rozlišení a výkonnost

**Klíčové parametry:**

**Grid Width (šířka mřížky):**
- Určuje vzdálenost mezi přijímacími body v hlukové mapě
- **Typické hodnoty:** 2m, 5m, 10m pro detailní mapy; 50m, 100m pro strategické mapy
- Trade-off mezi přesností a výpočetním časem

**Self-adaptive grids (samo-adaptivní mřížky):**
- Optimalizace kvality mapy při nízkých výpočetních nákladech
- Přidávání přijímačů tam, kde jsou nejvíce užitečné
- Zlepšení interpolačního výkonu

**Vliv na výsledky:**
- Příliš hrubá mřížka: nepřesné izolinky, ztráta detailu
- Příliš jemná mřížka: exponenciální nárůst výpočetního času
- Rozlišení ovlivňuje konečnou hlukovou mapu

**Výpočetní výkonnost:**
- Projekty velkého měřítka: tisíce až miliony přijímacích bodů
- Multiprocesorová podpora kritická pro realizovatelné časy výpočtu
- CadnaA 2026: zvládá projekty "jakékoliv velikosti"

**Receiver Grid strategie:**
- **Facade receivers:** body na fasádách budov (požadováno EU END)
- **Free field receivers:** volné body v prostoru pro kontury
- **Multi-height receivers:** více podlaží budov

**Zdroje:**
- [Self-adaptive grids](https://www.sciencedirect.com/science/article/abs/pii/S0003682X10002896)
- [NoiseModelling Performance](https://noise-planet.org/noisemodelling.html)

---

### 2.3 Terénní modelování a digitální výškové modely

**Typy výškových dat:**

**1. DTM (Digital Terrain Model):**
- Model "holé země" bez vegetace a budov
- Základní vrstva pro akustické výpočty
- Požadovaná přesnost pro akustiku: **0.5m vertikálně**

**2. DSM (Digital Surface Model):**
- Model povrchu včetně vegetace, budov, aut
- Používá se pro line-of-sight analýzy

**3. nDSM (Normalized DSM):**
- Rozdíl mezi DSM a DTM
- Zobrazuje výšky objektů nad terénem

**Zdroje dat:**
- **Lidar point clouds:** vysoká přesnost, automatické zpracování
- **Fotogrammetrie:** z leteckých snímků nebo UAV
- **Vrstevnice:** tradiční metoda, vyžaduje interpolaci

**Redukce šumu v DTM:**
- **2D Kalman filtering:** významné zlepšení kvality terénních povrchů
- Odstranění vegetace, budov, aut pomocí selekčních polygonů
- Interpolace pro vyplnění děr

**Software pro DTM:**
- **Surfer10:** 3D ploty terénních povrchů
- **Global Mapper:** tvorba, vizualizace, editace, analýza DTM
- **ArcGIS / QGIS:** vizualizace a analýza DSM/DTM

**Požadavky pro hlukové mapy:**
- 3D reprezentace povrchu je základní informace pro noise mapping
- Přidání budov, mostů, vegetace k DTM
- **Mapování s 0.5m vertikální přesností postačující** pro akustickou simulaci
- Kombinace DTM + DSM kritická pro plánování 5G sítí (citlivost na překážky)

**Zdroje:**
- [DTM Precision for Noise Mapping](https://www.sciencedirect.com/science/article/abs/pii/S0003682X10001507)
- [2D Kalman Filtering DTM](https://journaljgeesi.com/index.php/JGEESI/article/view/788)
- [DTM Creation](https://www.bluemarblegeo.com/blog/elevation-grid-creation-in-global-mapper-creating-a-dtm/)

---

### 2.4 3D modelování budov

**Zdroje dat o budovách:**

**1. Building Footprints + Height Data:**
- Nejběžnější metoda pro 3D city models
- Extruze footprintů na základě výškových dat
- **Problém:** budovy s více částmi různých výšek - chyba při jediné výšce

**2. LoD (Level of Detail) reprezentace:**
- **LoD1.0:** Jednoduchý blok s jednou výškou
- **LoD1.3:** Více výškových úrovní pro komplexní budovy
- **LoD2.0:** Střešní struktury, detailnější geometrie

**3. Lidar Point Clouds:**
- Automatická extrakce výšek budov
- Vysoká přesnost
- Výpočetně náročnější zpracování

**Potřebné údaje pro akustické výpočty:**
- **Building height:** výška budovy nad terénem
- **Building footprint:** 2D obrys budovy
- **Materiál fasády:** ovlivňuje reflexi a absorpci
- **Počet podlaží:** pro receiver points na fasádách

**Software workflow:**
- Import z GIS (shapefile, GeoPackage)
- Import z CAD (DXF, DWG)
- Automatická extrakce z lidar dat
- Ruční kreslení a editace

**3D vizualizace:**
- SoundPLAN: 3D vizualizace terénu a budov
- CadnaA: full 2D a 3D mapping schopnosti
- NoiseModelling: 3D view v webovém rozhraní

**Constrained Delaunay Triangulation:**
- NoiseModelling používá pro triangulaci budov a zdrojů
- Efektivní 3D mesh pro výpočty

**Automatická rekonstrukce:**
- Výzkum: automatické generování 3D dat o zdrojích hluku a prostředí z existujících dat
- Spolupráce: Rijkswaterstaat, RIVM, Kadaster a TU Delft 3D geoinformatics
- Vstupy: budovní registry, topografie, airborne LiDAR point clouds

**Zdroje:**
- [3D Building Data for Noise](https://www.researchgate.net/publication/228622472_3D_Noise_Modeling_for_Urban_Environmental_Planning_and_Management)
- [Automated 3D Reconstruction](https://www.sciencedirect.com/science/article/abs/pii/S0198971519302662)
- [TU Delft 3D Noise Data](https://3d.bk.tudelft.nl/opendata/noise3d/en.html)

---

## 3. Výpočetní metody a standardy

### 3.1 Srovnání hlavních standardů

**ISO 9613-2:**
- **Oblast použití:** Průmyslové zdroje, obecné outdoor noise
- **Propagační podmínky:** Sound propagation with wind (propagace s větrem)
- **Typ modelu:** Empirický
- **Charakteristika:** Drop-off nepříliš rychlý jako u analytických modelů

**CNOSSOS-EU (Common Noise Assessment Methods):**
- **Oblast použití:** Environmentální hluk, strategické mapování EU
- **Propagační podmínky:**
  - Downwind conditions (s větrem) - jako ISO 9613-2
  - **Plus: Homogeneous (isotropic) conditions** - neutrální počasí
- **Typ modelu:** Analytický, založený na ISO 9613-2
- **EU požadavek:** Směrnice o environmentálním hluku (END)
- **Meteorologická korekce:** Odlišná od ISO 9613-2

**Nord2000:**
- **Oblast použití:** Skandinávské země
- **Typ modelu:** Analytický
- **Pokročilé funkce:**
  - Refrakce atmosférou
  - Difrakce kolem terénu
  - Používá NMSim (National Park Service)

**NMPB-Routes-2008:**
- **Oblast použití:** Francie, silniční hluk
- **Specifika:** French national method

**FHWA (Federal Highway Administration):**
- **Oblast použití:** USA, dálniční hluk
- **Typ modelu:** Empirický

**Harmonoise/Imagine:**
- **Oblast použití:** Evropa
- **Historie:** Předchůdce CNOSSOS-EU

**CONCAWE:**
- **Oblast použití:** Průmyslové plynovody a petrochemie
- **Typ modelu:** Empirický

---

### 3.2 Validace a přesnost výpočetních metod

**Problém ambiguity v ISO 9613-2:**
```
Rozdíly mezi implementacemi stejného standardu:
- Jednoduché situace: až 5 dB rozdíl
- Komplexní situace: až 10 dB rozdíl
- Příčina: ambiguity ve standardu, ne chyby software
```

**ISO 17534-3 - Quality Assurance:**
- Standard pro quality requirements implementace
- Testovací případy (test cases)
- **Benefit:** Redukce rozdílů mezi různými softwary
- Všechny softwary se stejnými vstupními daty by měly dávat téměř identické výsledky v úzkém rozpětí

**Doporučení:**
- Využití doporučení ISO 17534-3 pro ISO 9613
- Stejný pozitivní efekt očekáván pro CNOSSOS-EU
- iNoise: "Quality Assured Implementation" - garantovaná přesnost

**Srovnání analytických vs. empirických modelů:**
```
Analytické modely (NORD2000, CNOSSOS-EU, ENM):
- Následují podobný pattern
- Rychlejší drop-off s vzdáleností

Empirické modely (CONCAWE, ISO-9613-2):
- Pomalejší drop-off
- Ne tak rychle klesají jako analytické modely
```

**Praktické dopady:**
- Výběr modelu závisí na aplikaci a požadavcích legislativy
- Pro strategické mapování v EU: CNOSSOS-EU povinný
- Pro průmyslový hluk: ISO 9613-2 nebo CNOSSOS-EU
- Pro validaci: porovnání s měřeními na místě

**Zdroje:**
- [ISO 9613 vs CNOSSOS-EU Comparison](https://www.sea-acustica.es/INTERNOISE_2019/Fchrs/Proceedings/2149.pdf)
- [Quality Assured ISO Implementation](https://noisenewsinternational.net/quality-assured-implementation-of-iso-9613-in-inoise/)
- [ISO 17534 Standard](https://www.ingentaconnect.com/contentone/ince/incecp/2019/00000259/00000002/art00091)

---

## 4. Datové vstupy a integrace

### 4.1 Dopravní data - AADT a emisní modely

**AADT (Annual Average Daily Traffic):**
- Klíčový vstup pro silniční hluk
- Definován na hlavních i vedlejších silnicích
- **Rozdělení na kategorie vozidel:**
  - Osobní automobily (cars)
  - SUV
  - Lehká užitková vozidla (light commercial vehicles)
  - Nákladní vozidla (rigid trucks)
  - Návěsové soupravy (articulated trucks)

**Typické vstupy pro dopravní hluk:**
- AADT nebo AM/PM Peak Hour data
- Posted speed limits (povolená rychlost)
- Typ vozovky (road surface type)
- Gradient (sklon)
- **73 tříd vozidel** v pokročilých modelech:
  - Hlavní typ vozidla
  - Typ paliva
  - Technologická úroveň (Euro 3, 4, 5, 6...)

**Emisní modely (Noise Emission Models):**

**1. CNOSSOS-EU:**
- Nové evropské emisní modely pro silniční a kolejovou dopravu
- Kategorizace podle typu vozidla a rychlosti
- Frekvenčně závislé emisní hladiny

**2. Regionální modely:**
- **Swiss SonRoad model**
- **French NMPB-Routes-2008**
- **Scandinavian Nord2000**
- **American FHWA model**

**3. NoiseModelling implementace:**
- Obsahuje CNOSSOS road emission modely
- Série knihoven pro implementaci algoritmů

**Problémy s daty:**
- Address-level exposure studie závisí na přesnosti AADT s dobrou geografickou pokrytím
- Malé silnice: metody pro zlepšení odhadu dopravního toku
- Chybějící data: predikce z leteckých snímků a řídkých road counts

**Pokročilé vstupy:**
- **Detailní trajektorie vozidel z UAV:** pro přesné congestion a noise emission odhady
- **Real-time traffic flow:** dynamické hlukové mapy
- **Emisní simulace:** simulace spotřeby paliva a emisí pro všechny relevantní třídy vozidel

**Zdroje:**
- [Traffic Noise Modeling Best Practices](https://environment.transportation.org/wp-content/uploads/2021/05/noise_summit_session8.pdf)
- [Road Noise Emission Models Review](https://link.springer.com/article/10.1007/s40726-024-00319-5)
- [AADT and Transport Emissions](https://www.sciencedirect.com/science/article/pii/S0966692316307244)

---

### 4.2 Databáze zdrojů a knihovny akustických výkonů

**Typické struktury databází:**

**1. NoiseModelling - 4 modulární knihovny:**
```
Emission Library:
- Výpočet traffic-related sound power levels
- Implementace emisních modelů (CNOSSOS-EU)

Pathfinder Library:
- Určení source-receiver cut profiles
- Ray tracing paths

Propagation Library:
- Výpočet sound attenuation
- Implementace propagačních algoritmů

JDBC Library:
- Data management
- Inter-library komunikace
- Propojení s H2GIS/PostGIS databázemi
```

**2. SoundPLAN - Emission Library:**
```
Obsahuje data pro:
- Noise emission & sound levels
- Vehicular noise emission (emission data vozidel)
- Aircraft data (letecká data)
- Sound source directivity (směrovost zdrojů)
- 24 hour road traffic patterns (dopravní profily)
- Train emission (emisní data vlaků)
- Sound transmission (přenos zvuku)
- Noise assessment (posuzování hluku)

Funkce:
- Převod sound pressure measurements -> sound power level
- Zpětný výpočet z měření
```

**3. Online Database of Industrial Noise Sources:**
```
Poskytuje:
- Equivalent noise level
- One-third octave noise spectrum
- Near field measurements

Přístup:
- Standard SQL queries
- Vhodné pro software tools
```

**4. iNoise - SourceDB:**
```
Přednastavená knihovna:
- Sound power level data
- Data z technických specifikací výrobců
- Rychlé vytváření modelů bez nutnosti hledat data

Typy zdrojů:
- Road sources
- Railway sources
- Point/line/area sources
- Wind turbines
```

**Struktura Sound Power Level:**
```
Akustický výkon zdroje (Lw):
- Decibel hodnota reprezentující celkový akustický výstup
- Může být frekvenčně závislý (oktávová pásma, 1/3 oktávová pásma)
- Může mít směrovost (directivity)

Directivity (Q):
- Q=1: Omnidirectional (všesměrový, volný prostor)
- Q=2: Hemispherical (hemisférický, na zemi)
- Q=4: Quarter space (čtvrt prostoru, roh místnosti)
- Q=8: Eighth space (osmina prostoru, roh na zemi)
```

**Database workflow v softwaru:**
1. **Import zdrojů** z knihovny
2. **Úprava parametrů** (pozice, orientace, výkon)
3. **Výpočet emisní hladiny** (Lw)
4. **Propagační výpočet** (Lw -> Lp na přijímačích)
5. **Výsledné hlukové mapy**

**Zdroje:**
- [NoiseModelling Architecture](https://noisenewsinternational.net/noisemodelling-an-open-source-software-for-outdoor-noise-mapping/)
- [SoundPLAN Emission Library](https://navcon.com/resources/software/soundplan/)
- [Industrial Noise Database](https://link.springer.com/chapter/10.1007/978-3-030-54136-1_16)

---

### 4.3 GIS integrace a datové formáty

**Import formáty podporované profesionálními softwary:**

**CadnaA (30+ formátů):**
```
CAD formáty:
- DXF, DWG (AutoCAD)

GIS formáty:
- Shapefile (SHP)
- GeoPackage (.gpkg) - novinka v 2026
- SOSI 5.0 - novinka v 2026

Web služby:
- Google Maps
- OpenStreetMap (OSM)
- WMS Server

Další:
- Various GIS platforms
```

**NoiseModelling:**
```
Import:
- WKT (Well-Known Text)
- GeoJSON
- SHP (Shapefile)
- OSM (OpenStreetMap)

Export:
- Stejné formáty
- Plus: WMS (Web Map Service)
- WPS (Web Processing Service)

Databáze:
- H2GIS (embedded spatial database)
- PostGIS (PostgreSQL extension)
```

**SoundPLAN:**
```
Import/Export:
- ESRI Shapefiles (with any object properties)
- Shape export of results
- GeoJSON
- KML
```

**Výstupní formáty (reporting):**

**Grafické formáty:**
```
- BMP (high-resolution)
- JPG
- PDF
- PNG
- HPGL
- Adobe PostScript
- Clipboard copying
```

**CAD formáty:**
```
- DXF file format
- DWG file format
```

**GIS formáty:**
```
- SHP (Shapefile)
- GeoJSON
- KML (Google Earth, Google Maps)
```

**Dokumentové formáty:**
```
- PDF
- Microsoft Word
- Microsoft Excel
- Comma-separated files (CSV)
```

**Speciální formáty:**
```
- JSON (full configuration of all settings) - doporučeno
```

**GIS workflow integrace:**

**1. Data Import:**
```
Terrain data (DTM) → Import do software
Building footprints → Assign heights
Road network → Assign traffic data
Receiver points → Define grid
```

**2. Calculation:**
```
Software calculation engine
↓
Results in internal format
```

**3. Export:**
```
Results → GIS format (SHP, GeoJSON)
↓
Import do GIS (ArcGIS, QGIS)
↓
Further analysis and visualization
```

**4. Integration with external GIS:**
```
LIMA: Modules can run behind external software
      Full integration in other GIS systems

CadnaA: Connected to GIS systems
        Export to common GIS/CAD formats

NoiseModelling: Built on H2GIS/PostGIS
                Native spatial database
                OGC standards (WMS, WPS)
```

**Spatial database výhody:**
- Efektivní správa velkých prostorových datasetů
- SQL queries pro analýzy
- Spatial indexing pro rychlé vyhledávání
- Multi-user access
- Integration s GIS platformami

**Zdroje:**
- [CadnaA Connectivity](https://www.datakustik.com/products/cadnaa/features/connectivity/)
- [NoiseModelling GIS](https://noise-planet.org/noisemodelling.html)
- [Data Exporting](http://www.noisemap.ltd.uk/wpress/features/data-exporting/)

---

## 5. Výkonnost a optimalizace

### 5.1 Large-scale calculation optimization

**Výzva Environmental Noise Directive (END):**
```
EU požadavky:
- Strategické hlukové mapy každých 5 let
- Města nad 100,000 obyvatel
- Umožnění přímého srovnání mezi městy
- Společná metodika: CNOSSOS-EU
```

**Problém výkonnosti:**
```
Current noise maps:
- Komplexní emisní a propagační modely
- Obrovský počet regionálních gridových bodů
- Vysoká spotřeba výpočetního času
- Omezení: real-time update a large-scale aplikace
```

**Optimalizační strategie:**

**1. Hybrid Modeling:**
```
Kombinace metod:
- Tradiční CNOSSOS-EU emisní modelování
- Multivariate nonlinear regression modeling
- Efektivní výpočet pro large-region dynamic traffic noise maps
```

**2. Self-Adaptive Grid:**
```
Princip:
- Optimalizace kvality mapy při nízkých nákladech
- Přidávání receivers tam, kde jsou nejvíce užitečné
- Enhancement interpolačního výkonu

Trade-off:
- Grid size = kompromis mezi přesností a výpočetním úsilím
- Příliš jemný grid: exponenciální nárůst času
```

**3. Multiprocessor Support:**
```
CadnaA 2026:
- 64-bit technologie
- Multiprocesor support
- Zvládá projekty "jakékoliv velikosti"

LIMA:
- "Nejrychlejší výpočetní jádra"
- Optimalizováno pro rychlost
```

**4. Automatizace na národním měřítku:**
```
NoiseModelling use case:
- První automatická produkce všech indikátorů a map
- National scale (celostátní měřítko)
- Open-source calculation tool
```

**5. Grid Spacing strategie:**
```
Detailní mapy (local):
- 2m, 5m, 10m spacing
- Vysoká přesnost, vyšší výpočetní čas
- Pro lokální studie a detailní analýzy

Strategické mapy (END):
- 50m, 100m spacing
- Nižší přesnost, přijatelný výpočetní čas
- Pro velké městské oblasti
```

**Výpočetní výkonnost - příklady:**
```
Malý projekt (local industrial site):
- 1000-10000 receiver points
- Minuty až hodiny
- Desktop počítač postačující

Střední projekt (městská část):
- 10,000-100,000 receiver points
- Hodiny až dny
- Workstation doporučená

Velký projekt (město, region):
- 100,000-1,000,000+ receiver points
- Dny až týdny bez optimalizace
- High-performance computing, multiprocesor kritický
```

**Near-real-time Dynamic Noise Mapping:**
- Calibrované mikroskopické dopravní simulace
- Real-time traffic data
- Dynamic exposure assessment
- Výzva: rychlost výpočtu vs. přesnost

**Zdroje:**
- [Large-Region Dynamic Noise Maps](https://www.sciencedirect.com/science/article/abs/pii/S0269749123008448)
- [Strategic Noise Mapping END](https://www.researchgate.net/publication/40833292_Strategic_environmental_noise_mapping_Methodological_issues_concerning_the_implementation_of_the_EU_Environmental_Noise_Directive_and_their_policy_implications)
- [Near-Real-Time Dynamic Mapping](https://www.sciencedirect.com/science/article/pii/S136192092300319X)

---

### 5.2 Techniques to accelerate noise mapping

**Z výzkumu DataKustik (CadnaA):**

**1. Optimalizace ray tracing:**
- Dvě strategie: Ray Tracing (RT) a Angle Scanning (AS)
- Efektivní hledání propagačních cest
- Paralelní zpracování více paprsků

**2. Spatial indexing:**
- Rychlé vyhledávání zdrojů a přijímačů v blízkosti
- R-tree nebo grid-based indexing
- Redukce počtu výpočtů source-receiver párů

**3. Caching intermediate results:**
- Uložení často používaných výpočtů
- Zvláště pro terrain profiles a building diffraction
- Trade-off: paměť vs. výpočetní čas

**4. Simplifikace geometrie:**
- Level of Detail (LoD) přístupy
- Detailní geometrie pouze kde je potřeba
- Vzdálené objekty: zjednodušené reprezentace

**5. Incremental calculation:**
- Pouze změněné části při updates
- "What-if" scenarios: rychlé přepočty
- Důležité pro design optimalizaci (např. bariér)

**6. GPU acceleration (perspektiva):**
- Ray tracing ideální pro GPU paralelizaci
- Tisíce současných výpočtů
- Zatím omezené využití v komerčních noise tools

**Best practices pro uživatele:**
- Rozumný grid spacing podle účelu
- Omezení výpočetní oblasti (area of interest)
- Simplifikace terénního modelu kde možné
- Využití multiprocesorové podpory
- Batch processing pro více scénářů

**Zdroje:**
- [CadnaA Mapping Techniques](https://www.datakustik.com/fileadmin/user_upload/e-Learning-Center/Papers-and-Publications/2008_ICSV_MappingTechniques_WP.pdf)

---

## 6. Architektura a deployment

### 6.1 Desktop vs. Web-based vs. Cloud

**Desktop Applications:**

**Výhody:**
```
+ Více výpočetního výkonu (využití lokálních zdrojů)
+ Rychlejší, stabilnější uživatelský zážitek
+ Práce offline
+ Žádná závislost na internetu
+ Lepší výkon pro náročné výpočty
```

**Nevýhody:**
```
- System requirements (závislost na OS)
- Nutnost instalace
- Ruční updates
- Omezená spolupráce mezi uživateli
- Data na lokálním zařízení
```

**Příklady:**
- CadnaA (USB dongle nebo cloud license)
- SoundPLAN (desktop aplikace)
- LIMA/Predictor (desktop, ale s cloud možnostmi)

---

**Web-based Applications:**

**Výhody:**
```
+ Přístup z jakéhokoliv zařízení s browserem
+ Platformně nezávislé (Windows, Mac, Linux)
+ Žádná instalace
+ Automatické updates na serveru
+ Snadná spolupráce a sdílení dat
+ Centrální správa dat
+ Vhodné pro remote teams
```

**Nevýhody:**
```
- Závislost na internetu
- Potenciálně pomalejší (latence sítě)
- Delší časy načítání
- Méně stabilní uživatelský zážitek
- Omezený výpočetní výkon (browser limity)
```

**Příklady:**
- NoiseModelling (web interface)
- dBmap.net (web-based noise mapping tool)

---

**Cloud-based (hybrid) Applications:**

**Výhody:**
```
+ Elasticita cloud infrastruktury
+ Automatická škálovatelnost podle zátěže
+ Handling traffic spikes
+ Centrální updates
+ Možnost kombinace: desktop app + cloud compute
+ Real-time collaboration
+ Přístup odkudkoliv
```

**Nevýhody:**
```
- Náklady na cloud infrastrukturu
- Nutnost připojení k internetu
- Potenciální bezpečnostní obavy (data v cloudu)
- Vendor lock-in riziko
```

**Deployment modely:**
```
1. Desktop-only:
   - Tradiční instalace
   - Data a výpočty lokálně

2. Desktop + Cloud license:
   - Desktop aplikace
   - Cloud licensing (CadnaA)
   - Flexibilní licensing model

3. Web-based:
   - Vše v browseru
   - Server-side výpočty

4. Hybrid:
   - Desktop UI
   - Cloud výpočty pro náročné operace
   - Best of both worlds

5. Multi-platform:
   - Runs anywhere: web, mobile, desktop
   - Příklad: Koala Noise Suppression
   - Flexibility v deploymentu
```

**Trend v noise software:**
```
Současnost:
- Dominance desktop aplikací (CadnaA, SoundPLAN, LIMA)
- Cloud licensing stává se běžným

Budoucnost:
- Posun k hybrid modelům
- Web-based rozhraní + cloud compute
- Mobile access pro field work
- Real-time collaboration features
```

**Doporučení pro nový software:**
```
Optimální přístup:
1. Core calculation engine - modulární knihovny (NoiseModelling vzor)
2. Desktop aplikace pro power users (rychlý, robustní)
3. Web rozhraní pro accessibility (přístup odkudkoliv)
4. Cloud compute option pro velké projekty
5. API pro integraci s jinými systémy
6. Mobile app pro field work a prezentace
```

**Zdroje:**
- [Web vs Cloud Apps](https://www.ramotion.com/blog/web-based-vs-cloud-based-apps/)
- [Cloud vs Desktop Software](https://www.syntacticsinc.com/news-articles-cat/cloud-based-software/)
- [Koala Multi-platform](https://picovoice.ai/platform/koala/)

---

### 6.2 Software architecture patterns

**1. Modulární architektura (SoundPLAN model):**
```
Core Engine
    ↓
Optional Modules:
├── Industrial Noise Module
├── Room Acoustics Module
├── Barrier Optimization Module
├── Emission Library Module
└── ... další moduly

Výhody:
+ Přizpůsobení individuálním potřebám
+ Platba pouze za potřebné moduly
+ Snadnější vývoj a údržba
+ Nezávislé updates modulů
```

**2. Library-based architektura (NoiseModelling model):**
```
Application Layer
    ↓
Four Modular Libraries:
├── Emission Library (sound power calculations)
├── Pathfinder Library (source-receiver paths)
├── Propagation Library (attenuation calculations)
└── JDBC Library (data management)
    ↓
Spatial Database (H2GIS/PostGIS)

Výhody:
+ Čistá separace concerns
+ Možnost použití jako Java library
+ Testovatelnost jednotlivých komponent
+ Open-source community contributions
```

**3. All-in-one s otevřenou strukturou (LIMA model):**
```
Complete Calculation Suite
    ↓
Open Architecture
    ↓
├── Can run behind external software (ArcGIS)
├── Integration APIs
├── Command line interface
└── Macro functionality

Výhody:
+ Kompletní řešení
+ Flexibilita integrace
+ Automation možnosti
+ Preferováno pro integraci s jinými tools
```

**4. One-piece file-based (CadnaA model):**
```
"One software - one file per project"

Project File (.cna):
├── Terrain data
├── Buildings
├── Sources
├── Receivers
├── Calculation settings
├── Results
└── Visualization settings

Výhody:
+ Jednoduchá správa projektů
+ Snadné sdílení
+ Konzistence dat
+ Žádné složité databázové struktury
```

**Společné architektonické komponenty:**

**A. Data Layer:**
```
├── Terrain/DTM storage
├── Building database
├── Source library (sound powers)
├── Material library (absorption, reflection)
├── Traffic data
└── Calculation results
```

**B. Calculation Engine:**
```
├── Emission calculations
├── Propagation calculations (ray tracing)
├── Ray-barrier interactions
├── Reflection/diffraction
├── Ground effect
└── Meteorological corrections
```

**C. Visualization Layer:**
```
├── 2D map rendering
├── 3D visualization
├── Contour generation
├── Color schemes
└── Animation (for time-series)
```

**D. Import/Export Layer:**
```
├── GIS formats (SHP, GPKG, GeoJSON)
├── CAD formats (DXF, DWG)
├── Web services (WMS, OSM)
├── Report generation (PDF, Word, Excel)
└── Graphics export (BMP, JPG, PNG)
```

**E. User Interface Layer:**
```
├── Desktop GUI
├── Web interface
├── Command line interface
├── Scripting/macro support
└── API for external integration
```

**Best practices z existujících řešení:**
```
1. Separace calculation engine od UI
   → Možnost více frontendů (desktop, web)

2. Plugin/module architecture
   → Rozšiřitelnost

3. Spatial database integration
   → Efektivní správa prostorových dat

4. Standardní formáty (GIS, CAD)
   → Interoperabilita

5. Scripting/API support
   → Automatizace workflows

6. Quality assurance (ISO 17534)
   → Důvěryhodnost výsledků
```

---

## 7. Návrh vlastního řešení

Na základě kompletního průzkumu existujících softwarových řešení navrhuji následující architekturu pro moderní noise processing software.

---

### 7.1 Architektura systému

**Název projektu:** **AcoustiX** (pracovní název)

**Filosofie:**
- Otevřená, modulární architektura
- Web-first s desktop capabilities
- Důraz na automatizaci a scriptovatelnost
- Česká lokalizace a compliance s českou legislativou
- Open calculation engine, commercial UI/services

---

### 7.2 Technologický stack

**Backend:**
```typescript
Calculation Engine:
├── Jazyk: TypeScript/Node.js + Rust (pro výpočetně náročné části)
├── Spatial Database: PostGIS (PostgreSQL extension)
├── API: GraphQL (flexibilnější než REST)
├── Calculation Workers: Bull Queue + Redis
└── File Storage: MinIO (S3-compatible)

Výhody tohoto stacku:
+ TypeScript: Type safety, moderní ekosystém
+ Rust: Maximální výkon pro ray tracing
+ PostGIS: Mature spatial database, GIS integrace
+ GraphQL: Efektivní data fetching, real-time subscriptions
+ Bull Queue: Spolehlivé zpracování dlouhotrvajících výpočtů
```

**Frontend:**
```typescript
Web Application:
├── Framework: Next.js 16 (již používáme)
├── UI Library: Tailwind CSS + shadcn/ui
├── 3D Visualization: Three.js / Babylon.js
├── 2D Maps: Mapbox GL JS nebo OpenLayers
├── Charts: Chart.js (již používáme) + Plotly pro 3D
└── State Management: Zustand nebo React Query

Desktop Application (optional):
├── Electron wrapper kolem web app
├── Native file system access
└── Offline capabilities
```

**Výpočetní moduly:**
```
Core Calculation Libraries (Rust):
├── emission_calc (emisní výpočty)
│   ├── CNOSSOS-EU road
│   ├── CNOSSOS-EU rail
│   ├── ISO 9613-2 industrial
│   └── Custom emission models
├── propagation_calc (propagační výpočty)
│   ├── Ray tracing engine
│   ├── Diffraction algorithms
│   ├── Reflection calculations
│   └── Ground effect
├── pathfinder (hledání cest)
│   ├── Source-receiver path finding
│   ├── Obstacle detection
│   └── Barrier interactions
└── terrain_ops (terénní operace)
    ├── DTM/DSM processing
    ├── Triangulation
    └── Line-of-sight calculations

TypeScript API layer:
└── WASM bindings pro Rust moduly
```

---

### 7.3 Datový model

**PostgreSQL + PostGIS schema:**

```sql
-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bounds GEOMETRY(POLYGON, 4326), -- Project area
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    owner_id UUID REFERENCES users(id)
);

-- Terrain (DTM)
CREATE TABLE terrain (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    geom GEOMETRY(TIN, 4326), -- Triangulated Irregular Network
    resolution FLOAT, -- meters
    source VARCHAR(50), -- 'lidar', 'manual', 'import'
    metadata JSONB
);

-- Buildings
CREATE TABLE buildings (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    geom GEOMETRY(POLYGON, 4326), -- footprint
    height FLOAT NOT NULL, -- meters
    floors INTEGER,
    material_id UUID REFERENCES materials(id),
    name VARCHAR(255),
    metadata JSONB
);

-- Noise Sources
CREATE TABLE noise_sources (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50) NOT NULL, -- 'point', 'line', 'area'
    geom GEOMETRY, -- Appropriate geometry for type
    name VARCHAR(255),
    source_data JSONB, -- Type-specific data
    created_at TIMESTAMP DEFAULT NOW()
);

-- Point Sources
CREATE TABLE point_sources (
    source_id UUID PRIMARY KEY REFERENCES noise_sources(id),
    lw_total FLOAT, -- Total sound power (dB)
    lw_octave FLOAT[], -- Octave band values (8 bands)
    height FLOAT, -- meters above ground
    directivity_q INTEGER DEFAULT 2, -- 1, 2, 4, 8
    operation_schedule JSONB -- Time periods
);

-- Line Sources (roads, railways)
CREATE TABLE line_sources (
    source_id UUID PRIMARY KEY REFERENCES noise_sources(id),
    traffic_data JSONB, -- AADT, vehicle mix, speeds
    road_surface VARCHAR(100),
    gradient FLOAT, -- percent
    emission_model VARCHAR(50) -- 'CNOSSOS_road', etc.
);

-- Area Sources
CREATE TABLE area_sources (
    source_id UUID PRIMARY KEY REFERENCES noise_sources(id),
    lw_per_m2 FLOAT, -- Sound power per square meter
    lw_octave FLOAT[],
    operation_schedule JSONB
);

-- Receivers
CREATE TABLE receivers (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50), -- 'grid', 'facade', 'point'
    geom GEOMETRY(POINT, 4326),
    height FLOAT, -- meters above ground
    name VARCHAR(255),
    metadata JSONB
);

-- Receiver Grids
CREATE TABLE receiver_grids (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    bounds GEOMETRY(POLYGON, 4326),
    spacing FLOAT, -- meters
    height FLOAT, -- meters above ground
    auto_generated BOOLEAN DEFAULT true
);

-- Barriers
CREATE TABLE barriers (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    geom GEOMETRY(LINESTRING, 4326),
    height FLOAT, -- meters
    material_id UUID REFERENCES materials(id),
    absorption_coefficients FLOAT[] -- By frequency
);

-- Materials Library
CREATE TABLE materials (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'ground', 'barrier', 'building'
    absorption_octave FLOAT[], -- Absorption coefficients
    reflection_coefficient FLOAT,
    is_default BOOLEAN DEFAULT false
);

-- Calculation Jobs
CREATE TABLE calculation_jobs (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50), -- 'full_map', 'receiver_points', 'scenario'
    status VARCHAR(50), -- 'queued', 'running', 'completed', 'failed'
    progress INTEGER DEFAULT 0, -- 0-100
    settings JSONB, -- Calculation parameters
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Calculation Results
CREATE TABLE calculation_results (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES calculation_jobs(id),
    receiver_id UUID REFERENCES receivers(id),
    laeq FLOAT, -- A-weighted equivalent level
    laeq_day FLOAT,
    laeq_evening FLOAT,
    laeq_night FLOAT,
    lden FLOAT, -- Day-Evening-Night level
    lmax FLOAT,
    lmin FLOAT,
    percentiles JSONB, -- L5, L10, L50, L90, L95
    octave_bands FLOAT[], -- Results by frequency
    source_contributions JSONB -- Contribution from each source
);

-- Noise Maps (raster results)
CREATE TABLE noise_maps (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES calculation_jobs(id),
    indicator VARCHAR(50), -- 'LAeq', 'Lden', 'Lnight'
    resolution FLOAT, -- meters
    raster RASTER, -- PostGIS raster type
    contours GEOMETRY(MULTIPOLYGON, 4326), -- Generated contours
    metadata JSONB
);
```

---

### 7.4 Klíčové funkce a workflows

**1. Project Setup Workflow:**
```
User creates project
    ↓
Define project boundary (draw on map or import)
    ↓
Import base data:
├── DTM (from file, WMS, or manual)
├── Buildings (OSM, cadastre, CAD, manual)
├── Roads (OSM, shapefile)
└── Existing sources (import or create)
    ↓
Project ready for source definition
```

**2. Source Definition Workflow:**
```
Choose source type:
├── Point Source
│   ├── Manual input (Lw, position, height)
│   ├── From library (database of equipment)
│   └── From measurement (reverse calculation)
│
├── Line Source (Road/Railway)
│   ├── Draw or import geometry
│   ├── Input traffic data (AADT, mix, speed)
│   ├── Select emission model
│   └── Automatic emission calculation
│
└── Area Source
    ├── Draw polygon
    ├── Input Lw per m²
    └── Define operation schedule

All sources:
├── Octave band data (optional)
├── Time patterns (24h, day/evening/night)
├── Directivity (for point sources)
└── Metadata (name, notes, tags)
```

**3. Receiver Definition Workflow:**
```
Receiver options:
├── Grid
│   ├── Define area
│   ├── Set spacing (2m, 5m, 10m, 50m, 100m)
│   ├── Set height (standard: 4m above ground)
│   └── Auto-generate points
│
├── Facade Points
│   ├── Select buildings
│   ├── Define floors (e.g., 1.5m, 4.5m, 7.5m...)
│   └── Auto-generate on facades
│
└── Manual Points
    ├── Click on map
    ├── Set height
    └── Name the point
```

**4. Calculation Workflow:**
```
User initiates calculation
    ↓
Select calculation settings:
├── Propagation model (ISO 9613-2, CNOSSOS-EU)
├── Meteorological conditions
├── Frequency bands (A-weighted only, octave bands)
├── Indicators (LAeq, Lden, Lnight, Lday...)
├── Max reflection order (0, 1, 2...)
└── Max calculation distance
    ↓
Job queued in Bull Queue
    ↓
Background worker picks up job:
1. Load project data from PostGIS
2. For each receiver:
   a. Find visible sources (line-of-sight)
   b. Calculate propagation paths (direct, reflected, diffracted)
   c. Apply attenuation (distance, air, barrier, ground)
   d. Sum contributions from all sources
3. Store results in database
4. Generate noise map rasters
5. Create contour lines
    ↓
User notified (real-time via WebSocket)
    ↓
Results available for visualization
```

**5. Visualization & Analysis Workflow:**
```
View results:
├── 2D Map View
│   ├── Color-coded contours (noise map)
│   ├── Building overlays
│   ├── Source markers
│   ├── Receiver points with values
│   └── Interactive tooltip (click for details)
│
├── 3D View
│   ├── Terrain surface
│   ├── Extruded buildings
│   ├── 3D noise map (height = noise level)
│   └── Rotate, zoom, pan
│
├── Data Tables
│   ├── List of receivers with values
│   ├── Sort, filter, export
│   └── Source contribution breakdown
│
└── Charts
    ├── Receiver comparison
    ├── Time series (if multiple calculations)
    ├── Octave band spectra
    └── Exceedance statistics

Analysis tools:
├── Compare scenarios (before/after)
├── Barrier optimization (suggest optimal height/position)
├── Exposure assessment (population in noise zones)
└── Compliance check (against limit values)
```

**6. Reporting Workflow:**
```
Generate report:
├── Template selection
│   ├── Quick summary
│   ├── Detailed technical report
│   ├── Public presentation
│   └── Custom template
│
├── Content configuration
│   ├── Include maps (auto-generated)
│   ├── Include tables
│   ├── Include charts
│   ├── Source details
│   └── Calculation settings
│
├── Export format
│   ├── PDF (primary)
│   ├── Word (editable)
│   ├── HTML (web sharing)
│   └── Excel (data only)
│
└── Language
    ├── Czech (default)
    └── English
```

---

### 7.5 Unikátní funkce a konkurenční výhody

**1. AI-Assisted Source Identification:**
```
Feature: Automatic source detection from measurements

Workflow:
1. User imports measurement data (LAeq time series)
2. AI analyzes patterns (time of day, variability, spectrum)
3. Suggests probable sources:
   - "Likely road traffic (constant, A-weighted, daily pattern)"
   - "Possible industrial source (intermittent, low frequency)"
   - "Aircraft flyovers detected (peaks, characteristic spectrum)"
4. User confirms and system creates sources automatically

Technology:
- Machine learning model trained on labeled measurement data
- Pattern recognition in time and frequency domain
- Integration with SourceDB for typical spectra
```

**2. Real-Time Collaborative Editing:**
```
Feature: Multiple users working on same project simultaneously

Implementation:
- WebSocket connections for real-time updates
- Operational Transformation (OT) for conflict resolution
- User cursors visible on map
- Change history and undo/redo
- Comments and annotations on map

Use case:
- Team working on large strategic noise mapping project
- Consultant and client reviewing results together
- Field technician adding measurement points while engineer analyzes
```

**3. Automated Barrier Optimization:**
```
Feature: AI-driven barrier design suggestions

Workflow:
1. User defines:
   - Protected receivers (e.g., residential buildings)
   - Target noise reduction (e.g., -5 dB)
   - Constraints (max height, available space, budget)
2. Genetic algorithm runs multiple scenarios:
   - Varies barrier position, height, length
   - Evaluates noise reduction vs. cost
3. System presents top 5 solutions:
   - Visual comparison on map
   - Cost-benefit analysis
   - Expected noise reduction at each receiver
4. User selects preferred solution or refines constraints

Advantages over manual trial-and-error:
+ Finds optimal solutions faster
+ Explores more possibilities
+ Quantifies trade-offs
```

**4. Dynamic Noise Mapping Integration:**
```
Feature: Real-time noise maps from live traffic data

Data sources:
- Traffic count API (e.g., from city traffic management)
- Weather API (wind speed, temperature for corrections)
- Optional: distributed sound level meter network

Workflow:
1. System polls traffic API every 15 minutes
2. Updates AADT for road sources automatically
3. Re-runs calculation for updated grid
4. Generates new noise map
5. Public dashboard displays current noise situation

Use case:
- City noise monitoring portal
- Event planning (festivals, construction)
- Validation of noise models with measurements
```

**5. Integrated Measurement Management:**
```
Feature: Direct integration with sound level meters

Capabilities:
- Import from popular brands (Brüel & Kjær, Norsonic, Cirrus, etc.)
- Automatic georeferencing (GPS data from meter)
- Time series analysis
- Statistical analysis (LAeq, Lmin, Lmax, percentiles)
- Octave band data
- Audio recording correlation

Workflow:
1. Connect meter or import data file
2. System automatically:
   - Creates measurement points on map (from GPS)
   - Imports time series data
   - Calculates statistics
   - Displays on charts
3. Compare with calculated values:
   - Validation overlay on map
   - Difference analysis
   - Model calibration suggestions
```

**6. Mobilní aplikace pro field work:**
```
Feature: Mobile app for data collection and quick calculations

Capabilities:
- View project on mobile device
- Add measurement points on-site (with GPS)
- Quick noise level checks (phone microphone - approximate)
- Photo documentation with automatic georeferencing
- Voice notes attached to locations
- Offline mode (sync when back online)
- View calculated results on-site

Use case:
- Field technician verifying model predictions
- Quick checks during site visit
- Client presentations on-site
```

**7. Compliance Checking Dashboard:**
```
Feature: Automatic checking against Czech noise limits

Implementation:
- Database of Czech limit values (hygienické limity)
  - By zone type (residential, mixed, industrial, etc.)
  - By time period (day, evening, night)
  - By source type
- Color-coded map showing compliance:
  - Green: below limit
  - Yellow: close to limit (within 3 dB)
  - Red: exceeding limit
- Automatic report of exceedances:
  - List of receivers over limit
  - By how much
  - Affected population count (if building occupancy data available)
  - Suggestions for mitigation

Czech-specific features:
- Integration with RÚIAN (Register územní identifikace)
- Support for Czech technical standards (ČSN)
- Czech terminology and units
```

**8. Scenario Comparison Tool:**
```
Feature: Side-by-side comparison of multiple scenarios

Use cases:
- Before vs. after barrier installation
- Different traffic scenarios (current vs. future)
- Alternative mitigation measures
- Seasonal variations

Visualization:
- Split screen map view
- Difference map (Scenario B - Scenario A)
- Receiver-by-receiver comparison table
- Statistical summary (% of receivers improved/worsened)
- Cost-benefit if cost data entered
```

**9. Public Portal Mode:**
```
Feature: Publish selected results to public web portal

Capabilities:
- Read-only view of noise maps
- Search by address
- Check noise level at any point
- Educational content (what is dB, sources of noise, etc.)
- Feedback form for citizens
- Newsletter subscription for updates

Privacy controls:
- Admin selects what to publish
- Can hide sensitive data (e.g., specific industrial sources)
- Version control (publish specific calculation version)

Use case:
- Municipalities publishing strategic noise maps (EU END requirement)
- Public consultation for new infrastructure
- Transparency and citizen engagement
```

**10. API pro integraci:**
```
Feature: RESTful and GraphQL API for external integration

Capabilities:
- CRUD operations on projects, sources, receivers
- Trigger calculations programmatically
- Retrieve results in JSON or GeoJSON
- Webhook notifications when calculations complete
- Batch operations for automation

Use cases:
- Integration with city GIS systems
- Automated report generation from external systems
- Connection to traffic simulation software
- Research and batch processing
```

---

### 7.6 Technická implementace klíčových algoritmů

**Ray Tracing Engine (Rust):**

```rust
// Pseudo-code pro základní ray tracing

struct Ray {
    origin: Point3D,
    direction: Vector3D,
    energy: f64, // Zbývající akustická energie
    reflections: u8, // Počet odrazů
}

struct PropagationPath {
    ray: Ray,
    distance: f64,
    attenuation: f64,
    ground_effect: f64,
    barrier_effect: f64,
    air_absorption: f64,
}

fn trace_ray(
    source: &Source,
    receiver: &Receiver,
    scene: &Scene,
    max_reflections: u8
) -> Vec<PropagationPath> {
    let mut paths = Vec::new();

    // 1. Direct path
    if is_line_of_sight(source.position, receiver.position, &scene) {
        let direct_path = calculate_direct_path(source, receiver, &scene);
        paths.push(direct_path);
    }

    // 2. Reflected paths
    if max_reflections > 0 {
        for building in &scene.buildings {
            for face in &building.faces {
                // Image source method
                let image_source = mirror_point(source.position, face.plane);
                if is_line_of_sight(image_source, receiver.position, &scene) {
                    let reflected_path = calculate_reflected_path(
                        source,
                        receiver,
                        face,
                        &scene
                    );
                    paths.push(reflected_path);
                }
            }
        }

        // Recursive reflections (higher order)
        if max_reflections > 1 {
            // ... další odrazy
        }
    }

    // 3. Diffracted paths (barriers, building edges)
    for barrier in &scene.barriers {
        for edge in &barrier.edges {
            let diffracted_path = calculate_diffraction(
                source,
                receiver,
                edge,
                &scene
            );
            if diffracted_path.is_valid() {
                paths.push(diffracted_path);
            }
        }
    }

    paths
}

fn calculate_attenuation(path: &PropagationPath, frequency: f64) -> f64 {
    let mut total_attenuation = 0.0;

    // Distance attenuation (geometric spreading)
    total_attenuation += 20.0 * (path.distance / 1.0).log10();

    // Air absorption (ISO 9613-1)
    let air_abs_coeff = get_air_absorption_coefficient(frequency);
    total_attenuation += air_abs_coeff * path.distance / 1000.0;

    // Ground effect (ISO 9613-2)
    total_attenuation += path.ground_effect;

    // Barrier attenuation
    total_attenuation += path.barrier_effect;

    total_attenuation
}

// Main calculation function
pub fn calculate_noise_level(
    source: &Source,
    receiver: &Receiver,
    scene: &Scene,
    settings: &CalculationSettings
) -> NoiseResult {
    let mut result = NoiseResult::new();

    // Find all propagation paths
    let paths = trace_ray(source, receiver, scene, settings.max_reflections);

    // Calculate for each octave band
    for (band_idx, frequency) in OCTAVE_BANDS.iter().enumerate() {
        let mut total_pressure = 0.0;

        for path in &paths {
            let attenuation = calculate_attenuation(path, *frequency);
            let lw = source.sound_power_octave[band_idx];
            let lp = lw - attenuation;

            // Convert to pressure and sum energetically
            total_pressure += 10.0_f64.powf(lp / 10.0);
        }

        // Convert back to dB
        let lp_total = 10.0 * total_pressure.log10();
        result.octave_bands[band_idx] = lp_total;
    }

    // A-weighting
    result.laeq = apply_a_weighting(&result.octave_bands);

    result
}
```

**Barrier Optimization (Genetic Algorithm):**

```typescript
// TypeScript pseudo-code

interface BarrierGene {
  position: Point2D;
  length: number;
  height: number;
  materialId: string;
}

interface OptimizationConstraints {
  maxHeight: number;
  maxLength: number;
  maxCost: number;
  availableSpace: Polygon;
}

class BarrierOptimizer {
  private populationSize = 50;
  private generations = 100;
  private mutationRate = 0.1;

  async optimize(
    project: Project,
    protectedReceivers: Receiver[],
    targetReduction: number, // dB
    constraints: OptimizationConstraints
  ): Promise<BarrierGene[]> {
    // Initial population
    let population = this.generateInitialPopulation(constraints);

    for (let gen = 0; gen < this.generations; gen++) {
      // Evaluate fitness of each individual
      const fitnesses = await Promise.all(
        population.map(gene => this.evaluateFitness(
          gene,
          project,
          protectedReceivers,
          targetReduction,
          constraints
        ))
      );

      // Selection (tournament)
      const selected = this.tournamentSelection(population, fitnesses);

      // Crossover
      const offspring = this.crossover(selected);

      // Mutation
      this.mutate(offspring, this.mutationRate);

      // Next generation
      population = offspring;

      // Report progress
      const bestIdx = fitnesses.indexOf(Math.max(...fitnesses));
      console.log(`Generation ${gen}: Best fitness = ${fitnesses[bestIdx]}`);
    }

    // Return top solutions
    const finalFitnesses = await Promise.all(
      population.map(gene => this.evaluateFitness(
        gene, project, protectedReceivers, targetReduction, constraints
      ))
    );

    const sorted = population
      .map((gene, idx) => ({ gene, fitness: finalFitnesses[idx] }))
      .sort((a, b) => b.fitness - a.fitness);

    return sorted.slice(0, 5).map(x => x.gene);
  }

  private async evaluateFitness(
    gene: BarrierGene,
    project: Project,
    protectedReceivers: Receiver[],
    targetReduction: number,
    constraints: OptimizationConstraints
  ): Promise<number> {
    // Create temporary barrier in project
    const tempBarrier = this.createBarrier(gene);

    // Run calculation with barrier
    const results = await this.calculateNoiseLevels(project, tempBarrier, protectedReceivers);

    // Compare with baseline (no barrier)
    let totalReduction = 0;
    let receiversMeetingTarget = 0;

    for (let i = 0; i < protectedReceivers.length; i++) {
      const reduction = this.baseline[i] - results[i];
      totalReduction += reduction;
      if (reduction >= targetReduction) {
        receiversMeetingTarget++;
      }
    }

    const avgReduction = totalReduction / protectedReceivers.length;
    const targetScore = receiversMeetingTarget / protectedReceivers.length;

    // Cost penalty
    const cost = this.calculateCost(gene);
    const costScore = Math.max(0, 1 - cost / constraints.maxCost);

    // Constraint penalties
    let penalty = 0;
    if (gene.height > constraints.maxHeight) penalty += 100;
    if (gene.length > constraints.maxLength) penalty += 100;
    if (!this.isWithinSpace(gene, constraints.availableSpace)) penalty += 100;

    // Fitness = weighted sum
    const fitness =
      0.5 * avgReduction +    // Average noise reduction
      0.3 * targetScore * 10 + // Meeting target
      0.2 * costScore * 10 -   // Cost efficiency
      penalty;                 // Constraint violations

    return fitness;
  }

  // ... další metody (selection, crossover, mutation)
}
```

---

### 7.7 Deployment a provoz

**Infrastruktura:**

```yaml
# Docker Compose setup

version: '3.8'

services:
  # Web Application
  web:
    image: acoustix/web:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/acoustix
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      - postgres
      - redis
      - minio

  # Calculation Workers
  worker:
    image: acoustix/worker:latest
    replicas: 4 # Scale based on load
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/acoustix
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  # Database
  postgres:
    image: postgis/postgis:15-3.3
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=acoustix
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  # Job Queue
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  # File Storage
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=password

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

**Škálovatelnost:**

```
Load Balancer (Nginx/Caddy)
    ↓
┌───────────────────────────────────┐
│  Web App Instances (3-N)          │
│  - Next.js SSR                    │
│  - API Routes                     │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Calculation Worker Pool (4-N)    │
│  - Bull Queue workers             │
│  - Rust calculation engine        │
│  - Auto-scaling based on queue    │
└───────────────────────────────────┘
    ↓
┌─────────────┬─────────────┬───────┐
│  PostGIS DB │  Redis      │ MinIO │
│  (Primary + │  (Queue +   │ (File │
│   Replicas) │   Cache)    │ Store)│
└─────────────┴─────────────┴───────┘
```

**Monitoring:**

- **Application monitoring:** Sentry (error tracking)
- **Performance monitoring:** Prometheus + Grafana
- **Log aggregation:** Loki
- **Uptime monitoring:** UptimeRobot nebo vlastní

**Backup strategie:**

- PostgreSQL: Denní plné zálohy + continuous WAL archiving
- MinIO: Replikace na druhý server nebo cloud backup
- Redis: Snapshot backups (méně kritické)

---

### 7.8 Business model a pricing

**Target segmenty:**

1. **Consulting Companies** (akustické poradenství)
   - Primary users
   - Need: Professional tools, compliance, reporting
   - Pricing: Subscription per user

2. **Municipalities** (města a obce)
   - Strategic noise mapping (EU END)
   - Public portal
   - Pricing: Annual license + population-based

3. **Industrial Companies**
   - Internal noise assessments
   - Compliance monitoring
   - Pricing: Site license

4. **Research & Academia**
   - Education
   - Research projects
   - Pricing: Academic discount or free tier

**Pricing tiers:**

**Free Tier:**
- 1 active project
- Max 1000 receivers
- Basic calculations (ISO 9613-2)
- 2D visualization
- Export to PDF
- Community support

**Professional:** 1500 CZK/měsíc per user
- Unlimited projects
- Unlimited receivers
- All calculation models (ISO 9613-2, CNOSSOS-EU)
- 3D visualization
- Advanced exports (Word, Excel, GeoJSON, SHP)
- Scenario comparison
- Email support

**Enterprise:** Custom pricing
- All Professional features
- API access
- Priority calculation queue
- Collaborative editing
- Custom branding
- On-premise deployment option
- Dedicated support
- Training sessions

**Municipal Plan:** Custom (based on population)
- All Enterprise features
- Public portal
- Unlimited users from municipality
- Integration support
- Annual strategic noise mapping service

**Add-ons:**
- Barrier optimization module: +500 CZK/měsíc
- Mobile app: +300 CZK/měsíc per user
- AI source identification: +400 CZK/měsíc
- Dynamic mapping (live data): +1000 CZK/měsíc

**Revenue streams:**

1. **SaaS subscriptions** (primary)
2. **Consulting services** (implementation, training)
3. **Custom development** (integrations, special features)
4. **Data services** (providing traffic data, terrain data)

---

### 7.9 Roadmap - fáze vývoje

**Phase 1: MVP (3-4 měsíce)**
- ✓ Basic project management
- ✓ Point source definition
- ✓ Simple receiver grid
- ✓ ISO 9613-2 calculation (direct path only)
- ✓ 2D map visualization with contours
- ✓ PDF export
- ✓ User authentication

**Phase 2: Core Features (3 měsíce)**
- Line sources (roads) + CNOSSOS-EU emission
- Building import (OSM, shapefile)
- DTM support
- Ray tracing with reflections
- Barrier modeling
- 3D visualization
- Excel/Word export

**Phase 3: Advanced Calculation (2 měsíce)**
- CNOSSOS-EU propagation complete
- Ground effect
- Diffraction (barriers, buildings)
- Meteorological corrections
- Multiple reflection orders
- Octave band calculations

**Phase 4: Collaboration & Automation (2 měsíce)**
- Multi-user projects
- Real-time collaborative editing
- API (REST + GraphQL)
- Scripting/macro support
- Batch calculations
- Scenario comparison tool

**Phase 5: Specialized Tools (3 měsíce)**
- Barrier optimization (genetic algorithm)
- Measurement data integration
- Compliance checking dashboard
- Area sources
- Mobile app (iOS/Android)

**Phase 6: Intelligence & Public Features (2 měsíce)**
- AI source identification
- Dynamic mapping (live data integration)
- Public portal
- Advanced reporting templates

**Phase 7: Enterprise Features (2 měsíce)**
- On-premise deployment option
- SSO (Single Sign-On)
- Advanced permissions
- Audit logs
- Custom branding (white-label)

**Celkem: ~17-19 měsíců do plně funkční platformy**

---

### 7.10 Konkurenční výhody shrnutí

**Oproti CadnaA:**
- ✅ Modernější web-first UI (rychlejší onboarding)
- ✅ Nižší cena (SaaS vs. perpetual expensive license)
- ✅ Real-time collaboration
- ✅ Česká lokalizace a compliance built-in
- ✅ API-first architecture
- ❌ Méně ověřené na trhu (nový software)

**Oproti HlukPLUS:**
- ✅ Modernější technologie
- ✅ Web-based (přístup odkudkoliv)
- ✅ 3D vizualizace
- ✅ Collaboration features
- ✅ API pro integraci
- ✅ International standards (CNOSSOS-EU)
- ✅ Stejná česká legislative compliance

**Oproti LIMA:**
- ✅ Nižší cena
- ✅ Jednodušší použití
- ✅ Web-based (žádná instalace)
- ✅ Modern UI/UX
- ❌ Pomalejší calculation engine (zpočátku)

**Oproti NoiseModelling (open-source):**
- ✅ User-friendly GUI (vs. technical setup)
- ✅ Integrated workflow (vs. scripting)
- ✅ Support a dokumentace
- ✅ Advanced visualization
- ✅ Collaboration features
- ✅ Built-in reporting
- ❌ Není zdarma

**Oproti všem:**
- ✅ AI-assisted features (source identification)
- ✅ Automated barrier optimization
- ✅ Mobile app pro field work
- ✅ Public portal integrated
- ✅ Modern web technology stack
- ✅ Open calculation engine (trust + extensibility)

---

## 8. Závěr průzkumu

Průzkum 6 hlavních softwarových řešení pro zpracování hluku (CadnaA, HlukPLUS, iNoise, LIMA, SoundPLAN, NoiseModelling) odhalil následující klíčové poznatky:

### Technické poznatky:

1. **Ray tracing je standard** - všechny moderní softwary používají ray tracing pro propagační výpočty
2. **Modulární architektura** - nejúspěšnější řešení (SoundPLAN, NoiseModelling) používají modulární design
3. **PostGIS/spatial databases** - profesionální řešení integrují prostorové databáze
4. **Multi-standard support** - podpora více standardů (ISO 9613, CNOSSOS-EU, Nord2000) je klíčová
5. **3D vizualizace** - již není "nice to have", ale očekávaná feature
6. **Automation APIs** - LIMA a NoiseModelling ukazují důležitost scriptovatelnosti

### Business poznatky:

1. **High-end komerční** (CadnaA, LIMA) - velmi drahé, ale feature-rich
2. **Mid-tier regional** (HlukPLUS) - prostor pro národní řešení
3. **Open-source** (NoiseModelling) - roste, ale stále technicky náročné
4. **SaaS model** - zatím neexplorovaný v tomto segmentu

### Příležitosti pro nové řešení:

1. **Web-first platforma** - žádné z hlavních řešení není primárně web-based
2. **Collaboration features** - multi-user real-time editing chybí
3. **Modern UI/UX** - většina má zastaralé rozhraní
4. **AI integration** - žádné řešení nepoužívá AI pro optimalizaci nebo analýzu
5. **Český trh** - pouze HlukPLUS, prostor pro konkurenci
6. **Lower price point** - SaaS model umožní nižší vstupní cenu
7. **Public engagement** - integrovaný public portal je unikátní

### Doporučení pro implementaci:

**Priorita 1 (Must-have pro MVP):**
- Základní project management
- Point sources + ISO 9613-2 calculation
- 2D visualization
- PDF reporting
- Česká legislative compliance

**Priorita 2 (Core features):**
- CNOSSOS-EU support
- Building & terrain import
- Ray tracing s reflexemi
- Barriers
- 3D visualization

**Priorita 3 (Differentiators):**
- Web-based collaboration
- API
- Barrier optimization
- Mobile app
- AI features

**Technologické volby:**
- ✅ TypeScript/Node.js + Rust (performance)
- ✅ Next.js (web framework)
- ✅ PostGIS (spatial data)
- ✅ GraphQL (API flexibility)
- ✅ Bull Queue (background jobs)

---

## Zdroje

Tento dokument byl vytvořen na základě 20 web searches a analýzy následujících zdrojů:

### CadnaA
- [CadnaA 2026 Release - Scantek Inc](https://scantekinc.com/blog/cadnaa-released/)
- [CadnaA Features - Datakustik](https://www.datakustik.com/products/cadnaa/features)
- [CadnaA Connectivity](https://www.datakustik.com/products/cadnaa/features/connectivity/)
- [CadnaA Pricing - GetApp](https://www.getapp.com/business-intelligence-analytics-software/a/cadnaa/)
- [CadnaA - Campbell Associates](https://campbell-associates.co.uk/products/cadnaa-outdoor-noise-prediction-software/)

### HlukPLUS
- [HlukPLUS Official](https://www.hlukplus.cz/)

### iNoise
- [iNoise - DGMR Software](https://dgmrsoftware.com/products/inoise/)
- [Quality Assured ISO 9613 Implementation](https://noisenewsinternational.net/quality-assured-implementation-of-iso-9613-in-inoise/)

### LIMA / Predictor-LimA
- [Predictor-LimA Product Data (PDF)](https://marketing-toolbox.s3.us-west-2.amazonaws.com/Product%20Data/Product%20Data%20A4/Product%20Data%20-%20Predictor-LimA%20-%20BP1602-41%20-%20A4.pdf)
- [Predictor-LimA Software Suite](https://mininglifeonline.net/equipment/noise-mapping-and-prediction/predictor-lima-software-suite-type-7810/1772)

### SoundPLAN
- [SoundPLAN Modules](https://www.soundplan.eu/en/software/soundplannoise/modules)
- [SoundPLAN Room Acoustics Module](https://noisenewsinternational.net/soundplan-room-acoustics-module/)
- [SoundPLAN - Navcon](https://navcon.com/resources/software/soundplan/)

### NoiseModelling
- [NoiseModelling Official](https://noise-planet.org/noisemodelling.html)
- [NoiseModelling Documentation](https://noisemodelling.readthedocs.io/)
- [NoiseModelling Open-Source](https://noisenewsinternational.net/noisemodelling-an-open-source-software-for-outdoor-noise-mapping/)

### Calculation Methods & Standards
- [ISO 9613 vs CNOSSOS-EU Comparison (PDF)](https://www.sea-acustica.es/INTERNOISE_2019/Fchrs/Proceedings/2149.pdf)
- [ISO 9613 vs CNOSSOS-EU - INCE](https://www.ingentaconnect.com/contentone/ince/incecp/2019/00000259/00000002/art00091)
- [CNOSSOS and Industrial Noise (PDF)](https://www.euronoise2018.eu/docs/papers/476_Euronoise2018.pdf)
- [ISO 9613-2 vs CNOSSOS Adjustments (PDF)](https://documentacion.sea-acustica.es/publicaciones/Madeira21/ID214.pdf)

### Ray Tracing & Propagation
- [Ray Tracing Noise Modeling - MDPI](https://www.mdpi.com/2076-3417/15/3/1009)
- [Noise Mapping Calculation Software - ResearchGate](https://www.researchgate.net/publication/228823125_Software_for_Calculation_of_Noise_Maps_Implemented_on_Supercomputer)
- [CadnaA Mapping Techniques (PDF)](https://www.datakustik.com/fileadmin/user_upload/e-Learning-Center/Papers-and-Publications/2008_ICSV_MappingTechniques_WP.pdf)

### Terrain & 3D Modeling
- [DTM Precision for Noise Mapping - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0003682X10001507)
- [3D Noise Modeling - ResearchGate](https://www.researchgate.net/publication/228622472_3D_Noise_Modeling_for_Urban_Environmental_Planning_and_Management)
- [Automated 3D Reconstruction - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0198971519302662)
- [TU Delft 3D Noise Data](https://3d.bk.tudelft.nl/opendata/noise3d/en.html)

### Traffic Data & Emission Models
- [Traffic Noise Modeling Best Practices (PDF)](https://environment.transportation.org/wp-content/uploads/2021/05/noise_summit_session8.pdf)
- [Road Noise Emission Models Review - Springer](https://link.springer.com/article/10.1007/s40726-024-00319-5)
- [AADT and Transport Emissions - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0966692316307244)

### Large-Scale Optimization
- [Large-Region Dynamic Noise Maps - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0269749123008448)
- [Strategic Noise Mapping END - ResearchGate](https://www.researchgate.net/publication/40833292_Strategic_environmental_noise_mapping_Methodological_issues_concerning_the_implementation_of_the_EU_Environmental_Noise_Directive_and_their_policy_implications)
- [Near-Real-Time Dynamic Mapping - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S136192092300319X)
- [Self-Adaptive Grids - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0003682X10002896)

### Data Export & Integration
- [Data Exporting - NoiseMap](http://www.noisemap.ltd.uk/wpress/features/data-exporting/)

### Architecture & Deployment
- [Web vs Cloud Apps - Ramotion](https://www.ramotion.com/blog/web-based-vs-cloud-based-apps/)
- [Cloud vs Desktop Software - Syntactics](https://www.syntacticsinc.com/news-articles-cat/cloud-based-software/)
- [Multi-platform Noise Software - Picovoice](https://picovoice.ai/platform/koala/)

---

**Datum vytvoření:** 24. března 2026
**Autor:** Claude (Anthropic)
**Účel:** Hloubkový průzkum pro návrh vlastního noise processing software
