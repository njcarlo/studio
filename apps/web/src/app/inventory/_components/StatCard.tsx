interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  prefix?: string;
}

export function StatCard({ title, value, subtitle, prefix }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{title}</div>
      <div className="stat-card-value">
        {prefix && <span className="stat-card-prefix">{prefix}</span>}
        {value === null || value === undefined ? '—' : value}
      </div>
      {subtitle && (
        <div className="stat-card-subtitle">{subtitle}</div>
      )}
    </div>
  );
}
