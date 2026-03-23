import React, { useMemo, useState } from 'react';

const BrowseSidebarFilters = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  groups,
  onClear,
  hasActiveFilters,
  activeFilterCount = 0,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState({});

  const normalizedGroups = useMemo(() => groups || [], [groups]);

  return (
    <div className="w-full lg:w-64 shrink-0">
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="w-full rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 flex items-center justify-between"
        >
          <span>Filters</span>
          <span className="text-xs text-cyan-300">
            {activeFilterCount > 0 ? `${activeFilterCount} active` : 'None'}
          </span>
        </button>
      </div>

      <div className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="lg:sticky lg:top-20 rounded-2xl border border-slate-800/90 bg-slate-900/65 backdrop-blur-sm p-4 space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700/70 rounded-xl px-3 py-2.5 pl-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {normalizedGroups.map((group) => {
            const query = (groupSearch[group.id] || '').trim().toLowerCase();
            const filteredOptions = query
              ? (group.options || []).filter((option) => option.name.toLowerCase().includes(query))
              : group.options || [];

            return (
              <div key={group.id}>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  {group.label}
                </label>

                {(group.options || []).length > 8 && (
                  <input
                    type="text"
                    placeholder={`Find ${group.label.toLowerCase()}...`}
                    value={groupSearch[group.id] || ''}
                    onChange={(e) =>
                      setGroupSearch((prev) => ({
                        ...prev,
                        [group.id]: e.target.value,
                      }))
                    }
                    className="mb-2.5 w-full bg-slate-800/60 border border-slate-700/70 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
                  />
                )}

                <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {group.showAllOption && (
                    <button
                      onClick={() => group.onChange(group.allValue)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        group.selectedValue === group.allValue
                          ? 'bg-cyan-500 text-black border-cyan-400 font-semibold'
                          : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {group.allLabel || 'All'}
                    </button>
                  )}

                  {filteredOptions.map((option) => {
                    const isActive = group.selectedValue === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          if (isActive && group.allowDeselect) {
                            group.onChange(group.allValue);
                            return;
                          }
                          group.onChange(option.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          isActive
                            ? 'bg-cyan-500 text-black border-cyan-400 font-semibold'
                            : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="w-full rounded-xl border border-cyan-500/35 bg-cyan-500/10 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseSidebarFilters;
