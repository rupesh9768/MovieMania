import React, { useMemo, useState } from 'react';

const BrowseSidebarFilters = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  groups,
  onClear,
  hasActiveFilters,
  activeFilterCount = 0,
  sortOptions,
  selectedSort,
  onSortChange,
  yearOptions,
  selectedYear,
  onYearChange,
  ratingOptions,
  selectedRating,
  onRatingChange,
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
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${activeFilterCount > 0 ? 'bg-red-500/20 text-red-400' : 'text-slate-500'}`}>
            {activeFilterCount > 0 ? `${activeFilterCount} active` : 'None'}
          </span>
        </button>
      </div>

      <div className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="lg:sticky lg:top-20 rounded-2xl border border-slate-800/80 bg-[#0f1117]/80 backdrop-blur-md p-5 space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 pl-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {sortOptions && sortOptions.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sort By
              </label>
              <select
                value={selectedSort || ''}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all appearance-none cursor-pointer"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {normalizedGroups.map((group) => {
            const query = (groupSearch[group.id] || '').trim().toLowerCase();
            const filteredOptions = query
              ? (group.options || []).filter((option) => option.name.toLowerCase().includes(query))
              : group.options || [];

            return (
              <div key={group.id}>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  {group.icon || null}
                  {group.label}
                  {group.selectedValue != null && group.selectedValue !== group.allValue && (
                    <span className="text-red-400 text-[10px] ml-auto">1 active</span>
                  )}
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
                    className="mb-2.5 w-full bg-slate-800/50 border border-slate-700/60 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
                  />
                )}

                <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {group.showAllOption && (
                    <button
                      onClick={() => group.onChange(group.allValue)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 ${
                        group.selectedValue === group.allValue
                          ? 'bg-red-500 text-white border-red-400 font-semibold shadow-lg shadow-red-500/20'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white'
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
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 ${
                          isActive
                            ? 'bg-red-500 text-white border-red-400 font-semibold shadow-lg shadow-red-500/20'
                            : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white'
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

          {yearOptions && yearOptions.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Year
                {selectedYear && <span className="text-red-400 text-[10px] ml-auto">1 active</span>}
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onYearChange(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 ${
                    !selectedYear
                      ? 'bg-red-500 text-white border-red-400 font-semibold shadow-lg shadow-red-500/20'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  Any
                </button>
                {yearOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onYearChange(selectedYear === opt.value ? null : opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 ${
                      selectedYear === opt.value
                        ? 'bg-red-500 text-white border-red-400 font-semibold shadow-lg shadow-red-500/20'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ratingOptions && ratingOptions.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Rating
                {selectedRating && <span className="text-red-400 text-[10px] ml-auto">1 active</span>}
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onRatingChange(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 ${
                    !selectedRating
                      ? 'bg-red-500 text-white border-red-400 font-semibold shadow-lg shadow-red-500/20'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  Any
                </button>
                {ratingOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onRatingChange(selectedRating === opt.value ? null : opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 flex items-center gap-1 ${
                      selectedRating === opt.value
                        ? 'bg-red-500 text-white border-red-400 font-semibold shadow-lg shadow-red-500/20'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseSidebarFilters;