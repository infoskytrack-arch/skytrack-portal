import { useEffect, useId, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { formatStationLabel, searchStations } from '../data/stations';
import type { Station } from '../types';

interface StationAutocompleteProps {
  label: string;
  placeholder: string;
  selectedStation: Station | null;
  onSelect: (station: Station | null) => void;
  excludeCode?: string;
}

export function StationAutocomplete({
  label,
  placeholder,
  selectedStation,
  onSelect,
  excludeCode,
}: StationAutocompleteProps) {
  const inputId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState(
    selectedStation ? formatStationLabel(selectedStation) : ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setInputValue(selectedStation ? formatStationLabel(selectedStation) : '');
  }, [selectedStation]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (selectedStation) {
          setInputValue(formatStationLabel(selectedStation));
        }
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedStation]);

  const queryForSearch =
    selectedStation && inputValue === formatStationLabel(selectedStation) ? '' : inputValue;

  const suggestions = searchStations(queryForSearch, 14).filter(
    (s) => s.code !== excludeCode
  );

  function handleSelectStation(station: Station) {
    onSelect(station);
    setInputValue(formatStationLabel(station));
    setIsOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(suggestions.length - 1, 0)));
    } else if (e.key === 'Enter' && isOpen && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelectStation(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold text-[#213D77] mb-1.5"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 text-[#213D77] absolute left-3 pointer-events-none" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            setIsOpen(true);
            setActiveIndex(0);
            if (!val.trim()) {
              onSelect(null);
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-11 pl-9 pr-9 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77] focus:ring-2 focus:ring-[#213D77]/15 transition-colors"
        />
        {inputValue && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              setInputValue('');
              onSelect(null);
              setIsOpen(true);
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-72 overflow-y-auto"
        >
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>
              {queryForSearch ? `Matching Stations (${suggestions.length})` : 'Major Indian Railway Stations'}
            </span>
            <span>Type city, name, or code</span>
          </div>

          {suggestions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-500 text-center">
              No station matched &ldquo;{inputValue}&rdquo;. Try a major junction or city name.
            </div>
          ) : (
            suggestions.map((station, idx) => {
              const isHighlighted = idx === activeIndex;
              return (
                <button
                  key={station.code}
                  type="button"
                  role="option"
                  aria-selected={selectedStation?.code === station.code}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectStation(station);
                  }}
                  className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-3 border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer ${
                    isHighlighted ? 'bg-[#213D77]/8' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {station.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {station.city} · {station.state}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#213D77] bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    {station.code}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
