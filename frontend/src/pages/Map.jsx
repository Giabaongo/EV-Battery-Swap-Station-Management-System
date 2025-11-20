import React, { useState, useCallback, useEffect } from 'react';
import 'trackasia-gl/dist/trackasia-gl.css';
import MapSearchBar from '../components/map/MapSearchBar';
import MapContainer from '../components/map/MapContainer';
import StationsList from '../components/map/StationsList';
import { useStation, useBattery, useVehicle } from '../hooks/useContext';

// Take real station data from StationContext

export default function MapPage() {
  const { stations, getAllStations } = useStation();
  const { batteries, getAllBatteries } = useBattery();
  const { vehicles } = useVehicle();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [filteredStations, setFilteredStations] = useState([]);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    const refreshData = async () => {
      try {
        await Promise.all([
          getAllStations(),
          getAllBatteries()
        ]);
      } catch (error) {
        console.error('Error refreshing map data:', error);
      }
    };

    // Initial fetch
    refreshData();

    // Refresh every 5 seconds
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [getAllStations, getAllBatteries]);

  // Compute Haversine distance in meters
  //Công thức tính quãng đường giữa hai điểm trên map dựa trên vĩ độ và kinh độ của chúng
  const distanceMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(query, selectedVehicleId);
  };

  const handleVehicleFilter = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    applyFilters(searchQuery, vehicleId);
  };

  const applyFilters = useCallback((query, vehicleId) => {
    // Compute distance and enrich stations locally
    const computeWithDistance = (list, loc) => {
      if (!Array.isArray(list)) return [];
      const enriched = list.map((s) => {
        // Count available batteries for this station
        const availableBatteries = (batteries || []).filter(
          (b) => b.station_id === s.station_id && String(b.status || '').toLowerCase() === 'full'
        ).length;
        // Count total batteries for this station
        const totalBatteries = (batteries || []).filter(
          (b) => b.station_id === s.station_id
        ).length;

        if (loc && s?.latitude != null && s?.longitude != null) {
          const meters = distanceMeters(loc.latitude, loc.longitude, s.latitude, s.longitude);
          return {
            ...s,
            distanceValue: meters,
            distance: `${(meters / 1000).toFixed(1)} km`,
            availableBatteries,
            totalBatteries,
          };
        }
        return { ...s, distanceValue: Number.POSITIVE_INFINITY, distance: undefined, availableBatteries, totalBatteries };
      });
      enriched.sort((a, b) => (a.distanceValue || Infinity) - (b.distanceValue || Infinity));
      return enriched;
    };

    let base = computeWithDistance(stations || [], userLocation);

    // Filter by search query
    const q = (query || '').toLowerCase();
    if (q) {
      base = base.filter((station) =>
        station.name?.toLowerCase().includes(q) || station.address?.toLowerCase().includes(q)
      );
    }

    // Filter by vehicle's battery model
    if (vehicleId && vehicleId !== 'all') {
      const selectedVehicle = vehicles?.find(v => String(v.vehicle_id) === String(vehicleId));
      if (selectedVehicle?.battery_model) {
        const vehicleBatteryModel = selectedVehicle.battery_model;

        // Filter stations that have batteries matching the vehicle's battery model
        base = base.filter((station) => {
          const stationBatteries = batteries?.filter(b =>
            b.station_id === station.station_id &&
            (b.status === 'full' || b.status === 'charging')
          ) || [];

          return stationBatteries.some(battery =>
            battery.model?.toLowerCase() === vehicleBatteryModel?.toLowerCase()
          );
        });
      }
    }

    setFilteredStations(base);
  }, [stations, userLocation, vehicles, batteries]);

  const handleStationClick = (station) => {
    if (map) {
      map.flyTo({
        center: [station.longitude, station.latitude],
        zoom: 15
      });
    }
  };

  const handleMapReady = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Locate user using browser geolocation
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(loc);
        if (map && typeof map.flyTo === 'function') {
          map.flyTo({ center: [loc.longitude, loc.latitude], zoom: 14 });
        }
      },
      (err) => {
        console.warn('Unable to retrieve your location:', err?.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map]);

  // Auto-locate user when map is ready
  useEffect(() => {
    if (map) {
      locateUser();
    }
  }, [map, locateUser]);

  // Apply filters whenever stations, batteries, or location changes
  useEffect(() => {
    applyFilters(searchQuery, selectedVehicleId);
  }, [stations, batteries, userLocation, searchQuery, selectedVehicleId, applyFilters]);

  return (
    <div className="flex flex-col pb-6 h-screen overflow-hidden">
      <MapSearchBar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onVehicleFilterChange={handleVehicleFilter}
      />

      {/* Main content area with Map and Stations side by side */}
      <div className="flex flex-1 overflow-hidden bg-gray-50">
        {/* Left side - Map */}
        <div className="flex-1 h-full">
          <MapContainer
            stations={filteredStations}
            onMapReady={handleMapReady}
            userLocation={userLocation}
            onLocate={locateUser}
          />
        </div>

        {/* Right side - Nearby Stations */}
        <div className="w-96 bg-transparent overflow-hidden ">
          <StationsList
            stations={filteredStations}
            onStationClick={handleStationClick}
            userLocation={userLocation}
          />
        </div>
      </div>
    </div>
  );
}