import { Section, SubSection, Formula, Callout, Term } from './DocsShell';

export default function FinancialsDocs() {
  return (
    <Section
      id="financials"
      title="Earnings & Cash Flow"
      lead="The balance sheet is a snapshot. The income statement and cash flow statement are movies — they describe what happened between two snapshots. Revenue came in, costs went out, and cash moved. For a LEAPS buyer holding for 18+ months, these two statements matter more than any daily price chart: you're buying the next several years of cash generation, not the next week of price action."
    >
      <SubSection id="income-vs-cashflow" title="Income statement vs cash flow — different lies, different truths">
        <p>
          These are the two flow statements, and they tell the same story from two different angles. Both
          start from revenue and end at a number the company earned. But they measure different things:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Income statement</strong> is <em>accrual-based</em>: revenue is recognized when
            earned (customer got the product), costs are matched when incurred. Net income at the bottom.
          </li>
          <li>
            <strong>Cash flow statement</strong> is <em>cash-based</em>: only actual cash movements, no
            matter what the accounting conventions say. Free cash flow at the bottom.
          </li>
        </ul>
        <Callout kind="insight" title="accrual vs cash is where accounting tricks live">
          Imagine you sell a customer $100 of software in December but they pay in March. Accrual
          accounting books $100 of revenue in December. The cash flow statement shows $0 until March.
          Most earnings manipulation happens in this gap — aggressive revenue recognition, hidden
          expenses, capitalized costs. The cash flow statement is much harder to fake, which is why
          <em> cash flow is more trustworthy than net income</em>.
        </Callout>
      </SubSection>

      <SubSection id="income-structure" title="How the income statement is stacked">
        <p>Read top-to-bottom. Each line subtracts something from the line above it:</p>
        <Formula>
          Revenue
          {'\n'}- Cost of Revenue (COGS)
          {'\n'}= Gross Profit
          {'\n'}- R&D, SG&A, Other OpEx
          {'\n'}= Operating Income
          {'\n'}- Interest Expense
          {'\n'}- Income Tax
          {'\n'}= Net Income
        </Formula>
        <p>
          Each subtraction removes a different <em>kind</em> of cost, which is what makes the margin
          ladder so useful. Gross margin tells you about unit economics (is the product profitable?).
          Operating margin tells you whether the overall business is profitable (does gross profit cover
          headcount and overhead?). Net margin tells you what&apos;s left for shareholders after creditors
          and the taxman.
        </p>
        <Callout kind="insight" title="think of it like a cascade">
          If gross margin is 50% and operating margin is 20%, you know OpEx eats 30 cents of every
          revenue dollar. If net margin is 15%, interest and tax eat another 5 cents. That
          decomposition — where each dollar goes — is almost always more informative than the final net
          income number.
        </Callout>
      </SubSection>

      <SubSection id="gross-margin" title="Gross Margin — the first signal of a moat">
        <Formula>Gross Margin = Gross Profit ÷ Revenue</Formula>
        <p>
          Gross profit is revenue minus the direct cost of producing whatever was sold (COGS).
          The ratio tells you what fraction of each revenue dollar survives <em>just the production
          step</em>, before any overhead, R&amp;D, marketing, interest, or tax.
        </p>
        <p>
          Gross margin is the purest signal of pricing power and unit economics. A high gross margin
          means the company can charge meaningfully more than it costs to deliver — that&apos;s a moat,
          a brand, a network effect, or a software-scale economic profile. A low gross margin means
          there&apos;s no room for error below: one bad quarter of OpEx wipes out profitability.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>70%+</strong> — software, premium consumer brands, pharma with active IP.</li>
          <li><strong>40–60%</strong> — strong consumer products, high-end hardware, most tech platforms.</li>
          <li><strong>20–35%</strong> — mass-market retail, industrials, transportation.</li>
          <li><strong>Under 15%</strong> — commodity businesses, grocery, airlines in normal times.</li>
        </ul>
        <Callout kind="warning" title="industry benchmarks matter more than the absolute number">
          A 25% gross margin is catastrophic for a SaaS company and normal for a grocer. Always compare
          to industry peers, not across industries.
        </Callout>
      </SubSection>

      <SubSection id="operating-margin" title="Operating Margin — does the whole machine make money?">
        <Formula>Operating Margin = Operating Income ÷ Revenue</Formula>
        <p>
          Operating income (EBIT) is gross profit minus <strong>all</strong> operating expenses — R&amp;D,
          SG&amp;A, depreciation, marketing, the entire headcount. Operating margin tells you whether the
          business as a whole (not just the product) produces a profit from operations.
        </p>
        <p>
          This is the margin investors care about most for comparing companies, because it strips out
          capital-structure effects (interest) and tax-jurisdiction effects. Two companies with
          identical operations but different debt loads will have the same operating margin but
          different net margins.
        </p>
        <Callout kind="insight" title="operating leverage is the compounding ingredient">
          When revenue grows faster than OpEx, operating margin expands — and a small expansion in
          margin times large revenue is where real earnings growth comes from. A company going from
          15% → 20% operating margin on $10B of revenue adds $500M of operating income without
          selling a single extra unit. <em>This</em> is the mechanism that drives LEAPS payoffs.
        </Callout>
      </SubSection>

      <SubSection id="net-margin" title="Net Margin — what actually belongs to shareholders">
        <Formula>Net Margin = Net Income ÷ Revenue</Formula>
        <p>
          Net margin is the bottom-line cut after interest, tax, and any one-off items. It&apos;s the
          share of each revenue dollar that theoretically belongs to shareholders. But two warnings:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>It&apos;s easily distorted</strong> — a one-time tax benefit, gain on an asset
            sale, or non-cash write-down can shift net income a lot without reflecting operations.
          </li>
          <li>
            <strong>It&apos;s not cash</strong> — net income is an accrual measure. The company
            might not have received (or spent) the cash that net income implies.
          </li>
        </ul>
        <Callout kind="warning" title="beware the single quarter">
          One great quarter of net margin doesn&apos;t mean anything structural — check whether it
          repeats. Three years of expanding net margin alongside expanding operating margin is a much
          stronger signal than a single quarterly beat.
        </Callout>
      </SubSection>

      <SubSection id="rev-growth" title="Revenue growth YoY — the top-line heartbeat">
        <Formula>Revenue Growth = (Current Revenue − Prior Revenue) ÷ |Prior Revenue|</Formula>
        <p>
          Year-over-year revenue growth is the trajectory of the top line. For a LEAPS buyer this
          matters more than quarter-over-quarter growth because you&apos;re trying to identify
          <em> durable</em> growth — businesses that compound. Quarterly growth is noisy
          (seasonality, one-off contracts). Annual growth smooths that.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>&gt; 20%</strong> — high-growth company. Most of the terminal value in valuation.</li>
          <li><strong>10–20%</strong> — solid mid-cycle growth. Often the sweet spot for LEAPS.</li>
          <li><strong>0–10%</strong> — mature. Needs margin expansion or capital return to drive shareholder value.</li>
          <li><strong>Negative</strong> — declining. Either a temporary setback or a structural problem.</li>
        </ul>
        <Callout kind="insight" title="decelerating growth is a bigger deal than absolute level">
          A company going from 40% → 30% growth is often a worse story than one going from 15% → 18%,
          even though 30% is higher. Markets price growth <em>rates</em>, and deceleration gets
          punished. Check at least three years of growth to see the second derivative.
        </Callout>
      </SubSection>

      <SubSection id="eps-growth" title="EPS growth vs net income growth — why shares outstanding matter">
        <Formula>EPS = Net Income ÷ Weighted Avg Diluted Shares</Formula>
        <p>
          Earnings per share is net income divided by how many shares exist. EPS can grow faster than
          net income (buybacks shrink the denominator) or slower (dilution from SBC grows the
          denominator).
        </p>
        <Callout kind="warning" title="SBC silently dilutes every quarter">
          If a company has 10% net income growth but shares outstanding are growing 4% per year from
          stock-based compensation, EPS only grows ~6%. LEAPS buyers care about EPS, not aggregate
          net income — because your claim is per-share. Check that EPS growth tracks net income
          growth, or explicitly matches the buyback pace. A large gap is a red flag.
        </Callout>
      </SubSection>

      <SubSection id="interest-coverage" title="Interest Coverage — can the company pay its bondholders?">
        <Formula>Interest Coverage = Operating Income ÷ Interest Expense</Formula>
        <p>
          How many times the company&apos;s operating profit covers its annual interest bill. A 10×
          ratio means the company could lose 90% of its operating income and still cover interest. A
          2× ratio means one bad year puts the company on a knife edge.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>&gt; 10×</strong> — investment-grade fortress balance sheet.</li>
          <li><strong>5–10×</strong> — comfortable.</li>
          <li><strong>2–5×</strong> — elevated risk — rate shocks or earnings dips squeeze fast.</li>
          <li><strong>&lt; 2×</strong> — distress-adjacent.</li>
        </ul>
        <Callout kind="insight" title="this is THE metric for rate sensitivity">
          When interest rates rise, companies with low interest coverage get repriced first, because
          refinancing their debt at higher rates compresses the ratio further. LEAPS on highly levered
          companies in rising-rate environments can get wrecked even if revenue is fine.
        </Callout>
      </SubSection>

      <SubSection id="free-cash-flow" title="Free Cash Flow — the single most important number">
        <Formula>FCF = Operating Cash Flow − Capital Expenditures</Formula>
        <p>
          Free cash flow is what&apos;s left after the business covers both its operations and the
          CapEx needed to keep the business running. It&apos;s the cash truly available to return to
          shareholders, pay down debt, acquire things, or build optionality.
        </p>
        <p>
          Unlike net income, FCF is very hard to manipulate. Cash either moved or it didn&apos;t. Net
          income can be smoothed with accruals; FCF cannot.
        </p>
        <Callout kind="insight" title="why LEAPS buyers live and die by FCF">
          A LEAPS is a long-duration bet. The thesis is: this company will generate much more cash
          over the next 18-24 months than the market currently assumes. That cash either compounds
          into book value, fuels buybacks that lift EPS, or gets returned as dividends. In all three
          cases, <em>cash generation is the driver</em>. A company with growing net income but
          declining FCF is the single most common warning sign of a failed LEAPS thesis.
        </Callout>
      </SubSection>

      <SubSection id="fcf-margin" title="FCF Margin — how much of revenue becomes distributable cash">
        <Formula>FCF Margin = Free Cash Flow ÷ Revenue</Formula>
        <p>
          FCF margin tells you what fraction of every revenue dollar ultimately ends up as distributable
          cash, after all operating costs and all the CapEx needed to sustain the business.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>&gt; 25%</strong> — software/platform economics. Rare and extremely valuable.</li>
          <li><strong>15–25%</strong> — strong consumer/tech business.</li>
          <li><strong>5–15%</strong> — typical industrial/services.</li>
          <li><strong>&lt; 5%</strong> — capital-intensive, commodity-like, or still-investing phase.</li>
          <li><strong>Negative</strong> — cash-burning. Either pre-scale or structurally unprofitable.</li>
        </ul>
        <Callout kind="warning" title="CapEx intensity is industry-specific">
          A telecom or semiconductor fab can have great operating margins but low FCF margin because
          they need constant CapEx to stay in business. A SaaS company might have lower gross margin
          but higher FCF margin because it barely needs any CapEx. Compare within industry.
        </Callout>
      </SubSection>

      <SubSection id="earnings-quality" title="CFO ÷ Net Income — the quality-of-earnings gauge">
        <Formula>Earnings Quality = Operating Cash Flow ÷ Net Income</Formula>
        <p>
          This ratio compares the accrual view (net income) with the cash view (operating cash flow).
          If they&apos;re close to each other (ratio near 1.0), reported earnings are backed by real
          cash. If they diverge, the gap is explained by working-capital movements, accrual timing, or
          non-cash items.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>&gt; 1.2×</strong> — CFO exceeds net income. Often healthy (D&amp;A is a big non-cash expense). Can also mean depreciation is heavy.</li>
          <li><strong>0.9–1.2×</strong> — reported earnings and cash flow match. Clean reporting.</li>
          <li><strong>0.6–0.9×</strong> — accrual-heavy earnings. Check whether receivables or inventory are building.</li>
          <li><strong>&lt; 0.6× or negative</strong> — red flag. Reported earnings materially exceed cash.</li>
        </ul>
        <Callout kind="warning" title="this is the Enron detector">
          Enron, WorldCom, and most of the big accounting scandals had persistently low CFO/NI ratios
          for years before the collapse. It&apos;s not a guarantee of fraud, but it&apos;s the
          single best numeric signal that reported earnings aren&apos;t translating into cash. If a
          company you&apos;re considering has CFO/NI below 0.8 for multiple years, read the
          working-capital footnotes carefully.
        </Callout>
      </SubSection>

      <SubSection id="capex-intensity" title="CapEx Intensity — how much reinvestment does the business need?">
        <Formula>CapEx Intensity = |Capital Expenditures| ÷ Revenue</Formula>
        <p>
          What fraction of revenue has to be reinvested each year just to keep the business running
          (plus growth CapEx). A low-CapEx business is a compounding machine; a high-CapEx business
          runs on a treadmill where cash comes in but immediately has to go back out to the factory.
        </p>
        <Callout kind="insight" title="think of CapEx as a tax on revenue">
          Two companies with identical operating margins can have very different FCF profiles if one
          has 5% CapEx intensity and the other has 20%. The first converts 15% of revenue to FCF;
          the second converts &lt; 0%. For LEAPS where you care about cash, this difference is
          <em> enormous</em>.
        </Callout>
      </SubSection>

      <SubSection id="sbc-intensity" title="SBC Intensity — the hidden cost of paying employees in stock">
        <Formula>SBC Intensity = Stock-Based Compensation ÷ Revenue</Formula>
        <p>
          Stock-based compensation doesn&apos;t show up in net income the way cash salaries do (it&apos;s
          added back in the cash flow statement as a &quot;non-cash expense&quot;), but it&apos;s a
          <em> real economic cost</em>: the company is diluting every existing shareholder by issuing
          new shares to employees.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>&lt; 3%</strong> — minimal dilution pressure.</li>
          <li><strong>3–8%</strong> — meaningful but typical for tech. Watch whether buybacks offset it.</li>
          <li><strong>&gt; 10%</strong> — heavy dilution. Often tech companies using stock as currency to attract talent.</li>
        </ul>
        <Callout kind="warning" title="why LEAPS buyers should care">
          You&apos;re buying a fixed number of shares via the contract. If shares outstanding grow 10%
          per year from SBC, your slice of the company shrinks 10% per year unless buybacks offset it.
          Many &quot;GAAP-profitable&quot; tech companies look much less profitable once you subtract
          real SBC from reported earnings. Check if the company buys back enough stock to keep share
          count flat — if not, reported EPS growth is partially a mirage.
        </Callout>
      </SubSection>

      <SubSection id="capital-return" title="Dividends vs buybacks — how cash gets returned">
        <p>
          Companies return cash to shareholders in two ways:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Dividends</strong> — cash paid to every shareholder per share. Taxable when
            received. Visible.
          </li>
          <li>
            <strong>Buybacks</strong> — the company buys its own stock on the market, shrinking shares
            outstanding. More tax-efficient (no dividend tax) and mechanically raises EPS.
          </li>
        </ul>
        <Formula>
          Payout Ratio = Dividends ÷ Net Income
          {'\n'}Buyback / FCF = Buybacks ÷ Free Cash Flow
          {'\n'}Net Shareholder Return = (Dividends + Buybacks) ÷ FCF
        </Formula>
        <p>
          The <strong>Net Shareholder Return</strong> ratio tells you whether the company is returning
          more cash than it produces. If total shareholder payouts exceed FCF, the excess is being
          funded by debt issuance or cash drawdown — not sustainable long-term.
        </p>
        <Callout kind="insight" title="LEAPS and buybacks are a powerful combo">
          A company doing large buybacks mechanically shrinks share count, which compresses EPS
          growth relative to net income growth. LEAPS on companies with consistent buyback programs
          benefit from this directly — the same net income is distributed across fewer shares, so
          each share (and each LEAPS) is worth more. But only if the buybacks are FCF-funded, not
          debt-funded.
        </Callout>
      </SubSection>

      <SubSection id="fin-swot-framework" title="Financials SWOT framework — how Prism reads earnings">
        <p>
          The same SWOT structure from the balance sheet module applies here, but the rules focus on
          profitability, growth, and cash quality. Examples of what fires each quadrant:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Strengths</strong> — gross margin &gt; 60%, operating margin &gt; 25%, FCF margin
            &gt; 15%, CFO/NI near or above 1.0, interest coverage &gt; 10×, rev growth &gt; 20%.
          </li>
          <li>
            <strong>Weaknesses</strong> — operating losses, negative FCF, CFO/NI &lt; 0.6, SBC &gt;
            15% of revenue, thin interest coverage.
          </li>
          <li>
            <strong>Opportunities</strong> — operating margin in the 5-15% band (room for expansion),
            positive FCF with no dividends or buybacks yet (future capital return optionality).
          </li>
          <li>
            <strong>Threats</strong> — margin compression alongside revenue growth, capital return
            exceeding FCF, multi-year revenue declines, interest coverage &lt; 2×.
          </li>
        </ul>
        <Callout kind="insight" title="cross-reference with the balance sheet SWOT">
          A &quot;strong&quot; income statement with a &quot;fragile&quot; balance sheet is the
          classic late-cycle profile: the business looks great but can&apos;t survive a downturn.
          A &quot;weak&quot; income statement with a &quot;strong&quot; balance sheet is the turnaround
          setup: the business is running poorly but has the runway to fix it. Read both modules
          together.
        </Callout>
      </SubSection>

      <SubSection id="fin-forward-looking" title="Forward-looking earnings signals">
        <p>
          The forward-looking section tells you what future changes in these statements would confirm
          improvement or signal deterioration — i.e., what to watch for in the next earnings release.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Revenue growth</strong> accelerating (or stable at double digits) alongside held
            gross margin → durable business momentum.
          </li>
          <li>
            <strong>Margin</strong> expanding 20-50 bps per period → pricing power or scale leverage
            compounding.
          </li>
          <li>
            <strong>FCF</strong> growing faster than net income, CFO/NI near or above 1.0 → reported
            earnings are real cash, not accrual smoke.
          </li>
          <li>
            <strong>Capital return</strong> staying at or below FCF → self-funded, sustainable. Above
            FCF (or rising while FCF falls) → borrowed-from-the-future.
          </li>
        </ul>
        <Callout kind="insight" title="how to use this in practice">
          When the next 10-Q drops, don&apos;t just look at whether revenue &quot;beat&quot;
          consensus. Pull up the four signals: is gross margin expanding or compressing? Is CFO
          tracking net income? Is share count growing or shrinking? Those answers tell you whether the
          investment thesis is <em>still intact</em>, beyond whatever the headline number does to the
          stock for 48 hours.
        </Callout>
      </SubSection>

      <SubSection id="how-financials-works" title="How this module works under the hood">
        <p>
          Prism pulls standardized financial data from the SEC&apos;s EDGAR API (same source as the
          balance sheet module), using the XBRL-tagged concepts every public US filer has to report.
          For each fiscal period, the pipeline:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Identifies up to 4 most-recent fiscal years (or quarters if annual data is unavailable) by
            matching duration facts — annual facts are filings covering 330–400 days, quarterly facts
            cover 75–100 days.
          </li>
          <li>
            Extracts income statement lines (revenue, COGS, operating income, net income, EPS, shares)
            and cash flow lines (CFO, CFI, CFF, CapEx, D&amp;A, SBC, buybacks, dividends, debt
            issued/repaid) in priority order — first GAAP concept that matches wins per field.
          </li>
          <li>
            Computes all ratios deterministically from the extracted values. Every number you see in
            the UI comes directly from the filings and a short math expression — no black-box models.
          </li>
          <li>
            Runs rule-based SWOT + forward-looking generation. The same rules fire for every company,
            so &quot;high gross margin&quot; means the same thing across your watchlist.
          </li>
        </ol>
        <Callout kind="warning" title="limitations to know">
          Some companies (especially non-US filers, newer IPOs, or REITs) have non-standard GAAP
          tagging. If a concept isn&apos;t tagged the way the extractor expects, the field will be
          blank. The ratio logic is robust to missing inputs — it skips metrics rather than making
          them up. If you see &quot;—&quot; in a card, the underlying data wasn&apos;t reported in a
          way we could auto-extract. Always sanity-check against the actual 10-K when using this for
          real decisions. Also: XBRL concept <Term>Revenues</Term> sometimes overlaps with
          <Term> RevenueFromContractWithCustomerExcludingAssessedTax</Term> — the extractor uses the
          latter when available (ASC 606 standard).
        </Callout>
      </SubSection>
    </Section>
  );
}
