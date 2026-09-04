export function SectionHeader({
  title,
  subtitle,
  icon,
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-mandi-50 text-mandi-600">
            {icon}
          </span>
        )}
        <div>
          <h1 className="section-title">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-field-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-10 text-center">
      {icon && <span className="text-mandi-400">{icon}</span>}
      <h3 className="text-lg font-bold text-mandi-800">{title}</h3>
      {description && <p className="max-w-md text-sm text-field-500">{description}</p>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = false,
}) {
  return (
    <div className={`card card-hover p-5 ${accent ? 'bg-mandi-600 text-white' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${accent ? 'text-mandi-50' : 'text-field-500'}`}>
          {label}
        </span>
        {icon && (
          <span className={accent ? 'text-mandi-100' : 'text-mandi-400'}>{icon}</span>
        )}
      </div>
      <p className={`mt-2 ${accent ? 'text-3xl font-bold text-white' : 'stat-value'}`}>{value}</p>
    </div>
  );
}
