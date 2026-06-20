import {useState, useEffect} from 'react';
import debounce from 'lodash/debounce';
import {Search} from 'lucide-react';

import {Input} from '@/shared/ui/input';
import {useUIStore} from '@/shared/store';

const DEBOUNCE_MS = 500;

export const SearchInput: React.FC = () => {
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    const debouncedSet = debounce((value: string) => {
      setSearchQuery(value);
    }, DEBOUNCE_MS);

    debouncedSet(inputValue);

    return () => {
      debouncedSet.cancel();
    };
  }, [inputValue, setSearchQuery]);

  return (
    <div className="relative">
      <Search
        className="
          absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground
        "
      />
      <Input
        placeholder="Поиск по тикеру или названию..."
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
};
