import {Search} from 'lucide-react';

import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {SECTORS, type Sector} from '@/shared/api';

interface TableFiltersProps {
  sectorFilter: Sector | null;
  searchQuery: string;
  onSectorChange: (sector: Sector | null) => void;
  onSearchChange: (query: string) => void;
}

export function TableFilters({
  sectorFilter,
  searchQuery,
  onSectorChange,
  onSearchChange,
}: TableFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="
            absolute top-1/2 left-3 size-4 -translate-y-1/2
            text-muted-foreground
          "
        />
        <Input
          placeholder="Поиск по тикеру или названию..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={sectorFilter === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onSectorChange(null)}
        >
          Все
        </Badge>
        {SECTORS.map(sector => (
          <Badge
            key={sector}
            variant={sectorFilter === sector ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onSectorChange(sector)}
          >
            {sector}
          </Badge>
        ))}
      </div>
    </div>
  );
}
