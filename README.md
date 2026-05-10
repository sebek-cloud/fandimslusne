# Fandím slušně

Statický microsite manifestu **Fandím slušně** — iniciativy podporující slušnou
fanouškovskou kulturu na českých stadionech, stojící za festivalem
[OFFSEASON](https://offseason.cz). Tato fáze je čistě prezentační (HTML + CSS,
žádný backend); funkční podpis manifestu (Supabase + Ecomail) přijde v další fázi.

## Lokální náhled

Otevři `index.html` doubleclickem v prohlížeči, nebo spusť lokální server:

```bash
npx serve .
```

a otevři `http://localhost:3000`.

## Deploy

Hostováno na Vercelu, napojeno na tento GitHub repo:

- **`main`** = produkce (`https://fandimeslusne.cz`).
- Push do `main` → Vercel automaticky deployne (žádný build, statika 1:1).
- PR z feature branch → Vercel vytvoří preview URL.
