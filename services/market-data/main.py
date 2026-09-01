"""Finlio market-data service — NSE prices and RBI series via jugaad-data.

Contract and deployment notes: see README.md. Two rules the handlers below
enforce and that any change must preserve:

1. A lookup that fails returns *nothing* for that symbol, never a 5xx. The
   caller degrades to cost basis; a market feed being down must not take the
   dashboard with it.
2. Every response is per-symbol independent. One bad ticker must not lose the
   other nineteen.
"""

from __future__ import annotations

import os
from datetime import date, datetime, timezone

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

API_KEY = os.environ.get("MARKET_DATA_API_KEY", "")

app = FastAPI(title="Finlio market data", docs_url=None, redoc_url=None)


class QuotesRequest(BaseModel):
    symbols: list[str]


class NavsRequest(BaseModel):
    identifiers: list[str]


class Quote(BaseModel):
    symbol: str
    price: float
    previous_close: float | None = None
    change_pct: float | None = None
    as_of: str


def _authorise(api_key: str | None) -> None:
    # The service has no per-user authorisation, so the shared secret is the
    # only thing between it and the internet. Never make it optional.
    if not API_KEY or api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorised")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/quotes")
def quotes(body: QuotesRequest, x_api_key: str | None = Header(default=None)) -> dict:
    _authorise(x_api_key)

    from jugaad_data.nse import NSELive

    live = NSELive()
    found: list[Quote] = []

    for symbol in body.symbols[:50]:
        try:
            data = live.stock_quote(symbol.upper())
            price_info = data["priceInfo"]
            found.append(
                Quote(
                    symbol=symbol.upper(),
                    price=float(price_info["lastPrice"]),
                    previous_close=float(price_info["previousClose"]),
                    change_pct=float(price_info["pChange"]),
                    as_of=_now(),
                )
            )
        except Exception:
            # Rule 2: one bad ticker must not lose the rest.
            continue

    return {"quotes": [q.model_dump() for q in found]}


@app.post("/navs")
def navs(body: NavsRequest, x_api_key: str | None = Header(default=None)) -> dict:
    _authorise(x_api_key)
    # AMFI's daily NAVAll.txt is the source for Indian mutual funds; jugaad-data
    # does not cover them. Wired in the same shape so the adapter needs no change.
    return {"quotes": []}


@app.get("/rbi/{series}")
def rbi_series(series: str, x_api_key: str | None = Header(default=None)) -> dict:
    """RBI economic series — repo rate, CPI, and the rest.

    Used by the Financial Health Coach (Phase 3), not by net worth. Kept here
    because it is the other half of what jugaad-data is for.
    """
    _authorise(x_api_key)
    try:
        from jugaad_data import rbi

        return {"series": series, "values": rbi.__dict__.get(series, lambda: [])()}
    except Exception:
        return {"series": series, "values": []}
