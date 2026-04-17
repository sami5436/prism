import { Section, SubSection, Formula, Callout, Term } from './DocsShell';

export default function IndicatorsDocs() {
  return (
    <Section
      id="indicators"
      title="Indicators"
      lead="Technical indicators are mathematical transforms of price and volume data. They don't predict the future — they compress noisy price action into a handful of numbers that make patterns visible. The skill is knowing what each one actually measures, when it's useful, and when it lies."
    >
      <SubSection id="moving-averages" title="Moving Averages (SMA & EMA)">
        <p>
          A moving average is the average price over the last N bars, redrawn every bar. It&apos;s the
          simplest way to turn noisy tick-by-tick prices into a smooth curve you can read.
        </p>
        <Formula>
          SMA(N) = (P₁ + P₂ + … + Pₙ) / N<br />
          EMA(N) = α·Pₜ + (1 − α)·EMAₜ₋₁, where α = 2 / (N + 1)
        </Formula>
        <p>
          <strong>Simple MA</strong> treats every one of the last N days equally. <strong>Exponential MA</strong>
          weights recent days more (α·Pₜ) and fades older ones geometrically (the (1−α) multiplier compounds
          into the tail). That&apos;s why EMA turns faster when the trend changes — it&apos;s listening harder
          to today than yesterday.
        </p>
        <Callout kind="insight" title="why EMA and not SMA">
          On a 20-day SMA, a gap up from 21 days ago still counts the same as today&apos;s close. On a 20-day
          EMA, that ancient gap has decayed to roughly 10% of its original weight. If you care about
          reacting to regime changes, EMA; if you want the cleanest line for visualizing long-term trend, SMA.
        </Callout>
        <p>
          <strong>Crossovers</strong> — when price crosses the MA, or a short MA crosses a long MA (the classic
          50/200 &quot;golden cross&quot;), that&apos;s the signal most people watch. MAs are lagging by
          construction, so crossovers confirm trends after they&apos;ve started. This is a feature for trend
          followers and a bug for anyone trying to pick tops and bottoms.
        </p>
      </SubSection>

      <SubSection id="rsi" title="RSI — Relative Strength Index">
        <p>
          RSI is a momentum oscillator bounded 0–100. It answers the question: &quot;of the last 14 days of
          price moves, what fraction was gains versus losses?&quot;
        </p>
        <Formula>
          RS = avg gain over N / avg loss over N<br />
          RSI = 100 − 100 / (1 + RS)
        </Formula>
        <p>
          If every single day was a gain (loss = 0), RS → ∞ and RSI → 100. If every day was a loss, RSI → 0.
          In reality markets chop — most of the time RSI sits between 30 and 70.
        </p>
        <Callout kind="insight" title="why 70 / 30 aren't magic numbers">
          The convention is: RSI &gt; 70 = overbought, RSI &lt; 30 = oversold. But these are just heuristic
          thresholds. In a strong uptrend, RSI can stay pinned above 70 for weeks — selling every time it
          hits 70 during a bull market bleeds money. RSI is most useful in <em>ranging</em> markets (sideways
          price action), where mean reversion actually happens.
        </Callout>
        <Callout kind="warning" title="divergence is the real signal">
          The most valuable RSI read is a <strong>divergence</strong>: price makes a new high, but RSI makes
          a <em>lower</em> high. That says the rally is losing momentum even though the chart still looks
          bullish. The reverse at lows is often a bottoming signal. Divergence beats raw overbought/oversold
          reads.
        </Callout>
      </SubSection>

      <SubSection id="macd" title="MACD — Moving Average Convergence Divergence">
        <p>
          MACD is two things at once: it measures trend direction (like a moving average) and momentum
          (like RSI). It does this by subtracting a slower EMA from a faster one.
        </p>
        <Formula>
          MACD line = EMA₁₂ − EMA₂₆<br />
          Signal line = EMA₉ of MACD line<br />
          Histogram = MACD − Signal
        </Formula>
        <p>
          When the fast EMA is above the slow EMA, momentum is up and MACD is positive. When the gap is
          <em>widening</em>, momentum is accelerating — that&apos;s what the histogram bars show.
        </p>
        <Callout kind="insight" title="the three signals in one indicator">
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>Zero-line cross:</strong> MACD crosses 0 → the 12 EMA crossed the 26 EMA (trend flip)</li>
            <li><strong>Signal-line cross:</strong> MACD crosses its own 9-EMA signal → momentum flip</li>
            <li><strong>Histogram:</strong> distance between MACD and signal → momentum strength</li>
          </ul>
          A signal-line cross that also happens above zero with a rising histogram is a textbook bullish
          setup. All three lining up is rare enough to be worth paying attention to.
        </Callout>
      </SubSection>

      <SubSection id="bollinger" title="Bollinger Bands">
        <p>
          Bollinger Bands wrap a moving average with two lines set at ±2 standard deviations of price. The
          bands auto-widen when volatility rises and tighten when it falls.
        </p>
        <Formula>
          Middle = SMA(20)<br />
          Upper = Middle + 2σ<br />
          Lower = Middle − 2σ
        </Formula>
        <p>
          Under a normal distribution, ~95% of observations fall within ±2σ of the mean. Returns aren&apos;t
          truly normal (they have fat tails) but the approximation holds well enough that price
          <em> usually</em> stays inside the bands. A break outside is a statistical anomaly worth attention.
        </p>
        <Callout kind="insight" title="the squeeze">
          A <strong>squeeze</strong> is when bands contract sharply — volatility has dried up. Markets don&apos;t
          stay quiet forever. A squeeze often precedes a large directional move, though the squeeze
          itself doesn&apos;t tell you <em>which</em> direction. Pair it with MACD or a breakout level to
          pick the side.
        </Callout>
        <Callout kind="warning" title="walking the band">
          In a strong trend, price can &quot;walk&quot; the upper band for weeks — touching, pulling back to
          the middle line, then pushing the upper band again. Don&apos;t fade that. Bollinger touches are
          mean-reversion signals only in <em>range-bound</em> markets.
        </Callout>
      </SubSection>

      <SubSection id="indicator-combo" title="How to actually use them together">
        <p>
          No single indicator tells the whole story. The useful combos layer a <strong>trend filter</strong>
          over a <strong>momentum oscillator</strong>, so you only take setups that agree with the bigger
          picture.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Trend context</strong> via <Term>EMA50</Term> vs <Term>EMA200</Term> — only take
            long setups if the fast is above the slow.
          </li>
          <li>
            <strong>Entry trigger</strong> via RSI oversold dip + MACD signal cross — both needed.
          </li>
          <li>
            <strong>Risk marker</strong> via Bollinger lower band — if price is below it,
            you&apos;re buying a statistical outlier; either a great entry or a falling knife.
          </li>
        </ul>
        <Callout kind="warning" title="indicators lag, price leads">
          All of these are derived from past prices. They will never see a news-driven gap before it
          happens. Treat indicators as a <em>framework for interpretation</em>, not a crystal ball.
        </Callout>
      </SubSection>
    </Section>
  );
}
