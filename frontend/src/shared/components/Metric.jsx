export function Metric({ icon: Icon, label, value, tone }) {
  return (
    <section className={`metric-card ${tone}`}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
