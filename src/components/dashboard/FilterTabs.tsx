'use client'

export type FilterType = 'all' | 'in_progress' | 'completed' | 'archived'
export type SortType = 'recent' | 'oldest' | 'alphabetical' | 'phase'

interface FilterCounts {
  all: number
  inProgress: number
  completed: number
  archived: number
}

interface FilterTabsProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  sortBy: SortType
  onSortChange: (sort: SortType) => void
  counts: FilterCounts
}

export function FilterTabs({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  counts,
}: FilterTabsProps) {
  const tabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: counts.all },
    { key: 'in_progress', label: 'Em progresso', count: counts.inProgress },
    { key: 'completed', label: 'Concluidos', count: counts.completed },
    { key: 'archived', label: 'Arquivados', count: counts.archived },
  ]

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`rounded-md px-4 py-2 text-sm transition-all ${
              activeFilter === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="ml-1 opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Sort Select */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortType)}
        className="cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm text-gray-900"
      >
        <option value="recent">Mais recentes</option>
        <option value="oldest">Mais antigos</option>
        <option value="alphabetical">Alfabetico</option>
        <option value="phase">Por fase</option>
      </select>
    </div>
  )
}
