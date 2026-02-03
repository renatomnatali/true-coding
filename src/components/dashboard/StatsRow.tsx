interface Stats {
  total: number
  online: number
  inProgress: number
  avgTime: string
}

interface StatsRowProps {
  stats: Stats
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard
        value={stats.total.toString()}
        label="Projetos totais"
        variant="default"
      />
      <StatCard
        value={stats.online.toString()}
        label="Online"
        variant="success"
      />
      <StatCard
        value={stats.inProgress.toString()}
        label="Em progresso"
        variant="warning"
      />
      <StatCard
        value={stats.avgTime}
        label="Tempo medio"
        variant="default"
      />
    </div>
  )
}

interface StatCardProps {
  value: string
  label: string
  variant: 'default' | 'success' | 'warning'
}

function StatCard({ value, label, variant }: StatCardProps) {
  const valueClasses = {
    default: 'text-blue-600',
    success: 'text-green-500',
    warning: 'text-amber-500',
  }

  return (
    <div className="rounded-lg border bg-white p-4 text-center">
      <div className={`mb-1 text-3xl font-bold leading-none ${valueClasses[variant]}`}>
        {value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}
