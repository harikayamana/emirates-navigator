import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, MapPin, Route as RouteIcon, Activity, Loader2 } from 'lucide-react';
import type { Statistics } from '@/shared/types';

export default function StatisticsDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/statistics')
      .then(res => res.json())
      .then(data => {
        setStats(data);
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

  if (!stats) {
    return null;
  }

  const COLORS = ['#f59e0b', '#fb923c', '#f97316', '#ea580c', '#dc2626'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <RouteIcon className="w-8 h-8 opacity-80" />
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.totalRoutes}</div>
          <div className="text-amber-100 text-sm font-medium">Total Routes</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-3xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <MapPin className="w-8 h-8 opacity-80" />
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.totalCities}</div>
          <div className="text-orange-100 text-sm font-medium">Cities Connected</div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-3xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <RouteIcon className="w-8 h-8 opacity-80" />
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.averageDistance.toFixed(1)}</div>
          <div className="text-pink-100 text-sm font-medium">Avg Distance (km)</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 opacity-80" />
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">{stats.totalDistanceCovered.toLocaleString()}</div>
          <div className="text-purple-100 text-sm font-medium">Total Network (km)</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Transport Mode Distribution */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Transport Mode Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.transportModeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ mode, percent }) => `${mode} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.transportModeDistribution.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Most Connected Cities */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Most Connected Cities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.mostConnectedCities}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
              <XAxis dataKey="city" tick={{ fill: '#78716c' }} />
              <YAxis tick={{ fill: '#78716c' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff7ed', 
                  border: '2px solid #fed7aa',
                  borderRadius: '12px',
                  padding: '12px'
                }} 
              />
              <Bar dataKey="connections" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network Insights */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Network Insights</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
            <div className="text-3xl font-bold text-amber-600 mb-2">
              {stats.mostConnectedCities[0]?.connections || 0}
            </div>
            <div className="text-sm text-gray-600 mb-1">Maximum Connections</div>
            <div className="text-xs text-gray-500">
              {stats.mostConnectedCities[0]?.city || 'N/A'} is the most connected hub
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl border border-orange-200">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {stats.transportModeDistribution.length}
            </div>
            <div className="text-sm text-gray-600 mb-1">Transport Modes</div>
            <div className="text-xs text-gray-500">
              Diverse transportation options available
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200">
            <div className="text-3xl font-bold text-rose-600 mb-2">
              {stats.totalCities > 0 ? (stats.totalRoutes / stats.totalCities).toFixed(1) : '0.0'}
            </div>
            <div className="text-sm text-gray-600 mb-1">Routes per City</div>
            <div className="text-xs text-gray-500">
              Network connectivity ratio
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
