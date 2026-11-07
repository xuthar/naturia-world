#!/usr/bin/env python3
"""Naturia source link availability audit. Never treats HTTP health as legal verification."""
from __future__ import annotations
import concurrent.futures
import datetime as dt
import json
import pathlib
import re
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = ["data.js", "app.js"]
OUT = ROOT / "content" / "source-status.json"
LINK = re.compile(r"https?://[^\s'\"<>`]+")
SOURCE_DOMAINS = (
    "fenait.org", "fpn.pt", "naturismo.org", "inf-fni.org",
    "visitdenmark.com", "nationaltrust.org.uk", "nationalparks.nsw.gov.au",
    "toronto.ca", "nps.gov", "bn.org.uk", "france.fr",
    "nfn.nl", "ffn-naturisme.com",
)

def urls() -> list[str]:
    found = set()
    for name in FILES:
        p = ROOT / name
        if p.is_file():
            for url in LINK.findall(p.read_text(encoding="utf-8")):
                url = url.rstrip("),.;}]")
                if any(domain in urllib.request.urlparse(url).netloc for domain in SOURCE_DOMAINS):
                    found.add(url)
    return sorted(found)

def check(url: str) -> dict:
    req = urllib.request.Request(
        url, headers={"User-Agent": "Naturia-SourceCheck/1.0 (+https://xuthar.github.io/naturia-world/)"}, method="HEAD"
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            status = res.status
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception:
        return {"url": url, "status": "needs_review", "http_code": None}
    if status in (403, 405, 429):
        return {"url": url, "status": "needs_review", "http_code": status}
    return {"url": url, "status": "reachable" if 200 <= status < 400 else "needs_review", "http_code": status}

def main():
    links = urls()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(check, links))
    results.sort(key=lambda item: item["url"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "run_date_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"),
        "method": "HTTP availability only. This does not verify legal content, accuracy, opening, permissions or official recognition.",
        "checked_count": len(results),
        "needs_review_count": sum(item["status"] != "reachable" for item in results),
        "results": results,
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Checked", len(results), "primary-source URLs;", report["needs_review_count"], "need review.")

if __name__ == "__main__":
    main()
