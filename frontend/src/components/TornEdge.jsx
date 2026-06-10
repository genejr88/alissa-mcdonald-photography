// A deckled paper edge — sits between a paper section and a paper-2 section so
// the transition reads like a torn scrapbook page instead of a hard border.
// `flip` points the tear downward (for the bottom of a paper-2 section).

export default function TornEdge({ flip = false, color = 'var(--paper-2)' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 22"
      preserveAspectRatio="none"
      className="block h-[14px] w-full md:h-[18px]"
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path
        fill={color}
        d="M0,22 L0,14 C30,11 55,16 85,13 C115,10 140,15 170,12 C200,9 230,16 260,13
           C290,10 315,14 345,11 C375,8 405,15 435,13 C465,11 490,9 520,12
           C550,15 580,10 610,13 C640,16 665,11 695,13 C725,15 755,9 785,12
           C815,15 840,11 870,13 C900,15 930,10 960,12 C990,14 1015,9 1045,12
           C1075,15 1105,11 1135,13 C1165,15 1190,10 1220,12 C1250,14 1280,16 1310,13
           C1340,10 1365,15 1395,12 C1415,10 1430,13 1440,12 L1440,22 Z"
      />
      {/* faint shadow line just above the tear */}
      <path
        fill="none"
        stroke="rgba(46,44,39,0.07)"
        strokeWidth="1.5"
        d="M0,14 C30,11 55,16 85,13 C115,10 140,15 170,12 C200,9 230,16 260,13
           C290,10 315,14 345,11 C375,8 405,15 435,13 C465,11 490,9 520,12
           C550,15 580,10 610,13 C640,16 665,11 695,13 C725,15 755,9 785,12
           C815,15 840,11 870,13 C900,15 930,10 960,12 C990,14 1015,9 1045,12
           C1075,15 1105,11 1135,13 C1165,15 1190,10 1220,12 C1250,14 1280,16 1310,13
           C1340,10 1365,15 1395,12 C1415,10 1430,13 1440,12"
      />
    </svg>
  );
}
