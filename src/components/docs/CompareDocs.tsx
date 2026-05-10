import { Section, SubSection, Formula, Callout, Term, XRef, LivePanelLink } from './DocsShell';

export default function CompareDocs() {
  return (
    <Section
      id="compare"
      title="Compare"
      lead="The Compare module stacks ETFs, mutual funds, and indices side by side on a total-return basis (dividends reinvested) so income-heavy funds aren't penalized against growth funds. Every panel answers a different question: long-term growth, the spread of plausible futures, how it held up in real crises, where the return actually came from, and how much your picks overlap."
    >
      <SubSection id="compare-tour" title="A tour of the Compare view">
        <LivePanelLink href="/compare" label="Open the Compare page" />
        <p>
          Pick up to six tickers; the S&amp;P 500 is added automatically as a benchmark. Each panel
          below is independently zoomable and sortable. Reading them in order roughly mirrors how
          you&apos;d evaluate a fund in real life:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Executive summary</strong> &mdash; headline stats per pick. See{' '}
            <XRef to="compare-summary">summary card</XRef>.
          </li>
          <li>
            <strong>Growth chart</strong> &mdash; what $10,000 turns into. See{' '}
            <XRef to="compare-growth">growth chart</XRef>.
          </li>
          <li>
            <strong>Returns table (CAGR)</strong> &mdash; annualized return over 1/3/5/10/15 years. See{' '}
            <XRef to="compare-returns">CAGR</XRef>.
          </li>
          <li>
            <strong>Projection cone</strong> &mdash; Monte Carlo spread of plausible futures. See{' '}
            <XRef to="compare-montecarlo">Monte Carlo</XRef>.
          </li>
          <li>
            <strong>Income breakdown</strong> &mdash; how much of the return came from price vs.
            dividends. See <XRef to="compare-income">income split</XRef>.
          </li>
          <li>
            <strong>Crash table</strong> &mdash; peak-to-trough drawdowns in real crises. See{' '}
            <XRef to="compare-drawdowns">drawdowns</XRef>.
          </li>
          <li>
            <strong>Correlation matrix</strong> &mdash; how much your picks move together. See{' '}
            <XRef to="compare-correlation">correlations</XRef>.
          </li>
          <li>
            <strong>Asset detail cards</strong> &mdash; per-fund metadata, sector mix, and top
            holdings. See <XRef to="compare-detail">asset cards</XRef>.
          </li>
        </ul>
        <Callout kind="insight" title="why this ordering">
          The first three panels tell you what happened on average. The next two tell you what
          range of outcomes is plausible and where the money actually came from. The last three
          tell you how the fund <em>behaved</em> &mdash; in crashes, alongside its siblings, and
          underneath the ticker. Same data, four different lenses.
        </Callout>
      </SubSection>

      <SubSection id="compare-picker" title="Asset picker — what you can compare">
        <LivePanelLink href="/compare#picker-panel" label="Open the picker" />
        <p>
          The picker accepts ETFs, mutual funds, and indices. Six popular picks are surfaced
          inline (VOO, VTI, QQQ, SCHD, FXAIX, VXUS) so you can stack a comparison in two clicks;
          search hits Yahoo Finance for anything else.
        </p>
        <p>
          Selection is capped at six to keep the growth chart readable &mdash; six distinct line
          colors is roughly where a chart stops being legible. The S&amp;P 500 is added as a
          benchmark automatically and is rendered dashed so it doesn&apos;t crowd your picks.
          Your selection persists across refreshes via <Term>localStorage</Term>.
        </p>
        <Callout kind="warning" title="data alignment">
          Funds with shorter histories (e.g. SCHD launched in 2011) only show numbers for periods
          they actually existed. Tables show &mdash; for periods before inception; the correlation
          window auto-trims to the dates all selected series share.
        </Callout>
      </SubSection>

      <SubSection id="total-return-basis" title="Total-return basis — why dividends matter">
        <p>
          Every CAGR, drawdown, Monte Carlo, and growth-chart number on this page uses the{' '}
          <strong>total-return</strong> series: the close price <em>plus</em> reinvested dividends.
          If you only charted price, SCHD (~3.5% yield) and VYM (~2.5% yield) would look
          permanently flat relative to growth funds &mdash; not because they underperformed, but
          because a third of their return was being paid out and reinvested off-chart.
        </p>
        <Formula>
          Total return = (Price end / Price start) × (1 + dividend reinvestment factor)
        </Formula>
        <p>
          The <XRef to="compare-income">income breakdown</XRef> panel reverses this for inspection
          &mdash; it splits each fund&apos;s CAGR back into price appreciation and the dividend
          contribution &mdash; but the other panels always show the combined number.
        </p>
      </SubSection>

      <SubSection id="compare-summary" title="Executive summary — the headline card">
        <LivePanelLink href="/compare#summary-panel" label="See the summary card" />
        <p>
          Four numbers per pick, all on the total-return basis:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>10y &amp; 5y CAGR</strong> &mdash; long-term annualized return. The 10y number
            covers a full cycle (one bull, one bear). The 5y number is more sensitive to the
            current regime.
          </li>
          <li>
            <strong>Volatility</strong> &mdash; annualized standard deviation of weekly log
            returns. SPY sits around 15&ndash;18%; QQQ closer to 22%; SCHD lower. See{' '}
            <XRef to="compare-returns">CAGR</XRef> for the math.
          </li>
          <li>
            <strong>Worst crisis</strong> &mdash; the deepest peak-to-trough drawdown the fund
            posted across all crisis windows in <XRef to="compare-drawdowns">the crash table</XRef>.
          </li>
        </ul>
        <p>
          When you compare two or more picks, a one-line summary above the cards calls out the
          10y leader and the spread (in percentage points per year) between best and worst.
          Single-asset mode shows the benchmark card alongside so you can read the delta at a
          glance.
        </p>
      </SubSection>

      <SubSection id="compare-growth" title="Growth chart — $10,000 over time">
        <LivePanelLink href="/compare#growth-panel" label="See the growth chart" />
        <p>
          Each series is rebased to <Term>$10,000</Term> at the start of the selected range
          (1Y / 5Y / 10Y / Max) so funds with different unit prices are visually comparable. The
          chart aligns on the <em>latest</em> first-date across all selected series, so a fund
          that launched in 2011 won&apos;t artificially extend the x-axis backwards with empty
          space.
        </p>
        <p>
          The benchmark line is dashed and rendered slightly thinner so your picks stay
          foreground. The footer tiles show the ending value and dollar gain per series so you
          don&apos;t have to hover the last point.
        </p>
        <Callout kind="warning" title="rebasing is a visual tool">
          Two funds ending at the same dollar value <em>do not</em> have the same CAGR if they
          had different starting dates. Always read the <XRef to="compare-returns">returns
          table</XRef> for the annualized number &mdash; the chart is for shape, the table is for
          comparison.
        </Callout>
      </SubSection>

      <SubSection id="compare-returns" title="CAGR — annualized return done right">
        <LivePanelLink href="/compare#returns-panel" label="See the returns table" />
        <p>
          <strong>CAGR</strong> (compound annual growth rate) is the steady yearly rate that turns
          your starting value into your ending value:
        </p>
        <Formula>
          CAGR = (Ending / Starting)^(1 / years) &minus; 1
        </Formula>
        <p>
          The table shows 1y, 3y, 5y, 10y, and 15y trailing CAGRs on the total-return series. Any
          cell shows &mdash; if the fund didn&apos;t exist for that full period. Columns are
          sortable; clicking a year header sorts the assets best-to-worst for that horizon.
        </p>
        <Callout kind="insight" title="why CAGR, not average return">
          A fund that goes +50% then &minus;50% has an arithmetic average return of 0%, but the
          actual outcome is &minus;25% (1.5 × 0.5 = 0.75). CAGR is the only return number that
          correctly compounds. If someone quotes you an &ldquo;average return&rdquo; without
          specifying CAGR, it&apos;s probably the wrong one.
        </Callout>
        <p>
          Volatility in the <XRef to="compare-summary">summary card</XRef> is computed from
          weekly log returns and annualized by &radic;(periods/yr) &mdash; the standard
          square-root-of-time scaling.
        </p>
      </SubSection>

      <SubSection id="compare-montecarlo" title="Monte Carlo — projecting plausible futures">
        <LivePanelLink href="/compare#montecarlo-panel" label="See the projection cone" />
        <p>
          For each fund, we run <strong>1,500 simulated futures</strong>, each one randomly
          drawing weekly log returns from the fund&apos;s trailing 10 years. The table shows
          where $10,000 could land at 5y / 10y / 15y horizons:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Pessimistic (p10)</strong> &mdash; only 10% of simulated futures did worse.
          </li>
          <li>
            <strong>Median (p50)</strong> &mdash; the middle outcome.
          </li>
          <li>
            <strong>Optimistic (p90)</strong> &mdash; only 10% did better.
          </li>
        </ul>
        <Formula>
          path_t = path_{'{t-1}'} × e^(r_sampled),  r_sampled ~ Uniform(historical log returns)
        </Formula>
        <p>
          This is <em>bootstrap resampling</em>, not a normal-distribution assumption. It
          preserves the actual return distribution &mdash; including fat tails and skew &mdash;
          which a Gaussian Monte Carlo would smooth away.
        </p>
        <Callout kind="warning" title="what this isn't">
          A bootstrap assumes the future is drawn from the same distribution as the past. It
          doesn&apos;t model regime changes, fees, sequence-of-returns risk, or events that
          aren&apos;t in the lookback window. The spread is a sanity check on{' '}
          <em>what range of outcomes is consistent with this fund&apos;s historical behavior</em>,
          not a forecast.
        </Callout>
      </SubSection>

      <SubSection id="compare-income" title="Income breakdown — where the CAGR came from">
        <LivePanelLink href="/compare#income-panel" label="See the income breakdown" />
        <p>
          Splits each fund&apos;s 10y total-return CAGR into two components:
        </p>
        <Formula>
          Total CAGR = Price-only CAGR + Dividend contribution
        </Formula>
        <p>
          The price-only series strips dividends. The difference between total and price CAGR is
          how much of the annualized return came from reinvesting payouts. For SCHD this is often
          ~30&ndash;40%; for QQQ it&apos;s a rounding error.
        </p>
        <p>
          Each card also shows the current TTM yield (from the fund profile), giving you both a
          historical and forward-looking read on income.
        </p>
        <Callout kind="insight" title="why split it">
          Two funds with the same 10y CAGR can have wildly different cash-flow profiles. A
          retiree spending dividends cares whether the return shows up as price or as cash; a
          taxable account holder cares because qualified dividends and capital gains are taxed
          differently. The CAGR alone hides both.
        </Callout>
      </SubSection>

      <SubSection id="compare-drawdowns" title="Drawdowns — how it held up in crashes">
        <LivePanelLink href="/compare#drawdowns-panel" label="See the crash table" />
        <p>
          For each crisis window, we compute the <strong>peak-to-trough drawdown</strong>: the
          worst single decline from a running high inside that window. Cells are shaded by
          intensity (deeper red = larger drawdown) so the worst hits jump off the page.
        </p>
        <Formula>
          drawdown_t = (Price_t / running_peak_t) &minus; 1
        </Formula>
        <p>
          Current crisis windows:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>2008 Financial Crisis</strong> &mdash; Oct 2007 to Mar 2009.</li>
          <li><strong>COVID Crash</strong> &mdash; Feb to Mar 2020.</li>
          <li><strong>2022 Bear Market</strong> &mdash; Jan to Oct 2022 (rates / inflation).</li>
          <li><strong>2025 Tariff Selloff</strong> &mdash; Feb to Apr 2025.</li>
          <li><strong>2026 Iran Volatility</strong> &mdash; Jan to Mar 2026.</li>
        </ul>
        <Callout kind="insight" title="drawdown vs volatility">
          Volatility is a symmetric measure &mdash; it punishes upside moves the same as downside.
          Drawdown is purely downside. A fund can have moderate annualized volatility and still
          post a brutal drawdown if the loss is concentrated in one stretch. This is what people
          actually feel when they hold through a crash.
        </Callout>
      </SubSection>

      <SubSection id="compare-correlation" title="Correlation matrix — how much your picks overlap">
        <LivePanelLink href="/compare#correlation-panel" label="See the correlation matrix" />
        <p>
          The matrix uses <strong>Pearson correlation</strong> on weekly log returns over the last
          5 years (or whatever shared window exists). The aligned series is the intersection of
          dates all selected funds share &mdash; otherwise a fund with shorter history would
          truncate the comparison for everyone.
        </p>
        <Formula>
          &rho;(A, B) = cov(A, B) / (&sigma;_A &times; &sigma;_B)
        </Formula>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>+1.0</strong> &mdash; perfectly synced; same bet, different wrapper.</li>
          <li><strong>0.0</strong> &mdash; unrelated.</li>
          <li><strong>&minus;1.0</strong> &mdash; perfectly opposed; one zigs when the other zags.</li>
        </ul>
        <p>
          The sidebar surfaces the most-correlated and least-correlated pair of your picks, the
          average pairwise correlation, and a count of pairs above 0.85 (which the UI labels as
          &ldquo;redundant&rdquo; &mdash; not because they&apos;re bad, but because owning both
          gets you very little diversification).
        </p>
        <Callout kind="warning" title="correlation is regime-dependent">
          In normal markets, gold and stocks have near-zero correlation. In a 2008-style crisis,
          everything correlates to 1 as investors sell whatever&apos;s liquid. The 5y window
          smooths regimes; it does not eliminate them.
        </Callout>
      </SubSection>

      <SubSection id="compare-detail" title="Asset detail cards — under the ticker">
        <LivePanelLink href="/compare#detail-panel" label="See the asset cards" />
        <p>
          One expandable card per pick. Collapsed shows price, day change, market cap, and
          headline profile data. Expanded reveals:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Top holdings</strong> &mdash; the largest positions in the fund with their
            portfolio weights. Useful for spotting concentration (QQQ&apos;s top 10 are ~50% of
            the fund) and overlap (VOO and VTI share the same mega-caps at slightly different
            weights).
          </li>
          <li>
            <strong>Sector weightings</strong> &mdash; bar chart of GICS sector exposure. Reveals
            tilts that the ticker name doesn&apos;t advertise (e.g. QQQ is ~50% tech).
          </li>
        </ul>
        <Callout kind="insight" title="holdings explain correlation">
          High correlations in the <XRef to="compare-correlation">matrix</XRef> usually have a
          mechanical explanation in this panel: two funds with the same top-10 will move
          together regardless of how their marketing copy positions them. Use the detail cards
          to <em>verify</em> a correlation, not just observe it.
        </Callout>
      </SubSection>
    </Section>
  );
}
