"""Build score weights (approved by Juan 2026-10-20). In-class percentile ranks, weighted."""
W_DEFAULT={'atk':.36,'skill_dmg':.18,'pvp_dmg':.18,'def':.18,'pvp_red':.10}
W_TANK={'atk':.27,'skill_dmg':.18,'pvp_dmg':.18,'def':.18,'eva':.09,'pvp_red':.10}
def weights(cls): return W_TANK if cls in ('Taoist','Warrior') else W_DEFAULT
def score(c, pct):
    """pct: dict stat->percentile (0-100). Missing stats count as 0, as before."""
    return round(sum(w*(pct.get(k) or 0) for k,w in weights(c['cls']).items()))
