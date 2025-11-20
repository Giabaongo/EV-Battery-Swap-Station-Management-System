import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Clock,
  Trash2,
  Edit,
  Battery,
  Users,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { stationService } from '../../../services/stationService';
import { batteryService } from '../../../services/batteryService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

export default function StationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState(null);
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStationDetail();
  }, [id]);

  const fetchStationDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch station details and batteries in parallel
      const [stationData, batteriesData] = await Promise.all([
        stationService.getStationById(id),
        batteryService.getBatteriesByStationId(id)
      ]);

      setStation(stationData);
      setBatteries(batteriesData || []);
    } catch (err) {
      console.error('Error fetching station details:', err);
      setError(err.response?.data?.message || 'Failed to load station details');
    } finally {
      setLoading(false);
    }
  };


  const getBatteryStats = () => {
    const full = batteries.filter(b => b.status === 'full').length;
    const charging = batteries.filter(b => b.status === 'charging').length;
    const booked = batteries.filter(b => b.status === 'booked').length;
    const inUse = batteries.filter(b => b.status === 'in-use' || b.status === 'in_use').length;
    const total = batteries.length;

    return { full, charging, booked, inUse, total };
  };

  const getBatteryStatusBadge = (status) => {
    const statusConfig = {
      full: { label: 'Full', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      charging: { label: 'Charging', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
      booked: { label: 'Booked', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
      'in-use': { label: 'In-use', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
      in_use: { label: 'In-use', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
    };

    return statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading station details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Error Loading Station</h3>
                <p className="text-sm text-slate-600">{error}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/stations')} className="mt-4 w-full">
              Back to Stations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600 dark:text-slate-400">Station not found</p>
      </div>
    );
  }

  const stats = getBatteryStats();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl p-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Link
            to="/admin/stations"
            className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
          >
            Stations
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-50 text-sm font-medium">
            {station.name}
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-72">
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight mb-2">
                {station.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${station.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className={`text-sm font-medium ${station.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {station.status === 'active' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(`/admin/stations/edit/${id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Station
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-8 lg:col-span-1">
            {/* Station Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Station Details</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-base">
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Station Name</span>
                    <span className="text-slate-800 dark:text-slate-200">{station.name}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Station ID</span>
                    <span className="text-slate-800 dark:text-slate-200">{station.station_id}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">{station.address}</span>
                  </li>
                  {station.phone && (
                    <li className="flex flex-col">
                      <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">{station.phone}</span>
                    </li>
                  )}
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Coordinates</span>
                    <span className="text-slate-800 dark:text-slate-200 text-sm">
                      {station.latitude}, {station.longitude}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <p className="text-slate-800 dark:text-slate-200 text-base leading-relaxed">
                    {station.address}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Battery Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5" />
                  Battery Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Chart & Legend */}
                <div className="flex flex-col items-center gap-8 sm:flex-row mb-6">
                  <div className="relative flex h-48 w-48 items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                      {/* Full (Green) */}
                      <circle
                        cx="18"
                        cy="18"
                        fill="transparent"
                        r="15.9154943092"
                        stroke="#50e3c2"
                        strokeWidth="3"
                        strokeDasharray={`${(stats.full / stats.total) * 100}, 100`}
                        strokeDashoffset="0"
                      />
                      {/* Charging (Blue) */}
                      <circle
                        cx="18"
                        cy="18"
                        fill="transparent"
                        r="15.9154943092"
                        stroke="#1173d4"
                        strokeWidth="3"
                        strokeDasharray={`${(stats.charging / stats.total) * 100}, 100`}
                        strokeDashoffset={`-${(stats.full / stats.total) * 100}`}
                      />
                      {/* Booked (Yellow) */}
                      <circle
                        cx="18"
                        cy="18"
                        fill="transparent"
                        r="15.9154943092"
                        stroke="#eab308"
                        strokeWidth="3"
                        strokeDasharray={`${(stats.booked / stats.total) * 100}, 100`}
                        strokeDashoffset={`-${((stats.full + stats.charging) / stats.total) * 100}`}
                      />
                      {/* In-use (Purple) */}
                      <circle
                        cx="18"
                        cy="18"
                        fill="transparent"
                        r="15.9154943092"
                        stroke="#a855f7"
                        strokeWidth="3"
                        strokeDasharray={`${(stats.inUse / stats.total) * 100}, 100`}
                        strokeDashoffset={`-${((stats.full + stats.charging + stats.booked) / stats.total) * 100}`}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Total</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-1">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-[#50E3C2]"></div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">Full</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{stats.full} Batteries</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-[#1173d4]"></div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">Charging</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{stats.charging} Batteries</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-[#EAB308]"></div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">Booked</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{stats.booked} Batteries</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-[#A855F7]"></div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">In-use</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{stats.inUse} Batteries</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Battery Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                          Battery ID
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                          Charge Level
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                      {batteries.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            No batteries found at this station
                          </td>
                        </tr>
                      ) : (
                        batteries.map((battery) => {
                          const statusInfo = getBatteryStatusBadge(battery.status);
                          return (
                            <tr key={battery.battery_id}>
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                BAT-{battery.battery_id.toString().padStart(4, '0')}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                                {battery.type} - {battery.model}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                                {battery.current_charge}%
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <Badge className={statusInfo.className}>
                                  {statusInfo.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
