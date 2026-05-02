import { Section, SubSection, Formula, Callout, Term, XRef, LivePanelLink } from './DocsShell';

export default function OptionsDocs() {
  return (
    <Section
      id="options"
      title="Options"
      lead="Options are contracts on contracts. They're often taught as gambling tickets, but at their core they're a language for expressing specific views — 'I think this will go up by X within Y days' — in a way that buying stock can't. Understanding them means understanding time, probability, and volatility all at once."
    >
      <SubSection id="options-tour" title="A tour of the Options view">
        <LivePanelLink href="/options" label="Open the Options page" />
        <p>
          Before any math, here&apos;s the lay of the land. The Options page stacks four panels, each
          answering a different question:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Volatility panel</strong> — &ldquo;is vol expensive or cheap right now?&rdquo; Charts
            historical realized volatility, overlays today&apos;s implied vol, and ranks both. See{' '}
            <XRef to="iv-rank">IV Rank &amp; Percentile</XRef>.
          </li>
          <li>
            <strong>Single-Expiration Chain</strong> — &ldquo;what is the market pricing for this one
            expiration?&rdquo; Three view modes (chart / skew / detail), plus a header that surfaces the{' '}
            <XRef to="expected-move">expected move</XRef> and{' '}
            <XRef to="directional-lean">directional lean</XRef>, and a stats bar with{' '}
            <XRef to="pc-ratio">P/C ratio</XRef>.
          </li>
          <li>
            <strong>Open Interest by Strike</strong> — &ldquo;where are the magnets?&rdquo; A horizontal
            ladder of call vs put OI around spot, aggregated across multiple expirations. See{' '}
            <XRef to="open-interest-levels">OI levels</XRef>.
          </li>
          <li>
            <strong>Buy Candidates</strong> — &ldquo;which calls are worth a closer look?&rdquo; A liquidity-
            and delta-filtered shortlist scored on leverage per dollar. See{' '}
            <XRef to="screener-math">Screener math</XRef>.
          </li>
        </ul>
        <Callout kind="insight" title="why these four">
          Think of the panels as concentric circles. The volatility panel is the climate. The chain is
          today&apos;s weather for one date. The OI ladder is the terrain — where price tends to stick.
          The buy screener is the pick: given climate, weather, and terrain, which contract gives the
          best leverage per dollar? You can read them in any order, but the climate-first sequence is
          how a trader actually decides if a trade is even worth pricing.
        </Callout>
      </SubSection>

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
          (buyers have rights, sellers have obligations) is the entire game. The premium itself is split
          into two pieces — see <XRef to="intrinsic-extrinsic">intrinsic vs extrinsic</XRef> — and how
          fast each piece moves is summarized by{' '}
          <XRef to="greeks">the Greeks</XRef>.
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
          <em> possibility</em> of profit between now and expiration. An OTM (out-of-the-money) $190 call
          when the stock is $180 has zero intrinsic value but might still cost $1.20 — that $1.20 is
          entirely a bet on movement.
        </p>
        <Callout kind="insight" title="why this is the most important concept">
          When you buy an OTM call, you&apos;re paying for pure optionality. If the stock doesn&apos;t move,
          that value bleeds to zero as expiration approaches — the bleed rate is{' '}
          <XRef to="greeks">theta</XRef>. When you sell a call, you&apos;re harvesting that decay. Buyers
          pay for possibility; sellers get paid for patience. Whether the possibility is priced fairly is
          a question about <XRef to="iv-hv">implied vs realized volatility</XRef>.
        </Callout>
        <p>
          Think of extrinsic value like the topping on an ice cream cone melting in the sun. Intrinsic
          is the cone — solid, measurable, only changes if the stock moves. Extrinsic is the scoop on
          top, dripping a little every day, dripping faster on hot days (high IV) and faster still as
          the cone gets older.
        </p>
      </SubSection>

      <SubSection id="greeks" title="The Greeks — one number per risk dimension">
        <p>
          An option&apos;s price depends on five inputs: spot price, strike, time to expiry, volatility,
          and the risk-free rate. The Greeks tell you how much the option price changes when <em>one</em>
          {' '}of those inputs moves. They&apos;re what the{' '}
          <XRef to="black-scholes">Black-Scholes</XRef> model spits out as partial derivatives, and they
          drive the filters in the <XRef to="screener-math">Buy Candidates screener</XRef>.
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
              use delta to filter candidates in the <XRef to="screener-math">screener</XRef>.
            </Callout>
          </div>

          <div>
            <p><strong>Gamma (Γ)</strong> — the rate of change of delta.</p>
            <p>
              Delta itself moves as the stock moves. Gamma measures that. Near-ATM options have the
              highest gamma — their delta shifts fastest. Gamma is why selling naked options near the
              strike around expiration is terrifying: delta can swing from 0.3 to 0.8 in a single day.
              If delta is the speedometer, gamma is the accelerator pedal.
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
              half. Theta is steepest in the final weeks, which is why{' '}
              <XRef to="strategies">covered-call sellers</XRef> often target the 30–45 DTE sweet spot
              where theta is meaningful but not yet a runaway freight train.
            </Callout>
          </div>

          <div>
            <p><strong>Vega (ν)</strong> — sensitivity to implied volatility.</p>
            <p>
              If IV rises 1 percentage point, the option price rises by vega dollars. Long options
              (calls or puts) are always long vega — you profit when IV expands. Short options are short
              vega — you profit when IV contracts. This is why earnings plays are usually losers for
              buyers: IV collapses the moment uncertainty resolves (the &quot;<Term>IV crush</Term>&quot;
              effect — see <XRef to="iv-rank">IV Rank</XRef> for how to gauge richness in advance).
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
          not observed directly — it&apos;s the volatility number that, plugged into{' '}
          <XRef to="black-scholes">Black-Scholes</XRef>, produces the option price you see in the market.
          It&apos;s the market&apos;s collective forecast of future movement.
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
          The Volatility panel surfaces this ratio prominently, alongside the{' '}
          <XRef to="iv-rank">52-week rank</XRef>.
        </Callout>
        <p>
          A useful analogy: HV is the recorded weather for the past month — how much it actually rained.
          IV is tomorrow&apos;s forecast as priced into umbrella futures. Most of the time umbrellas
          cost a little more than the weather warrants, because nobody wants to be the person caught
          in a downpour without one.
        </p>
      </SubSection>

      <SubSection id="iv-rank" title="IV Rank & IV Percentile — making vol comparable">
        <LivePanelLink href="/options#iv-rank-panel" label="Volatility panel" />
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
          HV for the richness signal — see <XRef to="iv-hv">IV vs HV</XRef>. For most practical purposes
          this tracks a true IV rank closely, but if you upgrade to a paid options data feed, you&apos;ll
          get real IV history.
        </Callout>
        <div>
          <p><strong>What the panel shows you:</strong></p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>
              <strong>HV area chart</strong> — annualized 30-day realized vol over 6M / 1Y / 2Y. The slope
              tells you whether the regime is heating up or cooling down.
            </li>
            <li>
              <strong>Purple dashed line</strong> — current ATM IV from the nearest expiration, drawn on
              top of the HV chart. The gap between the line and the area is the volatility risk premium
              made visible.
            </li>
            <li>
              <strong>Amber dots</strong> — quarter-end earnings markers, snapped to the nearest trading
              day. Earnings reliably puff IV up before the print and crush it after — see{' '}
              <XRef to="greeks">vega</XRef> for why.
            </li>
            <li>
              <strong>HV-on-date picker</strong> — pick any trading day in the last two years; the panel
              shows that day&apos;s HV plus the delta vs today, so you can ask &ldquo;what was vol like
              last earnings?&rdquo; without leaving the page.
            </li>
            <li>
              <strong>Rank slider</strong> — a tiny horizontal bar with 52w low and high as endpoints
              and a tick mark at today. Green ≥ 70 (sell-vol regime), blue ≤ 30 (buy-vol regime), gray
              in between.
            </li>
          </ul>
        </div>
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
          N(·) is the standard normal CDF. <XRef to="greeks">Delta</XRef> for a call is simply N(d₁).
        </p>
        <Callout kind="insight" title="where Prism uses this">
          The <XRef to="screener-math">Buy Candidates</XRef> table computes delta for every contract via
          this formula using each contract&apos;s own IV as σ. That&apos;s what lets us filter on delta
          ranges (0.40–0.65 for buys) even though Yahoo doesn&apos;t ship Greeks with the chain.
        </Callout>
      </SubSection>

      <SubSection id="expected-move" title="Expected Move — the market's 1σ guess">
        <LivePanelLink href="/options#chain-panel" label="Chain header" />
        <p>
          The header of the Single-Expiration Chain shows a number like <em>±$4.85 (2.18%)</em>. That&apos;s
          the <strong>expected move</strong> — the market&apos;s best one-standard-deviation guess for
          where the stock will be at expiration. It comes from a beautifully simple shortcut:
        </p>
        <Formula>
          Expected move ≈ ATM call mid + ATM put mid<br />
          (using the strike closest to spot that has both quoted)
        </Formula>
        <p>
          Why this works: at the money, intrinsic value is roughly zero on both sides, so the call+put
          straddle is almost pure extrinsic — and that extrinsic is calibrated to{' '}
          <XRef to="iv-hv">implied volatility</XRef> times √T. The straddle price <em>is</em> the
          market&apos;s consensus 1σ move scaled to dollars, with no model assumptions you have to plug
          in yourself.
        </p>
        <Callout kind="example" title="reading the expected move">
          AAPL is at $222.50. The 30 DTE $222.50 call is bid 4.20 / ask 4.40 (mid 4.30) and the put is
          bid 4.30 / ask 4.50 (mid 4.40). Expected move = $4.30 + $4.40 = $8.70, or ±3.9%. The market
          is saying: by expiration, AAPL has roughly a 68% chance of finishing within $213.80 to $231.20.
          The header shows you both the dollar range and the percentage — green for the upper bound, red
          for the lower.
        </Callout>
        <Callout kind="insight" title="how to use it">
          Compare expected move against your own thesis. If you think AAPL is going to $240 by expiration
          and the market only prices ±$8.70, you&apos;re betting on a &gt;1σ move. That&apos;s fine, but
          it&apos;s good to know — most stocks don&apos;t do 1σ moves in a month, by definition. Expected
          move is also the <em>right</em> width to compare against your strikes when you size{' '}
          <XRef to="strategies">spreads</XRef>: selling outside the expected move is selling tail risk,
          which is where the <XRef to="iv-hv">volatility risk premium</XRef> lives.
        </Callout>
      </SubSection>

      <SubSection id="directional-lean" title="Directional Lean — what equidistant OTM premium says">
        <LivePanelLink href="/options#chain-panel" label="OTM Lean bar" />
        <p>
          Below the expected move, the chain header shows an <strong>OTM Lean</strong> bar — a thin
          green/red split with a label like &ldquo;Upside favored 12%&rdquo; or &ldquo;Balanced.&rdquo;
          It compares the price of an OTM call ~5% above spot with the price of an OTM put ~5% below
          spot.
        </p>
        <Formula>
          Skew% = (callPremium − putPremium) / (callPremium + putPremium) × 100
        </Formula>
        <p>
          Picking <em>equidistant</em> OTM strikes is the trick. At the same distance from spot, both
          contracts have similar gamma exposure and similar amounts of pure optionality, so the
          put-call parity carry tilt cancels out. What&apos;s left is the market&apos;s pricing of
          directional risk: which tail does the dealer community demand more premium for?
        </p>
        <Callout kind="insight" title="the asymmetry analogy">
          Think of OTM puts as flood insurance and OTM calls as upside lottery tickets. In equity
          markets, flood insurance almost always costs more than the lottery ticket — that&apos;s the
          well-known &ldquo;<XRef to="iv-skew">put skew</XRef>&rdquo; in single names and indexes. So
          a balanced bar usually <em>already</em> means modest upside lean, and a strongly upside-favored
          reading means the market is unusually willing to pay for upside (think: a takeover rumor, an
          AI hype cycle, a meme run).
        </Callout>
        <p>
          The bar is muted (gray label) for skews under 5%, green at +5% or higher (calls richer), red
          at −5% or below (puts richer). Strikes and premiums are printed beside it so you can sanity-
          check the read.
        </p>
      </SubSection>

      <SubSection id="iv-skew" title="Volatility Skew — the smile">
        <LivePanelLink href="/options#chain-panel" label="Chain · Skew view" />
        <p>
          Switch the chain to <strong>Skew</strong> view and you get a line chart: implied volatility
          on the y-axis, strike on the x-axis, with separate lines for calls (green) and puts (red).
          A vertical dashed line marks the ATM strike. The shape of those lines is the{' '}
          <Term>volatility surface</Term> sliced at one expiration — and the shape itself is information.
        </p>
        <Callout kind="insight" title="what the shape tells you">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Smile</strong> — both wings up, ATM low. Markets that fear two-sided shocks
              (FX, some commodities). Means the market thinks tails on both sides are underpriced by
              flat-vol Black-Scholes.
            </li>
            <li>
              <strong>Smirk / put skew</strong> — left wing (low strikes) much higher than right.
              The default for equity indexes and most large caps. Reflects crash-fear: nobody wants
              to be short an SPY 10%-OTM put through a panic.
            </li>
            <li>
              <strong>Reverse skew</strong> — right wing higher. Rare in stocks; common in commodities
              with supply constraints (oil, natgas) where the upside tail is the scary one.
            </li>
            <li>
              <strong>Flat</strong> — short-dated, high-rank IV regimes can flatten the smile out as
              all strikes converge on a similar level of fear.
            </li>
          </ul>
        </Callout>
        <p>
          The skew chart is where you confirm the read from the{' '}
          <XRef to="directional-lean">directional lean bar</XRef>. The lean tells you which tail is
          richer at the 5% mark; the skew chart shows you the full curve. If both 5% and 15% OTM puts
          are richly priced, that&apos;s persistent crash-fear; if only the deep tails are bid, it&apos;s
          a tail-hedger&apos;s footprint.
        </p>
      </SubSection>

      <SubSection id="pc-ratio" title="Put / Call Ratio — sentiment in one number">
        <LivePanelLink href="/options#chain-panel" label="Chain stats bar" />
        <p>
          The stats bar under the chain header has five tiles; the rightmost is the{' '}
          <strong>P/C Ratio</strong>. It&apos;s simply:
        </p>
        <Formula>
          P/C Ratio = Total put volume / Total call volume (this expiration)
        </Formula>
        <p>
          A reading above 1.0 means more puts traded than calls; below 1.0 means more calls. The
          all-equity P/C ratio averages around 0.7–0.8 in normal conditions because retail is structurally
          long calls.
        </p>
        <Callout kind="insight" title="contrarian or trend-confirming?">
          Both readings are used, depending on your school. Contrarians treat extreme P/C as a fade
          signal — a ratio of 2.0 on a single name often means panic-hedging is at its peak. Trend
          followers treat a sudden spike as confirmation of the move that triggered it. The honest
          answer: the same number means different things in different volatility regimes, which is why
          you should always read the P/C ratio next to <XRef to="iv-rank">IV rank</XRef> and the{' '}
          <XRef to="directional-lean">directional lean</XRef>, not on its own.
        </Callout>
        <p>
          The other four tiles in the bar (<em>Call Vol, Put Vol, Call OI, Put OI</em>) are the
          ingredients of the same dish — total call/put volume and total open interest at this
          expiration. Volume is today&apos;s flow; OI is the standing inventory of contracts. See{' '}
          <XRef to="open-interest-levels">OI by strike</XRef> for the more granular cut.
        </p>
      </SubSection>

      <SubSection id="chain-views" title="Chain views — chart, skew, detail">
        <LivePanelLink href="/options#chain-panel" label="Chain view tabs" />
        <p>
          Three buttons in the chain header pick the visualization for the selected expiration. They
          all read from the same data — the choice is what to emphasize.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Chart</strong> — stacked bars per strike, calls (green) on top of puts (red).
            Solid base = open interest, lighter top = today&apos;s volume. The <em>Band ±%</em> input
            zooms the x-axis to ±N% of spot so you can see the action without far-OTM strikes flattening
            the y-axis. This is the highest-bandwidth view: it shows where contracts live (OI), where
            today&apos;s flow is (Volume), and which side is dominating, all at once.
          </li>
          <li>
            <strong>Skew</strong> — the <XRef to="iv-skew">implied vol curve</XRef> by strike, calls vs
            puts as separate lines.
          </li>
          <li>
            <strong>Detail</strong> — a sortable table with one row per strike: Call OI / Vol / IV |
            Strike | Put IV / Vol / OI. Click any column header to sort ascending; click again for
            descending. The ATM row gets a subtle highlight. This is the view to use when you&apos;re
            stalking a specific strike or looking for the highest-OI contract on either side.
          </li>
        </ul>
        <Callout kind="insight" title="OI vs Volume — different questions">
          Open interest is the standing inventory of contracts: how many are <em>currently held</em>.
          Volume is today&apos;s flow. A strike with 50,000 OI and 200 volume is a position that was
          built up over weeks. A strike with 200 OI and 50,000 volume is brand-new positioning being
          opened today — possibly news-driven. The chart view stacks them so you can see both at the
          same time: solid bars are the resting army, lighter caps are today&apos;s recruits.
        </Callout>
      </SubSection>

      <SubSection id="open-interest-levels" title="Open Interest by Strike — magnets and walls">
        <LivePanelLink href="/options#oi-levels" label="OI by Strike panel" />
        <p>
          The Open Interest panel under the &ldquo;By DTE Window&rdquo; section is a horizontal ladder:
          puts on the left, calls on the right, strikes down the middle, with a dashed Spot row drawn
          in at the current price. Bar widths are scaled to the largest OI in the window, so the chart
          is self-normalizing.
        </p>
        <p>
          Unlike the per-expiration chain, this panel <em>aggregates</em> OI across every expiration
          in the chosen DTE window (default 30–90 days). That&apos;s on purpose: dealers and large
          holders position across multiple dates, and the aggregate view shows you where the cumulative
          inventory sits.
        </p>
        <Callout kind="insight" title="why traders care about OI clusters">
          Big OI strikes act like magnets and walls. The mechanism is dealer hedging: market makers
          who are short a lot of calls at a given strike are forced to buy more shares as price rises
          toward it (their delta is climbing) and sell as it falls away. That hedging flow tends to
          pin price near the strike, especially as expiration nears. It&apos;s called the{' '}
          <Term>max pain</Term> phenomenon, and it&apos;s most visible in heavily-traded names like SPY
          and TSLA.
        </Callout>
        <p>
          A practical read: if you&apos;re sizing a directional trade, big call OI <em>above</em> spot
          is a soft ceiling and big put OI <em>below</em> spot is a soft floor — not because the OI
          itself does anything, but because the positioning that created it tends to defend it. Pair
          this view with the <XRef to="directional-lean">directional lean</XRef>: agreement
          (puts heavier AND below-spot put OI dominant) is a stronger signal than either alone.
        </p>
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
            <p>
              The trade-off is clear: cap your upside in exchange for a reliable income stream.
              Covered calls work best in <XRef to="iv-rank">high-IV-rank</XRef> regimes — you&apos;re
              selling expensive insurance.
            </p>
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
              catch: <XRef to="greeks">theta</XRef> and the need for the stock to move <em>enough</em>,
              {' '}<em>fast enough</em>. Most OTM long calls expire worthless not because the trader was
              wrong on direction but because they were wrong on timing.
            </p>
            <Callout kind="insight" title="the leverage trap">
              Buying a 0.20-delta call feels like cheap leverage — a small premium controls 100 shares.
              But you need the stock to move <em>past the strike plus the premium</em> before expiration
              for any profit at all. Compare what you need against the{' '}
              <XRef to="expected-move">expected move</XRef> for that expiration: if the breakeven is
              outside the 1σ range, you&apos;re betting on a move the market itself doesn&apos;t expect.
              Back-test: how often does your favorite stock make that move in 30 days? That&apos;s your
              real win rate.
            </Callout>
          </div>
        </div>
      </SubSection>

      <SubSection id="screener-math" title="How the Buy Candidates screener scores contracts">
        <LivePanelLink href="/options#buy-candidates" label="Buy Candidates panel" />
        <p>
          The Buy Candidates panel scans every contract across the next 6 expirations within your
          selected <Term>DTE</Term> window, requiring open interest ≥ 100 for liquidity. Then it
          filters and scores.
        </p>
        <div className="space-y-3">
          <div>
            <p>
              <strong>Filters</strong> — <XRef to="greeks">delta</XRef> 0.40–0.65 (near-ATM, real
              exposure without paying for deep ITM), ask ≥ $0.10. The 0.40 floor keeps you out of
              lottery-ticket territory; the 0.65 ceiling keeps you out of paying for intrinsic value
              you could just buy as stock.
            </p>
            <Formula>
              Score = (delta / (ask / spot)) × max(0.1, 1 − %moveNeeded)
            </Formula>
            <p>
              That&apos;s <em>leverage per dollar</em> (delta of stock-equivalent exposure for each
              percent of spot you spend) adjusted by required move to break even. Rewards contracts
              that give real delta exposure per dollar and don&apos;t need a miracle to pay off. The
              %moveNeeded factor is what stops the screener from loving 5-DTE contracts that need a
              10% rip to pay — those get hammered down even if their raw leverage looks fat.
            </p>
          </div>
          <div>
            <p><strong>Columns surfaced in the table:</strong></p>
            <ul className="list-disc pl-5 space-y-0.5 mt-1">
              <li><Term>Strike</Term> · <Term>Exp</Term> · <Term>DTE</Term> — the contract identity</li>
              <li><Term>Ask</Term> — what you pay per share (×100 for total)</li>
              <li><Term>Δ</Term> — Black-Scholes delta from each contract&apos;s own IV</li>
              <li><Term>B/E</Term> — breakeven = strike + ask</li>
              <li><Term>Move</Term> — % the stock has to move to reach breakeven (highlighted blue)</li>
              <li><Term>OI</Term> — open interest as a liquidity proxy</li>
            </ul>
          </div>
        </div>
        <Callout kind="warning" title="these are candidates, not recommendations">
          The score optimizes for mathematical properties that <em>usually</em> align with good
          risk/reward. It doesn&apos;t know about upcoming earnings, sector rotation, index-level macro
          risk, or the thing you read in the 10-K this morning. Use the screener to shortlist contracts
          worth looking at, then apply judgment — and always cross-check against{' '}
          <XRef to="iv-rank">IV rank</XRef> (don&apos;t buy calls when vol is at 90th percentile) and{' '}
          <XRef to="open-interest-levels">OI levels</XRef> (don&apos;t pick a strike with no liquidity
          to exit through).
        </Callout>
      </SubSection>

      <SubSection id="options-glossary" title="Quick glossary">
        <ul className="list-none space-y-1.5 pl-0">
          <li><Term>ITM</Term> — in-the-money. Call: spot &gt; strike. Put: spot &lt; strike. See <XRef to="intrinsic-extrinsic">intrinsic value</XRef>.</li>
          <li><Term>ATM</Term> — at-the-money. Strike ≈ spot. Highest <XRef to="greeks">gamma</XRef>; basis for the <XRef to="expected-move">expected move</XRef>.</li>
          <li><Term>OTM</Term> — out-of-the-money. Opposite of ITM. Pure extrinsic value — see <XRef to="intrinsic-extrinsic">intrinsic vs extrinsic</XRef>.</li>
          <li><Term>DTE</Term> — days to expiration. The DTE Window control filters the <XRef to="open-interest-levels">OI ladder</XRef> and <XRef to="screener-math">Buy Candidates</XRef>.</li>
          <li><Term>Assignment</Term> — the seller is obligated to honor the contract (deliver shares for a call). See <XRef to="strategies">strategies</XRef>.</li>
          <li><Term>Exercise</Term> — the buyer uses their right to buy/sell at the strike.</li>
          <li><Term>Open Interest</Term> — number of contracts currently held open. Liquidity proxy. See <XRef to="open-interest-levels">OI by strike</XRef>.</li>
          <li><Term>Volume</Term> — contracts traded today. Spikes often reflect news or positioning. Compare with OI in the <XRef to="chain-views">chart view</XRef>.</li>
          <li><Term>Bid / Ask</Term> — highest price a buyer will pay / lowest price a seller will accept. Mid = (bid + ask) / 2.</li>
          <li><Term>Straddle</Term> — long an ATM call and put at the same strike. Its premium is the <XRef to="expected-move">expected move</XRef>.</li>
          <li><Term>IV Crush</Term> — sudden drop in IV, typically post-earnings. Destroys long options via <XRef to="greeks">vega</XRef>.</li>
          <li><Term>Skew</Term> — the IV-vs-strike curve at one expiration. Visualized in the <XRef to="iv-skew">skew view</XRef>.</li>
          <li><Term>Max Pain</Term> — the strike where the most option value would expire worthless. Linked to <XRef to="open-interest-levels">OI clusters</XRef>.</li>
        </ul>
      </SubSection>
    </Section>
  );
}
