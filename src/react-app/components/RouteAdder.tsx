import { useState, useEffect } from 'react';
import { Plus, MapPin, Ruler, Bus, Loader2, CheckCircle } from 'lucide-react';
import type { City } from '@/shared/types';

export default function RouteAdder() {
  const [cities, setCities] = useState<City[]>([]);
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [distance, setDistance] = useState('');
  const [mode, setMode] = useState<'CAR' | 'BUS' | 'METRO' | 'WALK'>('CAR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => setCities(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromCity || !toCity || !distance) {
      setError('Please fill in all fields');
      return;
    }

    if (fromCity === toCity) {
      setError('Origin and destination must be different');
      return;
    }

    const distanceNum = parseInt(distance);
    if (isNaN(distanceNum) || distanceNum <= 0) {
      setError('Distance must be a positive number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_city: fromCity,
          to_city: toCity,
          distance: distanceNum,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add route');
      }

      setSuccess(true);
      setFromCity('');
      setToCity('');
      setDistance('');
      setMode('CAR');
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const modes: Array<{ value: 'CAR' | 'BUS' | 'METRO' | 'WALK'; label: string; icon: string }> = [
    { value: 'CAR', label: 'Car', icon: '🚗' },
    { value: 'BUS', label: 'Bus', icon: '🚌' },
    { value: 'METRO', label: 'Metro', icon: '🚇' },
    { value: 'WALK', label: 'Walk', icon: '🚶' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-lg border border-amber-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Route</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                From
              </label>
              <select
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none"
                required
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
                required
              >
                <option value="">Select destination city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Ruler className="w-4 h-4 inline mr-1" />
              Distance (km)
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="Enter distance in kilometers"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Bus className="w-4 h-4 inline mr-1" />
              Transport Mode
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`p-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                    mode === m.value
                      ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 shadow-lg'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-sm">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Route added successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding Route...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Route
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
