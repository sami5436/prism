import { Section, SubSection, Formula, Callout, Term } from './DocsShell';

export default function BalanceSheetDocs() {
  return (
    <Section
      id="balance-sheet"
      title="Balance Sheet"
      lead="A balance sheet is a snapshot of everything a company owns, everything it owes, and the residual that belongs to shareholders — all frozen at one moment in time. Think of it like a git commit of the company's financial state: not a movie of what happened, just the state at the end of the period."
    >
      <SubSection id="accounting-equation" title="The accounting equation (why balance sheets balance)">
        <p>
          Every balance sheet obeys one identity — no exceptions, not even when companies are cooking
          the books:
        </p>
        <Formula>Assets = Liabilities + Equity</Formula>
        <p>
          <strong>Assets</strong> are everything the company has: cash, factories, inventory, IP, cash it
          expects customers to pay. <strong>Liabilities</strong> are what it owes to non-owners: suppliers,
          bondholders, banks, employees. <strong>Equity</strong> is what&apos;s left over for shareholders
          after all the debts are paid.
        </p>
        <Callout kind="insight" title="why it MUST balance">
          Every dollar of stuff a company owns was funded by exactly one source: either someone lent it
          (liabilities) or the owners put it in / kept it there (equity). It&apos;s an invariant in the
          CS sense — like the sum of a balanced binary tree&apos;s children always equalling the root.
          If a balance sheet doesn&apos;t balance, someone typed a number wrong.
        </Callout>
      </SubSection>

      <SubSection id="bs-structure" title="How the balance sheet is organized">
        <p>
          Everything is grouped into three buckets, each split by time horizon: <strong>current</strong>
          (cash or usable within 12 months) and <strong>non-current</strong> (longer than that).
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Current assets:</strong> cash, short-term investments, accounts receivable (money
            customers owe you), inventory.
          </li>
          <li>
            <strong>Non-current assets:</strong> PP&amp;E (property, plant, equipment), goodwill,
            intangibles (patents, trademarks, software).
          </li>
          <li>
            <strong>Current liabilities:</strong> accounts payable (bills), short-term debt, current
            portion of long-term debt.
          </li>
          <li>
            <strong>Non-current liabilities:</strong> long-term debt, pension obligations.
          </li>
          <li>
            <strong>Equity:</strong> contributed capital + retained earnings − treasury stock.
          </li>
        </ul>
        <p>
          The current/non-current split is about <em>liquidity</em>: can the company pay next
          quarter&apos;s bills with what&apos;s readily available, or does it have to sell a factory?
          Current items are like L1 cache — fast to access. Non-current items are cold storage.
        </p>
      </SubSection>

      <SubSection id="filing-types" title="10-K vs 10-Q — what filing you're reading">
        <p>
          Public US companies are required by the SEC to publish their financials on a schedule. The
          two most important forms — and the two you&apos;ll see most in this tool — are the 10-K and
          the 10-Q.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>10-K</strong> — the <em>annual</em> report. Filed once per fiscal year, audited by
            an external firm, and includes a full narrative (business overview, risk factors,
            MD&amp;A, every footnote). Think of it like a major release: slow, thorough, signed off
            by QA.
          </li>
          <li>
            <strong>10-Q</strong> — the <em>quarterly</em> report. Filed three times per year (Q1, Q2,
            Q3 — the Q4 results roll into the 10-K). <strong>Unaudited</strong>, lighter narrative,
            mostly numbers. Think of it like a patch release: faster cadence, less review, but more
            recent.
          </li>
        </ul>
        <Callout kind="insight" title="why the distinction matters">
          The 10-K is what you anchor long-term theses on because the numbers have been audited and
          management has had to commit to disclosures under heavier legal exposure. The 10-Q is how
          you track whether the annual thesis is still playing out in real time. Prism tags each
          analysis with the filing type so you always know which kind of data you&apos;re looking at —
          a 10-Q snapshot is a leading indicator; a 10-K is a confirmation.
        </Callout>
        <Callout kind="warning" title="comparing across form types">
          Don&apos;t directly compare a 10-Q (a single quarter end) against a 10-K (fiscal year end)
          and treat the difference as a trend — seasonality (e.g. retail inventory spikes in Q3) will
          dominate. Compare 10-K to 10-K, or Q1 of this year to Q1 of last year.
        </Callout>
      </SubSection>

      <SubSection id="current-ratio" title="Current Ratio — can they pay the bills?">
        <Formula>Current Ratio = Current Assets / Current Liabilities</Formula>
        <p>
          This measures short-term survivability. If current liabilities are $50M and current assets
          are $100M, the ratio is 2.0 — meaning for every $1 coming due in the next year, the company
          has $2 of liquid stuff to cover it.
        </p>
        <Callout kind="insight" title="what &quot;good&quot; means by industry">
          A 1.5–3.0 ratio is healthy for most industrials. But software companies routinely run at
          4–6 because they don&apos;t carry inventory. Supermarkets often sit near 1.0 because their
          inventory turns over so fast — by the time the bill is due, they&apos;ve already sold the
          groceries. Compare to peers, not to a universal benchmark.
        </Callout>
        <Callout kind="warning" title="when the current ratio lies">
          A high current ratio can just mean the company is hoarding cash or stuck with unsellable
          inventory. Dig into the <em>composition</em> — is most of it cash, or six years of unsold
          product? The current ratio treats inventory as if it were cash, which is generous.
        </Callout>
      </SubSection>

      <SubSection id="quick-ratio" title="Quick Ratio — the paranoid cousin">
        <Formula>Quick Ratio = (Current Assets − Inventory) / Current Liabilities</Formula>
        <p>
          Same setup as the current ratio, but we throw out the inventory. Why? Because inventory is
          the <em>least trustworthy</em> piece of &quot;liquid&quot; assets. You can&apos;t pay a bill
          with half-built phones — you have to sell them first, often at a discount.
        </p>
        <p>
          If the quick ratio is much lower than the current ratio, the company&apos;s short-term
          health depends on moving inventory. That&apos;s fine for a hot retailer; it&apos;s scary
          for a struggling one.
        </p>
        <Callout kind="example" title="a concrete case">
          Current assets $200M (of which inventory is $120M), current liabilities $100M. Current
          ratio is 2.0 (looks great). Quick ratio is ($200M − $120M) / $100M = 0.8 (below 1 —
          they&apos;d be short if sales froze for even a quarter).
        </Callout>
      </SubSection>

      <SubSection id="cash-ratio" title="Cash Ratio — the worst-case stress test">
        <Formula>Cash Ratio = (Cash + Short-Term Investments) / Current Liabilities</Formula>
        <p>
          The most conservative liquidity ratio. We assume every customer stops paying, inventory
          becomes worthless, and ask: <em>can the company still cover its near-term bills with just
          the money literally in the bank?</em>
        </p>
        <p>
          A cash ratio ≥ 1.0 is what we call a <Term>balance-sheet fortress</Term> — cash alone
          covers every short-term obligation. Think Apple, Alphabet, Microsoft in strong years.
          A ratio below 0.1 with thin working capital means the company is one bad quarter away from
          tapping a credit line.
        </p>
      </SubSection>

      <SubSection id="debt-equity" title="Debt-to-Equity — how leveraged are they?">
        <Formula>D/E = Total Liabilities / Total Equity</Formula>
        <p>
          Leverage measures how much of the company is financed by borrowing vs. owners&apos; money.
          A 2.0 ratio means creditors have put in $2 for every $1 of equity.
        </p>
        <p>
          Leverage amplifies returns in both directions. In good times, profits flow to a small
          equity base → big ROE. In bad times, interest payments are fixed but revenue isn&apos;t — a
          small revenue drop can wipe equity entirely. It&apos;s like running your code with
          performance optimisations that only work when input is well-formed.
        </p>
        <Callout kind="insight" title="the &quot;industry baseline&quot; problem">
          Banks run at D/E of 10+ and that&apos;s healthy — their business <em>is</em> borrowing and
          lending. A tech company at D/E of 10 is a disaster waiting to happen. For utilities, D/E of
          1–2 is normal because cash flows are predictable. Always benchmark against the industry.
        </Callout>
        <Callout kind="warning" title="negative equity">
          If a company has lost (or returned) more than it ever raised, equity goes negative and D/E
          stops making sense. That&apos;s not a subtle flag — that&apos;s creditors technically owning
          everything on paper.
        </Callout>
      </SubSection>

      <SubSection id="debt-assets" title="Debt-to-Assets — a complementary leverage view">
        <Formula>D/A = Total Liabilities / Total Assets</Formula>
        <p>
          Same story as D/E but bounded between 0 and 1 (so it plays nicely with negative-equity
          situations where D/E breaks). 0.4 means 40% of the asset base is funded by debt, 60% by
          equity and retained earnings.
        </p>
        <p>
          Use D/A when comparing a diverse set of companies whose equity bases differ wildly or when
          one of them has negative equity — the ratio remains meaningful.
        </p>
      </SubSection>

      <SubSection id="working-capital" title="Working Capital — operational cushion">
        <Formula>Working Capital = Current Assets − Current Liabilities</Formula>
        <p>
          Same inputs as the current ratio, but as a dollar amount instead of a multiple. It answers:
          how much liquid money would be <em>left over</em> after paying every short-term bill?
        </p>
        <p>
          Positive working capital = day-to-day operations self-fund. Negative = the company relies
          on rolling over credit or fresh financing to meet payroll. Neither is automatically bad,
          but negative working capital requires confidence that cash keeps coming in.
        </p>
        <Callout kind="insight" title="why some great companies run negative">
          Amazon, Walmart, and Dell historically had <em>negative</em> working capital and it was a
          strength: they collected from customers before paying suppliers. They were essentially
          being financed interest-free by their supply chain. Negative working capital is a problem
          only when the business model <em>needs</em> a cushion and doesn&apos;t have one.
        </Callout>
      </SubSection>

      <SubSection id="goodwill" title="Goodwill — what is this line item really?">
        <p>
          Goodwill shows up when one company buys another for more than the target&apos;s book value.
          The excess gets parked on the acquirer&apos;s balance sheet as an asset called
          &quot;goodwill&quot;.
        </p>
        <Callout kind="example" title="how goodwill is created">
          Company A buys Company B for $10B. Company B&apos;s net identifiable assets are worth $6B.
          Company A records $6B of real assets plus $4B of goodwill — the premium paid for brand,
          team, future synergies, and whatever else justified the price.
        </Callout>
        <p>
          Goodwill/Assets tells you how much of the balance sheet is made of that premium. A high
          share means a lot of the &quot;assets&quot; are really bets that past acquisitions will
          pay off.
        </p>
        <Callout kind="warning" title="impairment risk">
          If the acquired business underperforms, auditors force the acquirer to <em>write down</em>
          goodwill — which hits earnings and can crash the stock. AOL Time Warner took a $54B
          goodwill writedown in 2002. High goodwill + acquisitions going sideways = a landmine.
        </Callout>
      </SubSection>

      <SubSection id="intangibles" title="Intangibles & Tangible Equity">
        <p>
          Intangibles are non-physical assets: patents, trademarks, customer relationships, software,
          data rights. They <em>can</em> be extremely valuable (Coca-Cola&apos;s brand, Google&apos;s
          patents) but they&apos;re hard to sell in bankruptcy and their carrying value depends on
          accounting judgment.
        </p>
        <Formula>Tangible Equity = Total Equity − Goodwill − Intangibles</Formula>
        <p>
          When Prism computes <Term>tangible equity</Term>, it&apos;s stripping out the soft stuff to
          see what&apos;s actually there in physical/financial form. If tangible equity is
          <em> negative</em> while reported equity is positive, the entire book value is being held
          up by acquisition premiums. That&apos;s a red flag — a single impairment could push the
          firm into technical insolvency on paper.
        </p>
      </SubSection>

      <SubSection id="composition-ratios" title="Composition ratios — what's inside the totals">
        <p>
          The headline ratios treat all current assets as interchangeable. They&apos;re not.
          Composition ratios crack the black box:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>AR / Current Assets</strong> — how much of &quot;liquidity&quot; is actually
            customer IOUs. High (&gt; 50%) means short-term solvency is a bet on customer payment
            behaviour.
          </li>
          <li>
            <strong>Inventory / Current Assets</strong> — how much is finished or in-progress product.
            High (&gt; 40%) means obsolescence or markdown risk is sitting inside the headline
            liquidity number.
          </li>
          <li>
            <strong>AP / Current Liabilities</strong> — how much of the short-term obligations are
            supplier bills. Low share (&lt; 20%) can mean there&apos;s room to <em>extend</em>
            supplier terms and free up working capital.
          </li>
          <li>
            <strong>Short-term Debt / Total Debt</strong> — how much of the debt load is coming due
            within 12 months. Above 50% signals a <Term>refinancing wall</Term>: any spread widening
            hits the P&amp;L directly.
          </li>
        </ul>
      </SubSection>

      <SubSection id="swot-framework" title="The SWOT framework — how Prism reasons">
        <p>
          A list of ratios on its own doesn&apos;t tell you what to think. So Prism compiles them
          into a four-quadrant <strong>SWOT analysis</strong>, modelled after the one equity analysts
          use. Every item is derived <em>strictly</em> from the balance sheet — no LLM calls, no
          hand-waving — just thresholds applied to ratios and year-over-year deltas.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Strengths</strong> — <em>structural advantages</em> already present. Robust
            liquidity (current ratio ≥ 2), cash-fortress balance sheet (cash ratio ≥ 1), conservative
            leverage (D/E &lt; 0.5), a deep retained-earnings base, active deleveraging.
          </li>
          <li>
            <strong>Weaknesses</strong> — <em>structural fragility or dependence</em> visible in the
            numbers. Current liabilities exceeding current assets, liquidity depending on inventory
            (quick ratio ≪ current ratio), elevated leverage, accumulated deficit, negative tangible
            equity, receivables concentration.
          </li>
          <li>
            <strong>Opportunities</strong> — <em>what the company could do</em> given its current
            shape. Untapped debt capacity, room for capital return (buybacks/dividends) when cash is
            excess, room to extend supplier payment terms.
          </li>
          <li>
            <strong>Threats</strong> — <em>scenarios that would make today&apos;s balance sheet a
            problem</em>. Thin liquidity cushion, high short-term-debt share (refi wall), goodwill
            exceeding 40% of assets (impairment risk), rapidly expanding AR/AP/debt.
          </li>
        </ul>
        <Callout kind="insight" title="how it's actually generated">
          Under the hood, each SWOT item is a deterministic rule: &quot;if currentRatio &gt;= 2 then
          push Strengths item &apos;Robust short-term liquidity&apos;&quot;, and so on. Same ratios
          in, same SWOT out, every time. The reasoning is <em>transparent</em> — you can trace every
          conclusion back to a specific line item. No black box.
        </Callout>
        <Callout kind="warning" title="SWOT is a starting point, not a verdict">
          &quot;Weakness: elevated leverage&quot; is a prompt for research, not a sell signal.
          Elevated vs. what? Why? Did they just do a leveraged buyback? A pandemic-era revolver
          drawdown? The balance sheet gives you the question. Finding the answer still requires
          reading the 10-K&apos;s MD&amp;A section.
        </Callout>
      </SubSection>

      <SubSection id="forward-looking" title="Forward-looking signals — what to watch next quarter">
        <p>
          A balance sheet is a point-in-time snapshot, so it can&apos;t directly tell you where a
          company is going. But <em>how specific line items change</em> in the next filing is
          enormously informative. Prism spells out, for each major area, what direction would
          confirm improvement vs. signal deterioration.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Accounts Receivable:</strong> AR growing slower than revenue = tighter
            collections, more cash conversion. AR growing <em>faster</em> than revenue = slower
            payments, credit stress at customers, or channel-stuffing.
          </li>
          <li>
            <strong>Accounts Payable:</strong> Stable AP/COGS = supplier terms holding. Ballooning
            AP without matching revenue = the company is stretching vendors, often a precursor to a
            liquidity event.
          </li>
          <li>
            <strong>Debt:</strong> Falling total debt or a shift from short-term to long-term debt
            lowers refinancing risk. Rising short-term debt share or new revolver draws = the
            capital structure is weakening.
          </li>
          <li>
            <strong>Working Capital:</strong> Working capital growing slower than revenue = improving
            capital efficiency (classic operating-leverage expansion). Working capital ballooning
            faster than revenue = each new dollar of sales ties up more cash.
          </li>
        </ul>
        <Callout kind="insight" title="why this framing is powerful">
          These aren&apos;t predictions — they&apos;re <em>hypotheses with falsification criteria</em>.
          Before the next 10-Q drops, you already know what would confirm or break your thesis. If
          you expected AR to fall and it rose 25%, you know instantly something in the collections
          story has changed. This is the analyst&apos;s version of writing tests before shipping
          features.
        </Callout>
      </SubSection>

      <SubSection id="how-prism-ranks" title="How this module puts it together">
        <p>
          Upload a 10-K/10-Q HTML or XBRL file, or just a ticker — the pipeline:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Parses</strong> the filing deterministically (SEC EDGAR XBRL API for tickers;
            iXBRL tag extraction for uploaded 10-K/10-Q HTML).
          </li>
          <li>
            <strong>Detects filing type</strong> (10-K / 10-Q / 20-F / 40-F) from either the
            EDGAR <code>form</code> field or the <code>dei:DocumentType</code> XBRL tag, and surfaces
            it on the results page.
          </li>
          <li>
            <strong>Normalizes</strong> line items into a consistent schema — up to 4 recent periods.
          </li>
          <li>
            <strong>Computes 14 ratios</strong> — liquidity (current, quick, cash), leverage (D/E,
            D/A, short-term-debt share), asset quality (goodwill/assets, intangibles/assets, tangible
            equity), and composition (AR/CA, inventory/CA, AP/CL).
          </li>
          <li>
            <strong>Generates the SWOT</strong> — applies deterministic rules to the ratios and
            year-over-year deltas to produce Strengths, Weaknesses, Opportunities, and Threats.
          </li>
          <li>
            <strong>Emits forward-looking signals</strong> — for AR, AP, debt, and working capital,
            states what change in the next filing would confirm improvement vs. signal
            deterioration.
          </li>
          <li>
            <strong>Flags outliers</strong> — any line item that moved &gt; 30% year-over-year gets
            called out in the Highlights panel, since that&apos;s usually where interesting stories
            live.
          </li>
        </ol>
        <Callout kind="insight" title="why no AI in the loop">
          All reasoning here is rule-based and reproducible. Every conclusion can be traced to a
          specific ratio threshold. You can read <code>src/lib/balance-sheet/summary.ts</code> and
          see the exact logic. That matters because when an analysis says &quot;elevated leverage&quot;
          you want to know <em>why</em> it says that, not just trust a black box.
        </Callout>
      </SubSection>
    </Section>
  );
}
