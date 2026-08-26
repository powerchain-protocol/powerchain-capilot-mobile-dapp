export function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong>{note ? <small>{note}</small> : null}</div>;
}
