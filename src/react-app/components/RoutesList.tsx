import { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowRight, Loader2 } from 'lucide-react';
import type { RouteWithCities } from '@/shared/types';

export default function RoutesList() {
  const [routes, setRoutes] = useState<RouteWithCities[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/routes')
      .then(res => res.json())
      .then(data => {
        setRoutes(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-amber-100">
        <div className="text-gray-400 mb-4">
          <MapPin className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No routes yet</h3>
        <p className="text-gray-600">Add your first route to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-lg border border-amber-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Routes ({routes.length})</h2>
        
        <div className="space-y-3">
          {routes.map((route) => (
            <div
              key={route.id}
              className="p-5 bg-gradient-to-r from-gray-50 to-amber-50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 font-semibold text-gray-900 text-lg mb-2">
                    <span>{route.from_city}</span>
                    <ArrowRight className="w-5 h-5 text-amber-500" />
                    <span>{route.to_city}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {route.distance} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.round(route.time_minutes)} min
                    </span>
                  </div>
                </div>
                <div className="px-5 py-2 bg-white rounded-xl border-2 border-amber-300 font-semibold text-amber-700">
                  {route.mode}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
