export default function Card({ title, right, children, className = "" }) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-md border border-ink/10 bg-white p-4 ${className}`}
    >
      {(title || right) && (
        <div className="flex items-center justify-between gap-2">
          {title && (
            <h2 className="font-display text-xl font-semibold leading-none text-ink">{title}</h2>
          )}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
