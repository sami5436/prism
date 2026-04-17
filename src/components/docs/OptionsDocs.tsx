import { Section, SubSection, Formula, Callout, Term } from './DocsShell';

export default function OptionsDocs() {
  return (
    <Section
      id="options"
      title="Options"
      lead="Options are contracts on contracts. They're often taught as gambling tickets, but at their core they're a language for expressing specific views — 'I think this will go up by X within Y days' — in a way that buying stock can't. Understanding them means understanding time, probability, and volatility all at once."
    >
      <SubSection id="contract-basics" title="The contract — what you're actually trading">
        <p>
          A <strong>call</strong> gives the buyer the right (not the obligation) to <em>buy</em> 100 shares
          at a fixed price (the <Term>strike</Term>) on or before the <Term>expiration date</Term>. The
          buyer pays a fee — the <Term>premium</Term> — to the seller for that right.
        </p>
        <p>
          A <strong>put</strong> is the mirror image: the right to <em>sell</em> 100 shares at the strike.
          Same structure, opposite direction.
        </p>
        <Callout kind="example" title="a concrete call">
          AAPL is at $180. You buy one AAPL $190 call expiring in 30 days, paying $1.20 per share premium.
          Since one contract = 100 shares, you wire $120 ($1.20 × 100). If AAPL finishes above $190 at
          expiration, you can exercise — buy 100 shares at $190 regardless of the market price. If
          AAPL is below $190, your call expires worthless and you lose the $120.
        </Callout>
        <p>
          The seller gets the $120 upfront and takes on the obligation: if the buyer exercises, the seller
          must sell shares at $190 — even if the market is $250 and they&apos;d rather not. This asymmetry
          (buyers have rights, sellers have obligations) is the entire game.
        </p>
      </SubSection>

      <SubSection id="intrinsic-extrinsic" title="Intrinsic vs. extrinsic value — why OTM options cost anything">
        <p>
          An option&apos;s price has two parts:
        </p>
        <Formula>
          Total premium = Intrinsic value + Extrinsic value<br />
          Intrinsic (call) = max(0, Spot − Strike)<br />
          Extrinsic = everything else
        </Formula>
        <p>
          <strong>Intrinsic</strong> is what you&apos;d gain if you exercised right now. A $190 call when
          the stock is $200 has $10 of intrinsic value — that&apos;s just math. Below $190, intrinsic is
          zero.
        </p>
        <p>
          <strong>Extrinsic</strong> (also called &quot;time value&quot;) is what the market pays for the
          <em>possibility</em> of profit between now and expiration. An OTM (out-of-the-money) $190 call
          when the stock is $180 has zero intrinsic value but might still cost $1.20 — that $1.20 is
          entirely a bet on movement.
        </p>
        <Callout kind="insight" title="why this is the most important concept">
          When you buy an OTM call, you&apos;re paying for pure optionality. If the stock doesn&apos;t move,
          that value bleeds to zero as expiration approaches. When you sell a call, you&apos;re harvesting
          that decay. Buyers pay for possibility; sellers get paid for patience.
        </Callout>
      </SubSection>

      <SubSection id="greeks" title="The Greeks — one number per risk dimension">
        <p>
          An option&apos;s price depends on five inputs: spot price, strike, time to expiry, volatility,
          and the risk-free rate. The Greeks tell you how much the option price changes when <em>one</em>
          of those inputs moves.
        </p>

        <div className="space-y-3 mt-2">
          <div>
            <p><strong>Delta (Δ)</strong> — sensitivity to spot price.</p>
            <p>
              A call with Δ = 0.40 means: if the stock goes up $1, the option price goes up ~$0.40. Delta
              ranges from 0 (far OTM call, basically dead) to 1 (deep ITM call, behaves like stock).
            </p>
            <Callout kind="insight" title="delta as probability">
              Under Black-Scholes, delta is numerically close to the risk-neutral probability of the option
              finishing ITM. A 0.30 delta call has roughly a 30% chance of being worth something at
              expiration. This is the single most useful piece of intuition in options — it&apos;s why we
              use delta to filter candidates in the screener.
            </Callout>
          </div>

          <div>
            <p><strong>Gamma (Γ)</strong> — the rate of change of delta.</p>
            <p>
              Delta itself moves as the stock moves. Gamma measures that. Near-ATM options have the
              highest gamma — their delta shifts fastest. Gamma is why selling naked options near the
              strike around expiration is terrifying: delta can swing from 0.3 to 0.8 in a single day.
            </p>
          </div>

          <div>
            <p><strong>Theta (Θ)</strong> — time decay per day.</p>
            <p>
              Theta is the dollar amount the option loses each day, all else equal. It&apos;s the enemy of
              buyers and the friend of sellers. Theta isn&apos;t linear — it accelerates as expiration
              approaches.
            </p>
            <Callout kind="insight" title="why theta accelerates">
              Option pricing models volatility as scaling with √t (square root of time). A 30-day option
              has √30 ≈ 5.5 &quot;units of uncertainty&quot;. A 7-day option has √7 ≈ 2.6. Cutting time in
              half doesn&apos;t cut value in half — it cuts the uncertainty-driven portion by more than
              half. Theta is steepest in the final weeks.
            </Callout>
          </div>

          <div>
            <p><strong>Vega (ν)</strong> — sensitivity to implied volatility.</p>
            <p>
              If IV rises 1 percentage point, the option price rises by vega dollars. Long options
              (calls or puts) are always long vega — you profit when IV expands. Short options are short
              vega — you profit when IV contracts. This is why earnings plays are usually losers for
              buyers: IV collapses the moment uncertainty resolves.
            </p>
          </div>

          <div>
            <p><strong>Rho (ρ)</strong> — sensitivity to interest rates.</p>
            <p>
              Mostly ignorable for short-dated trades. Matters for LEAPS and at the edges of rate cycles.
            </p>
          </div>
        </div>
      </SubSection>

      <SubSection id="iv-hv" title="Implied Volatility vs. Realized Volatility">
        <p>
          <strong>Realized (historical) volatility</strong> is how much the stock <em>actually</em> moved,
          measured as the annualized standard deviation of daily returns:
        </p>
        <Formula>
          HV = std(log returns) × √252
        </Formula>
        <p>
          The √252 annualizes it — there are ~252 trading days in a year, and variance scales linearly
          with time while standard deviation scales with √t.
        </p>
        <p>
          <strong>Implied volatility</strong> is what the options market is <em>pricing in</em>. It&apos;s
          not observed directly — it&apos;s the volatility number that, plugged into Black-Scholes,
          produces the option price you see in the market. It&apos;s the market&apos;s collective forecast
          of future movement.
        </p>
        <Callout kind="insight" title="the volatility risk premium">
          On average, across most markets and most tickers, IV &gt; HV. Options sellers demand compensation
          for bearing tail risk — the small chance of a crash. Buyers pay that premium because they want
          insurance. The <strong>IV/HV ratio</strong> tells you how rich that insurance is today:
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Ratio ≥ 1.3 → options are expensive → favor selling premium</li>
            <li>Ratio ≤ 0.9 → options are cheap → favor buying premium</li>
            <li>Ratio ~ 1.0 → neutral</li>
          </ul>
        </Callout>
      </SubSection>

      <SubSection id="iv-rank" title="IV Rank & IV Percentile — making vol comparable">
        <p>
          Raw IV is unusable across stocks. AAPL&apos;s normal IV is ~25%; Tesla&apos;s is ~55%. You
          can&apos;t say &quot;IV is high&quot; in absolute terms. IV Rank normalizes against each
          ticker&apos;s own 1-year history.
        </p>
        <Formula>
          IV Rank = (Current IV − 1y Low) / (1y High − 1y Low) × 100<br />
          IV Percentile = % of days over past year where IV ≤ Current IV
        </Formula>
        <p>
          A rank of 80 means today&apos;s IV is near the top of the year&apos;s range. A percentile of 80
          means vol has been <em>this low or lower</em> 80% of the time in the past year — i.e., current
          IV is in the top 20% of recent readings.
        </p>
        <Callout kind="warning" title="our implementation uses HV as a proxy">
          Yahoo Finance doesn&apos;t publish historical implied volatility. Prism ranks today&apos;s 30-day
          realized volatility against the trailing year instead, then compares current ATM IV to current
          HV for the richness signal. For most practical purposes this tracks a true IV rank closely,
          but if you upgrade to a paid options data feed, you&apos;ll get real IV history.
        </Callout>
      </SubSection>

      <SubSection id="black-scholes" title="Black-Scholes — five inputs, one price">
        <p>
          The Black-Scholes model is how modern options pricing works. It assumes stock returns are
          lognormally distributed, there are no transaction costs, and volatility is constant. None of
          those are exactly true, but the model is accurate enough that the whole industry uses it as the
          lingua franca.
        </p>
        <Formula>
          Call price = S·N(d₁) − K·e^(−rT)·N(d₂)<br />
          d₁ = [ln(S/K) + (r + σ²/2)·T] / (σ·√T)<br />
          d₂ = d₁ − σ·√T
        </Formula>
        <p>
          Inputs: S = spot, K = strike, T = years to expiry, r = risk-free rate, σ = volatility.
          N(·) is the standard normal CDF. Delta for a call is simply N(d₁).
        </p>
        <Callout kind="insight" title="where Prism uses this">
          The &quot;To Sell&quot; and &quot;To Buy&quot; tables in the options module compute delta for
          every contract via this formula using each contract&apos;s own IV as σ. That&apos;s what lets us
          filter on delta ranges (0.15–0.35 for sells, 0.40–0.65 for buys) even though Yahoo doesn&apos;t
          ship Greeks with the chain.
        </Callout>
      </SubSection>

      <SubSection id="strategies" title="Strategies — selling vs. buying calls">
        <div className="space-y-4">
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Covered call (selling calls on shares you own)</p>
            <p>
              Own 100 shares of AAPL at $180, sell a $190 call for $1.20 expiring in 30 days. You collect
              $120 up front. Three outcomes at expiration:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 mt-1">
              <li>Stock &lt; $190 → call expires, you keep shares + $120 (0.67% monthly = ~8% annualized bonus yield)</li>
              <li>Stock &gt; $190 → shares called away at $190, but you still get the $120 — total exit price $191.20</li>
              <li>Stock rips to $250 → you miss everything above $190, keep only $120 + the $10 gain from $180→$190</li>
            </ul>
            <p>The trade-off is clear: cap your upside in exchange for a reliable income stream.</p>
          </div>

          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Naked call (selling calls without owning shares)</p>
            <p>
              Same trade, no shares to deliver. If assigned, you&apos;d have to <em>buy</em> 100 shares at
              market and deliver them at $190. If AAPL is $250, that&apos;s a $6,000 loss on one contract
              against $120 of premium — 50x your premium, evaporated.
            </p>
            <Callout kind="warning" title="naked calls have unlimited loss">
              Stocks can&apos;t go below zero, so a naked put has a bounded loss. Stocks have no ceiling,
              so a naked call has <em>unlimited</em> loss. Most brokers won&apos;t let retail accounts sell
              naked calls without elevated permissions. Treat them accordingly.
            </Callout>
          </div>

          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Long call (buying calls)</p>
            <p>
              Max loss = the premium you paid. Max gain = unlimited. Breakeven = strike + premium. The
              catch: theta and the need for the stock to move <em>enough</em>, <em>fast enough</em>. Most
              OTM long calls expire worthless not because the trader was wrong on direction but because
              they were wrong on timing.
            </p>
            <Callout kind="insight" title="the leverage trap">
              Buying a 0.20-delta call feels like cheap leverage — a small premium controls 100 shares.
              But you need the stock to move <em>past the strike plus the premium</em> before expiration
              for any profit at all. Back-test: how often does your favorite stock make that move in 30
              days? That&apos;s your real win rate.
            </Callout>
          </div>
        </div>
      </SubSection>

      <SubSection id="screener-math" title="How the Call Picks screener scores candidates">
        <p>
          Both sides of the picks table start from the same pool: every contract across the next 6
          expirations (within your DTE range), with open interest ≥ 100 for liquidity.
        </p>
        <div className="space-y-3">
          <div>
            <p><strong>Sell side</strong> — filter for OTM calls, delta 0.15–0.35 (low probability of
            assignment), bid ≥ $0.10. Then score:</p>
            <Formula>
              Score = (bid / spot) × (365 / DTE) × (1 − delta)
            </Formula>
            <p>
              That&apos;s annualized premium yield × probability OTM. Rewards fat premium that&apos;s
              unlikely to get assigned. Sorted descending, top 5.
            </p>
          </div>

          <div>
            <p><strong>Buy side</strong> — filter for delta 0.40–0.65 (near-ATM, real exposure without
            paying for deep ITM), ask ≥ $0.10. Then score:</p>
            <Formula>
              Score = (delta / (ask / spot)) × max(0.1, 1 − %moveNeeded)
            </Formula>
            <p>
              That&apos;s leverage (delta per % of spot paid) adjusted by required move to break even.
              Rewards contracts that give real delta exposure per dollar and don&apos;t need a miracle to
              pay off.
            </p>
          </div>
        </div>
        <Callout kind="warning" title="these are candidates, not recommendations">
          The scores optimize for mathematical properties that <em>usually</em> align with good risk/reward.
          They don&apos;t know about upcoming earnings, sector rotation, index-level macro risk, or the
          thing you read in the 10-K this morning. Use the screener to shortlist contracts worth looking
          at, then apply judgment.
        </Callout>
      </SubSection>

      <SubSection id="options-glossary" title="Quick glossary">
        <ul className="list-none space-y-1.5 pl-0">
          <li><Term>ITM</Term> — in-the-money. Call: spot &gt; strike. Put: spot &lt; strike.</li>
          <li><Term>ATM</Term> — at-the-money. Strike ≈ spot.</li>
          <li><Term>OTM</Term> — out-of-the-money. Opposite of ITM. Pure extrinsic value.</li>
          <li><Term>DTE</Term> — days to expiration.</li>
          <li><Term>Assignment</Term> — the seller is obligated to honor the contract (deliver shares for a call).</li>
          <li><Term>Exercise</Term> — the buyer uses their right to buy/sell at the strike.</li>
          <li><Term>Open Interest</Term> — number of contracts currently held open. Liquidity proxy.</li>
          <li><Term>Volume</Term> — contracts traded today. Spikes often reflect news or positioning.</li>
          <li><Term>Bid / Ask</Term> — highest price a buyer will pay / lowest price a seller will accept.</li>
          <li><Term>IV Crush</Term> — sudden drop in IV, typically post-earnings. Destroys long options.</li>
        </ul>
      </SubSection>
    </Section>
  );
}
