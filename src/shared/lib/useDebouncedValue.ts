import {useEffect, useRef, useState} from 'react';
import debounce from 'lodash/debounce';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  const debouncedSetRef = useRef(
    debounce((newValue: T) => {
      setDebouncedValue(newValue);
    }, delay),
  );

  useEffect(() => {
    debouncedSetRef.current(value);
  }, [value]);

  useEffect(() => {
    const debounced = debouncedSetRef.current;
    return () => {
      debounced.cancel();
    };
  }, []);

  return debouncedValue;
}
