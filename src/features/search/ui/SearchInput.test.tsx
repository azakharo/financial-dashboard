import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';

import {SearchInput} from './SearchInput';
import {useUIStore} from '@/shared/store';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUIStore.setState({searchQuery: ''});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('отображает input с placeholder', () => {
    render(<SearchInput />);

    expect(
      screen.getByPlaceholderText(/поиск по тикеру или названию/i),
    ).toBeInTheDocument();
  });

  it('обновляет input мгновенно', () => {
    render(<SearchInput />);

    const input = screen.getByPlaceholderText(/поиск по тикеру или названию/i);
    fireEvent.change(input, {target: {value: 'AAP'}});

    expect(input).toHaveValue('AAP');
  });

  it('записывает debounced value в store после задержки', () => {
    render(<SearchInput />);

    const input = screen.getByPlaceholderText(/поиск по тикеру или названию/i);
    fireEvent.change(input, {target: {value: 'AAP'}});

    expect(useUIStore.getState().searchQuery).toBe('');

    vi.advanceTimersByTime(500);

    expect(useUIStore.getState().searchQuery).toBe('AAP');
  });

  it('отменяет предыдущий debounce при быстром вводе', () => {
    render(<SearchInput />);

    const input = screen.getByPlaceholderText(/поиск по тикеру или названию/i);

    fireEvent.change(input, {target: {value: 'A'}});
    vi.advanceTimersByTime(200);
    fireEvent.change(input, {target: {value: 'AA'}});
    vi.advanceTimersByTime(200);
    fireEvent.change(input, {target: {value: 'AAP'}});

    expect(useUIStore.getState().searchQuery).toBe('');

    vi.advanceTimersByTime(500);

    expect(useUIStore.getState().searchQuery).toBe('AAP');
  });

  it('синхронизирует input с store при монтировании', () => {
    useUIStore.setState({searchQuery: 'MSFT'});
    render(<SearchInput />);

    const input = screen.getByPlaceholderText(/поиск по тикеру или названию/i);
    expect(input).toHaveValue('MSFT');
  });
});
