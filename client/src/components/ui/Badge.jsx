const TONES = {
  neutral: "bg-ink/[0.06] text-ink/70",
  green: "bg-road/10 text-road",
  amber: "bg-marigold/25 text-[#7a5200]",
  red: "bg-brake/10 text-brake",
  blue: "bg-sky-100 text-sky-800",
};

export default function Badge({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${TONES[tone] || TONES.neutral}`}
    >
      {children}
    </span>
  );
}
