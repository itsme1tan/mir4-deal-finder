# MIR4 Deal Finder
A static page that compares MIR4 NFT characters listed on XDRACO (600k+ power). It estimates a fair price from recent comparable sales and flags deals that are 15% or more under that price.
- Data comes from public Hofgamer pages (`scrape.py` writes `data.json`). The WEMIX price comes from CoinGecko.
- Read-only. Buy on XDRACO yourself. Not financial advice.
- To refresh, run `python3 scrape.py`.
