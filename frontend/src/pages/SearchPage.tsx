import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMechanics } from '@/hooks/useMechanics'
import { attachDistances } from '@/lib/geo'
import MechanicCard from '@/components/mechanic/MechanicCard'
import AdSlot from '@/components/ads/AdSlot'
import { SearchResultsWithAds } from '@/components/ads/AdSlot'
import { SERVICES, NIGERIAN_CITIES } from '@/lib/constants'
import type { SearchFilters } from '@/types'

// Redux imports
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectQuery,
  selectFilters,
  selectUserLocation,
  setQuery,
  setFilters,
  resetFilters,
} from '@/store/searchSlice'

export default function SearchPage() {
  const dispatch = useAppDispatch()

  const query        = useAppSelector(selectQuery)
  const filters      = useAppSelector(selectFilters)
  const userLocation = useAppSelector(selectUserLocation)

  const [showFilters, setShowFilters] = useState(false)
  const [localQuery, setLocalQuery]   = useState(query)
  const { data: allMechanics = [], isLoading } = useMechanics(filters)

  // ── Derive results locally — never dispatch results back into Redux ──
  let results = [...allMechanics]
  if (localQuery) {
    results = results.filter(m =>
      m.city.toLowerCase().includes(localQuery.toLowerCase()) ||
      (m.area ?? '').toLowerCase().includes(localQuery.toLowerCase())
    )
  }
  if (userLocation) {
    results = attachDistances(results, userLocation)
  }

  // Derive hasSearched from loading state and query
  const hasSearched = !isLoading && (localQuery.trim() !== '' || Object.values(filters).some(v => v && v !== '' && v !== 0))

  const cityContext = localQuery || (userLocation ? 'GPS' : undefined)

  const toggleFilter = <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) => {
    dispatch(setFilters({ [key]: filters[key] === val ? (typeof val === 'boolean' ? false : '') : val }))
  }

  const activeFilterCount = Object.entries(filters).filter(([, v]) => v && v !== '' && v !== 0).length
  const mechanicCards = results.map(m => <MechanicCard key={m.id} mechanic={m} />)

  return (
    <>
      <Helmet>
        <title>Search Mechanics – MechanicNG</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Search bar */}
        <div className="flex gap-3 mb-5">
          <input
            className="input flex-1"
            value={localQuery}
            onChange={e => {
              setLocalQuery(e.target.value)
              dispatch(setQuery(e.target.value))
            }}
            placeholder="Search city or area..."
            list="cities"
          />
          <datalist id="cities">
            {NIGERIAN_CITIES.map(c => <option key={c} value={c} />)}
          </datalist>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-brand-500 text-brand-500 bg-brand-500/10'
                : 'border-gray-700 text-gray-400'
            }`}
          >
            ⚙️ Filters
            {activeFilterCount > 0 && (
              <span className="bg-brand-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search top ad slot */}
        <AdSlot placement="search_top" cityContext={cityContext} className="mb-5" />

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="section-title block mb-2">Service</label>
              <select
                className="input"
                value={filters.service}
                onChange={e => dispatch(setFilters({ service: e.target.value }))}
              >
                <option value="">All Services</option>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="section-title block mb-2">Mechanic Type</label>
              <div className="flex gap-2">
                {(['mobile', 'shop'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => toggleFilter('type', t)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      filters.type === t
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {t === 'mobile' ? '📱 Mobile' : '🏪 Shop'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="section-title block mb-2">Price Range</label>
              <div className="flex gap-1.5">
                {(['low', 'mid', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => toggleFilter('priceRange', p)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      filters.priceRange === p
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-gray-700 text-gray-400'
                    }`}
                  >
                    {p === 'low' ? '₦' : p === 'mid' ? '₦₦' : '₦₦₦'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="section-title block mb-2">Min Rating</label>
              <div className="flex gap-1.5">
                {[3, 4, 4.5].map(r => (
                  <button
                    key={r}
                    onClick={() => toggleFilter('minRating', r)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      filters.minRating === r
                        ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                        : 'border-gray-700 text-gray-400'
                    }`}
                  >
                    {r}+ ★
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!filters.openNow}
                  onChange={e => dispatch(setFilters({ openNow: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm font-semibold text-gray-300">🟢 Open Now Only</span>
              </label>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => dispatch(resetFilters())}
                className="text-xs text-gray-500 underline hover:text-gray-300"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">
            {isLoading ? 'Searching...' : `${results.length} Mechanic${results.length !== 1 ? 's' : ''} Found`}
            {localQuery && <span className="text-gray-500 font-normal text-base ml-2">in {localQuery}</span>}
          </h1>
          {userLocation && <span className="text-xs text-brand-500 font-semibold">📍 Sorted by distance</span>}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-5 h-48 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-800 rounded" />
                  <div className="h-3 bg-gray-800 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">{hasSearched ? '🔍' : '👋'}</div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">
              {hasSearched ? 'No mechanics found' : 'Start your search'}
            </h3>
            <p className="text-gray-500">
              {hasSearched
                ? 'Try a different city or remove some filters.'
                : 'Enter a city or area above to find mechanics near you.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SearchResultsWithAds cityContext={cityContext} injectEvery={5}>
              {mechanicCards}
            </SearchResultsWithAds>
          </div>
        )}
      </div>
    </>
  )
}