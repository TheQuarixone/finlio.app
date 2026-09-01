# Finlio — market-data service

A small Python HTTP service wrapping [`jugaad-data`](https://github.com/jugaad-py/jugaad-data)
for **NSE** prices/indices and **RBI** economic series.

## Why a separate service

`jugaad-data` is Python, and nothing on npm reads RBI's published series. Rather
than spread a second runtime through the Next app or reimplement NSE and RBI
scraping in TypeScript, it runs as one small deployable and the app talks to it
over HTTP.

Everything upstream sees `MarketDataProvider` (`packages/core/src/ports/market-data.ts`),
so which of Yahoo, this service, or a licensed vendor answers is invisible to
the net-worth engine. The adapter is
[`packages/data/src/market/jugaad.ts`](../../packages/data/src/market/jugaad.ts).

## Contract

`POST /quotes`  → `{ "symbols": ["RELIANCE"] }`
`POST /navs`    → `{ "identifiers": ["INF109K01Z48"] }`
`GET  /health`

Both return `{ "quotes": [{ symbol, price, previous_close?, change_pct?, as_of }] }`
with prices as plain rupee decimals. The adapter converts to integer paise.

Auth is a shared secret in `x-api-key`. **This service must never be publicly
reachable** — it has no per-user authorisation and no rate limiting of its own.

## Run locally

```bash
cd services/market-data && pip install -r requirements.txt && uvicorn main:app --port 8787
```

Then set in `apps/web/.env.local`:

```
MARKET_DATA_URL=http://localhost:8787
MARKET_DATA_API_KEY=<the same secret>
```

## Notes before this goes to production

- **Licensing.** NSE's terms restrict redistribution of its data, and
  `jugaad-data` scrapes public endpoints rather than holding a licence. Fine for
  development and for proving the seam; the production market-data provider is
  still an open question (PRD §14). The port exists so that answer costs one
  adapter.
- **Caching is mandatory, not an optimisation.** Scraped endpoints rate-limit
  and change shape without notice. Cache in Redis (TECHSTACK §5.3) and treat
  every miss as "return nothing", never as an error — the dashboard degrades to
  cost basis, it never breaks.
