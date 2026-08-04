/* Offhours — the mark is a power symbol and a clock drawn as one figure.

   The ring breaks at twelve and a stroke rises from the centre through that
   break: read on its own, that is the standard power glyph — switch it off. The
   same stroke is the minute hand, and a second, shorter hand points at four,
   which is the number the whole deck is built on: four hours and eleven minutes
   to send one invoice. So the mark says the two things the agency says — hours,
   and turning them off — without a cog, a robot or a lightning bolt in sight.

   Geometry is a 24-unit box on a 9-unit radius, stroked rather than filled, so
   it sits in the same hairline vocabulary as the section rules and reads at
   11px in a slide corner as well as it does in the footer. Everything is
   currentColor except the hour hand, which takes the accent — in the header
   that resolves to the acid fallback, since --accent is only set per section. */
export function LogoMark({
  size = 24,
  className = "",
}: {
  size?: number | string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={`logo-mark ${className}`}
    >
      {/* dial, open at twelve */}
      <path
        d="M17.54 4.91A9 9 0 1 1 6.46 4.91"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* the stem of the power glyph, doubling as the hand at twelve */}
      <path d="M12 12V2.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* four o'clock */}
      <path
        className="logo-hand"
        d="M12 12l4.5 2.6"
        stroke="var(--accent, #d8ff3e)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  size = 22,
  className = "",
  wordmarkClassName = "display text-lg",
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`logo ${className}`}>
      <LogoMark size={size} />
      <span className={`logo-word ${wordmarkClassName}`}>Offhours</span>
    </span>
  );
}
