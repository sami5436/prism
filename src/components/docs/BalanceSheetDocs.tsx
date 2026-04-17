import { Section, SubSection, Formula, Callout } from './DocsShell';

export default function BalanceSheetDocs() {
  return (
    <Section
      id="balance-sheet"
      title="Balance Sheet"
      lead="A balance sheet is a snapshot of everything a company owns, everything it owes, and the residual that belongs to shareholders — all frozen at one moment in time. It answers a single question: if the lights went out today, what would be left over?"
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
          Every dollar of stuff a company owns was funded by exactly one source: either someone lent it to
          them (liabilities) or the owners put it in / kept it there (equity). It&apos;s not a pretty
          accounting rule — it&apos;s a tautology. If a balance sheet doesn&apos;t balance, someone typed
          a number wrong.
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
          The current/non-current split matters because it tells you about <em>liquidity</em>: can the
          company pay next quarter&apos;s bills with what&apos;s readily available, or does it have to sell
          a factory?
        </p>
      </SubSection>

      <SubSection id="current-ratio" title="Current Ratio — can they pay the bills?">
        <Formula>Current Ratio = Current Assets / Current Liabilities</Formula>
        <p>
          This measures short-term survivability. If current liabilities are $50M and current assets are
          $100M, the ratio is 2.0 — meaning for every $1 coming due in the next year, the company has $2
          of liquid stuff to cover it.
        </p>
        <Callout kind="insight" title="what &quot;good&quot; means by industry">
          A 1.5–3.0 ratio is healthy for most industrials. But software companies routinely run at 4–6
          because they don&apos;t carry inventory. Supermarkets often sit near 1.0 because their inventory
          turns over so fast — by the time the bill is due, they&apos;ve already sold the groceries. Compare
          companies to peers, not to a universal benchmark.
        </Callout>
        <Callout kind="warning" title="when current ratio lies">
          A high current ratio can just mean the company is hoarding cash or stuck with unsellable
          inventory. Dig into the <em>composition</em> — is most of the current asset base cash, or is it
          six years of unsold products? Current ratio treats inventory like liquid cash, which is
          sometimes generous.
        </Callout>
      </SubSection>

      <SubSection id="debt-equity" title="Debt-to-Equity — how leveraged are they?">
        <Formula>D/E = Total Liabilities / Total Equity</Formula>
        <p>
          Leverage measures how much of the company is financed by borrowing vs. owners&apos; money. A 2.0
          ratio means creditors have put in $2 for every $1 of equity — the company is twice as financed
          by debt as by shareholders.
        </p>
        <p>
          Why leverage matters: it amplifies returns in both directions. In good times, profits flow to a
          small equity base → big ROE. In bad times, interest payments are fixed but revenue isn&apos;t —
          a small drop in business can wipe equity entirely.
        </p>
        <Callout kind="insight" title="the &quot;industry baseline&quot; problem">
          Banks run at D/E of 10+ and that&apos;s healthy — their business <em>is</em> borrowing and
          lending. A tech company at D/E of 10 is a disaster waiting to happen. For utilities, D/E of 1–2
          is normal because cash flows are predictable. Always benchmark against the industry.
        </Callout>
        <Callout kind="warning" title="negative equity">
          If a company has lost more money than it ever raised, equity goes negative and D/E becomes
          meaningless (you&apos;re dividing by a negative). That&apos;s not a subtle red flag — that&apos;s
          the company&apos;s creditors technically owning everything on paper.
        </Callout>
      </SubSection>

      <SubSection id="working-capital" title="Working Capital — operational cushion">
        <Formula>Working Capital = Current Assets − Current Liabilities</Formula>
        <p>
          Same inputs as the current ratio, but expressed as a dollar amount instead of a multiple. It
          answers: how much liquid money would be <em>left over</em> after paying every short-term bill?
        </p>
        <p>
          Positive working capital = day-to-day operations self-fund. Negative = the company relies on
          rolling over credit lines or fresh financing to meet payroll. Neither is automatically bad, but
          negative working capital requires confidence that cash keeps coming in.
        </p>
        <Callout kind="insight" title="why some great companies run negative">
          Amazon, Walmart, and Dell historically had <em>negative</em> working capital and it was a
          strength: they collected from customers before paying suppliers. They were essentially being
          financed interest-free by their supply chain. Negative working capital is a problem only when
          the business model <em>needs</em> a cushion and doesn&apos;t have one.
        </Callout>
      </SubSection>

      <SubSection id="goodwill" title="Goodwill — what is this line item really?">
        <p>
          Goodwill shows up when one company buys another for more than the target&apos;s book value. The
          excess gets parked on the acquirer&apos;s balance sheet as an asset called &quot;goodwill&quot;.
        </p>
        <Callout kind="example" title="how goodwill is created">
          Company A buys Company B for $10B. Company B&apos;s net identifiable assets are worth $6B.
          Company A records $6B of real assets plus $4B of goodwill — the premium paid for brand, team,
          future synergies, and whatever else justified the price.
        </Callout>
        <p>
          Goodwill/Assets tells you how much of the balance sheet is made of that premium. A high share
          means a lot of the &quot;assets&quot; are really bets that past acquisitions will pay off.
        </p>
        <Callout kind="warning" title="impairment risk">
          If the acquired business underperforms, auditors force the acquirer to <em>write down</em>
          goodwill — which hits earnings and can trigger a stock crash. Think AOL Time Warner: $54B
          goodwill writedown in 2002. High goodwill + acquisitions going sideways = a landmine.
        </Callout>
      </SubSection>

      <SubSection id="intangibles" title="Intangibles — value you can't touch">
        <p>
          Intangible assets are non-physical: patents, trademarks, customer relationships, software, data
          rights. They <em>can</em> be extremely valuable (Coca-Cola&apos;s brand, Google&apos;s patents)
          but they&apos;re hard to sell in bankruptcy and their carrying value depends on accounting
          judgment.
        </p>
        <p>
          Intangibles / Total Assets quantifies how much of the asset base is conceptual versus tangible.
          Software companies run 30–60%+ intangibles and that&apos;s normal. An industrial manufacturer at
          50% intangibles has probably been on an acquisition binge — same impairment risk as goodwill.
        </p>
      </SubSection>

      <SubSection id="how-prism-ranks" title="How this module puts it together">
        <p>
          Upload a 10-K/10-Q PDF, an SEC XBRL URL, or just a ticker — the pipeline extracts standardized
          line items for up to 4 recent periods, then computes:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The five ratios above (current, D/E, working capital, goodwill/assets, intangibles/assets)</li>
          <li>YoY change flags for any line item that moved &gt; 30% — usually where interesting stories are</li>
          <li>A plain-English summary that calls out any ratio that breaches conservative thresholds</li>
        </ul>
        <Callout kind="insight" title="ratios are questions, not answers">
          When this module flags &quot;debt-to-equity is elevated&quot;, treat it as a starting point for
          investigation, not a sell signal. Elevated vs. what? Why? Did they just do a leveraged buyback?
          Was there a pandemic-era credit line drawdown? The numbers give you the question. Finding the
          answer still requires reading the MD&amp;A section of the filing.
        </Callout>
      </SubSection>
    </Section>
  );
}
