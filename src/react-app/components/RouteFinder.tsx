import { useState, useEffect } from 'react';
import { Search, Clock, MapPin, ArrowRight, Loader2, Navigation, Flag, Circle } from 'lucide-react';
import type { City, PathResult } from '@/shared/types';

export default function RouteFinder() {
  const [cities, setCities] = useState<City[]>([]);
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [result, setResult] = useState<PathResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => setCities(data));
  }, []);

  const handleSearch = async () => {
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
    setResult(null);

    try {
      const response = await fetch('/api/find-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromCity, to: toCity }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to find route');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    const icons: Record<string, string> = {
      CAR: '🚗',
      BUS: '🚌',
      METRO: '🚇',
      WALK: '🚶'
    };
    return icons[mode] || '🚗';
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-lg border border-amber-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Your Route</h2>
        
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
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Find Best Route
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-lg border border-amber-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Journey</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                <div className="text-sm text-gray-600 mb-1">Total Distance</div>
                <div className="text-3xl font-bold text-amber-600">{result.totalDistance} km</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-6 border border-orange-200">
                <div className="text-sm text-gray-600 mb-1">Estimated Time</div>
                <div className="text-3xl font-bold text-orange-600">
                  {Math.round(result.totalTime)} min
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Path */}
          <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-lg border border-amber-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h4 className="font-semibold text-gray-900 text-lg mb-6 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-amber-600" />
              Navigation Path
            </h4>
            
            <div className="relative">
              {/* Vertical line connector */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-amber-500 via-orange-400 to-rose-500" />
              
              <div className="space-y-4">
                {result.path.map((city, index) => {
                  const isStart = index === 0;
                  const isEnd = index === result.path.length - 1;
                  const isWaypoint = !isStart && !isEnd;
                  
                  return (
                    <div key={city.id} className="relative flex items-center gap-4">
                      {/* Icon */}
                      <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                        isStart ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                        isEnd ? 'bg-gradient-to-br from-rose-500 to-red-600' :
                        'bg-gradient-to-br from-amber-400 to-orange-500'
                      }`}>
                        {isStart && <Flag className="w-6 h-6 text-white" />}
                        {isEnd && <MapPin className="w-6 h-6 text-white" />}
                        {isWaypoint && <Circle className="w-5 h-5 text-white fill-white" />}
                      </div>
                      
                      {/* City info */}
                      <div className={`flex-1 p-4 rounded-2xl border-2 ${
                        isStart ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' :
                        isEnd ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-300' :
                        'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
                      }`}>
                        <div className="font-bold text-gray-900 text-lg mb-1">
                          {isStart && <span className="text-green-600 text-sm mr-2">START</span>}
                          {isEnd && <span className="text-rose-600 text-sm mr-2">DESTINATION</span>}
                          {isWaypoint && <span className="text-amber-600 text-sm mr-2">VIA</span>}
                          {city.name}
                        </div>
                        {!isEnd && result.routes[index] && (
                          <div className="text-sm text-gray-600 mt-2 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <span className="text-lg">{getModeIcon(result.routes[index].mode)}</span>
                              {result.routes[index].mode}
                            </span>
                            <span className="flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              {result.routes[index].to_city}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {result.routes[index].distance} km
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.round(result.routes[index].time_minutes)} min
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step by Step Directions */}
          <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-lg border border-amber-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h4 className="font-semibold text-gray-900 text-lg mb-6">Step-by-Step Directions</h4>
            
            <div className="space-y-3">
              {result.routes.map((route, index) => (
                <div key={index} className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-amber-50 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-2xl">{getModeIcon(route.mode)}</span>
                      Take {route.mode.toLowerCase()} from {route.from_city} to {route.to_city}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        {route.distance} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-amber-600" />
                        {Math.round(route.time_minutes)} minutes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Final arrival step */}
              <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-md">
                  <Flag className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-green-700 text-lg">
                    Arrive at {result.path[result.path.length - 1].name}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Journey complete! Total: {result.totalDistance} km in {Math.round(result.totalTime)} minutes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
