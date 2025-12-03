import { useState } from 'react';
import { Map, Plus, Navigation, QrCode, BarChart3, GitCompare } from 'lucide-react';
import RouteFinder from '@/react-app/components/RouteFinder';
import RouteAdder from '@/react-app/components/RouteAdder';
import RoutesList from '@/react-app/components/RoutesList';
import StatisticsDashboard from '@/react-app/components/StatisticsDashboard';
import RouteComparison from '@/react-app/components/RouteComparison';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'find' | 'add' | 'list' | 'stats' | 'compare'>('find');
  const [showQR, setShowQR] = useState(false);
  const appUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Map className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Emirates Navigator</h1>
                <p className="text-amber-100 mt-1">Discover the best routes across UAE cities</p>
              </div>
            </div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl hover:bg-white/30 transition-all"
              title="Show QR Code"
            >
              <QrCode className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Scan to Open App</h2>
            <div className="bg-white p-6 rounded-2xl border-4 border-amber-200 mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}`}
                alt="QR Code"
                className="w-full h-auto"
              />
            </div>
            <p className="text-gray-600 text-center text-sm mb-4">
              Scan this QR code with your phone's camera to open the app in your mobile browser
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('find')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'find'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Find Route
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'compare'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Compare
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'add'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Map className="w-4 h-4" />
            All Routes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'find' && <RouteFinder />}
        {activeTab === 'compare' && <RouteComparison />}
        {activeTab === 'stats' && <StatisticsDashboard />}
        {activeTab === 'add' && <RouteAdder />}
        {activeTab === 'list' && <RoutesList />}
      </div>
    </div>
  );
}
