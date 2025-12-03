import { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Leaf, ArrowRight, Loader2 } from 'lucide-react';
import type { City, PathResult } from '@/shared/types';

export default function RouteComparison() {
  const [cities, setCities] = useState<City[]>([]);
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [results, setResults] = useState<PathResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => setCities(data));
  }, []);

  const handleCompare = async () => {
    if (!fromCity || !toCity) {
      setError('Please select both cities');
      return;
    }

    if (fromCity === toCity) {
      setError('Origin and destination must be different');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/compare-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromCity, to: toCity }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to compare routes');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (index: number) => {
    const badges = [
      { text: 'Fastest', color: 'from-green-500 to-emerald-600' },
      { text: 'Economical', color: 'from-blue-500 to-cyan-600' },
      { text: 'Eco-Friendly', color: 'from-emerald-500 to-teal-600' },
    ];
    return badges[index] || { text: 'Alternative', color: 'from-gray-500 to-slate-600' };
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-lg border border-amber-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Compare Routes</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              From
            </label>
            <select
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none"
            >
              <option value="">Select origin city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              To
            </label>
            <select
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none"
            >
              <option value="">Select destination city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <ArrowRight className="w-5 h-5" />
              Compare All Routes
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Available Route Options</h3>
          
          {results.map((result, index) => {
            const badge = getBadge(index);
            
            return (
              <div key={index} className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`px-4 py-2 bg-gradient-to-r ${badge.color} text-white rounded-full text-sm font-bold shadow-lg`}>
                    {badge.text}
                  </div>
                  <div className="text-gray-500 text-sm">
                    Option {index + 1} of {results.length}
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-medium">Distance</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{result.totalDistance} km</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-4 border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">Time</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{Math.round(result.totalTime)} min</div>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 border border-rose-200">
                    <div className="flex items-center gap-2 text-rose-700 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium">Cost</span>
                    </div>
                    <div className="text-2xl font-bold text-rose-600">AED {result.estimatedCost?.toFixed(2)}</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Leaf className="w-4 h-4" />
                      <span className="text-xs font-medium">CO₂</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{result.co2Emissions?.toFixed(1)} kg</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Route Path:</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {result.path.map((city, idx) => (
                      <div key={city.id} className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium">
                          {city.name}
                        </div>
                        {idx < result.path.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
