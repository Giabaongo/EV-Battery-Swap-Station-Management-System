import React, { useEffect, useRef } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import trackasia from 'trackasia-gl';
import 'trackasia-gl/dist/trackasia-gl.css';
// Link not used in this file; popup uses plain DOM and programmatic navigation

export default function MapContainer({ stations, onMapReady, userLocation, onLocate }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();
  // const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const TRACKASIA_API_KEY = import.meta.env.VITE_TRACKASIA_API_KEY

  const getMarkerColor = (status) => {
    switch (status) {
      case 'active':
        return '#10B981'; // Green
      case 'maintenance':
        return '#F59E0B'; // Yellow
      case 'inactive':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const navigateRef = useRef(navigate);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const mapInstance = new trackasia.Map({
        container: mapRef.current,
        // style: `https://maps.track-asia.com/styles/v2/night.json?key=${TRACKASIA_API_KEY}`, // DARK MODE
        style: `https://maps.track-asia.com/styles/v2/streets.json?key=${TRACKASIA_API_KEY}`,
        center: [106.6297, 10.8231], // Ho Chi Minh City
        zoom: 12,
        // Ensure all TrackAsia sprite/glyph/tile requests include the API key
        transformRequest: (url) => {
          const needsKey = url.includes('track-asia.com') && !/[?&]key=/.test(url);
          if (needsKey) {
            const sep = url.includes('?') ? '&' : '?';
            return { url: `${url}${sep}key=${TRACKASIA_API_KEY}` };
          }
          return { url };
        },
      });

      mapInstanceRef.current = mapInstance;

      // Provide placeholder images for any missing sprite icons to prevent console errors
      mapInstance.on('styleimagemissing', (e) => {
        const id = e.id;
        if (!mapInstance.hasImage(id)) {
          try {
            // Create a tiny transparent image as a fallback
            const width = 1, height = 1;
            const data = new Uint8ClampedArray(width * height * 4); // all zeros => transparent
            const imageData = new ImageData(data, width, height);
            mapInstance.addImage(id, imageData, { pixelRatio: 1 });
          } catch {
            // As a secondary fallback, try using a small canvas
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            mapInstance.addImage(id, canvas, { pixelRatio: 1 });
          }
        }
      });

      // Add map event listeners for popup positioning
      mapInstance.on('move', () => {
        if (activePopupRef.current && activeMarkerRef.current) {
          activeMarkerRef.current._updatePopup();
        }
      });

      mapInstance.on('zoom', () => {
        if (activePopupRef.current && activeMarkerRef.current) {
          activeMarkerRef.current._updatePopup();
        }
      });

      // Hide popup on map click (outside markers)
      mapInstance.on('click', (e) => {
        // Check if click was on a marker
        const features = mapInstance.queryRenderedFeatures(e.point);
        if (features.length === 0 && activePopupRef.current) {
          activePopupRef.current.style.display = 'none';
          activePopupRef.current = null;
          activeMarkerRef.current = null;
        }
      });

      // Pass map instance to parent component
      if (onMapReady) {
        onMapReady(mapInstance);
      }

      return () => {
        // Clear markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        // Remove map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [onMapReady]);

  // Refs for popup management
  const activePopupRef = useRef(null);
  const activeMarkerRef = useRef(null);

  // Update markers when stations change
  useEffect(() => {
    if (mapInstanceRef.current && stations) {
      // Clear existing markers and popups
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Remove all existing popups
      const existingPopups = mapInstanceRef.current.getContainer().querySelectorAll('.station-popup-container');
      existingPopups.forEach(p => p.remove());

      // Add new markers
      stations.forEach(station => {
        if (!station.latitude || !station.longitude) return;
        // trackasia expects [lng, lat]
        const coords = [station.longitude, station.latitude];

        // Create custom popup (React-like structure without using trackasia Popup)
        const popupContainer = document.createElement('div');
        popupContainer.className = 'station-popup-container';
        popupContainer.style.cssText = `
          position: absolute;
          z-index: 1000;
          pointer-events: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
          width: 280px;
          padding: 16px;
          transform: translate(-50%, -100%);
          margin-top: -12px;
          display: none;
        `;

        // Arrow pointing down to marker
        const arrow = document.createElement('div');
        arrow.style.cssText = `
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: white;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          transform: translateX(-50%) rotate(45deg);
        `;

        // Content
        const content = document.createElement('div');
        content.innerHTML = `
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-semibold text-gray-800 pr-4">${station.name}</h3>
            <button class="close-popup text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <p class="text-sm text-gray-600 mb-3">${station.address}</p>
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-gray-600">Available Batteries</span>
            <span class="font-medium text-green-600">${station.availableBatteries || 0}/${station.totalBatteries || 0}</span>
          </div>
          <button class="book-now-btn w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Book Now
          </button>
        `;

        popupContainer.appendChild(content);
        popupContainer.appendChild(arrow);

        // Event listeners
        const closeBtn = popupContainer.querySelector('.close-popup');
        const bookBtn = popupContainer.querySelector('.book-now-btn');

        closeBtn.addEventListener('click', () => {
          popupContainer.style.display = 'none';
          activePopupRef.current = null;
          activeMarkerRef.current = null;
        });

        bookBtn.addEventListener('click', () => {
          const stationId = station.station_id ?? station.id;
          // Pass full station info via location.state
          navigateRef.current(`/driver/booking/${stationId}`, {
            state: {
              station: {
                station_id: stationId,
                name: station.name,
                address: station.address,
                availableBatteries: station.availableBatteries,
                totalBatteries: station.totalBatteries,
                status: station.status
              }
            }
          });
        });

        // Append to map container
        mapInstanceRef.current.getContainer().appendChild(popupContainer);

        const marker = new trackasia.Marker({
          color: getMarkerColor(station.status)
        })
          .setLngLat(coords)
          .addTo(mapInstanceRef.current);

        // Function to update popup position
        const updatePopupPosition = () => {
          if (activePopupRef.current === popupContainer && activeMarkerRef.current === marker) {
            const markerEl = marker.getElement();
            const rect = markerEl.getBoundingClientRect();
            const mapRect = mapInstanceRef.current.getContainer().getBoundingClientRect();

            popupContainer.style.left = `${rect.left - mapRect.left}px`;
            popupContainer.style.top = `${rect.top - mapRect.top}px`;
          }
        };

        // Show custom popup on marker click
        marker.getElement().addEventListener('click', () => {
          // Hide all other popups first
          const allPopups = mapInstanceRef.current.getContainer().querySelectorAll('.station-popup-container');
          allPopups.forEach(p => p.style.display = 'none');

          // Set active popup and marker
          activePopupRef.current = popupContainer;
          activeMarkerRef.current = marker;

          // Position and show this popup
          updatePopupPosition();
          popupContainer.style.display = 'block';
        });

        // Store update function on marker for later use
        marker._updatePopup = updatePopupPosition;

        markersRef.current.push(marker);
      });
    }
  }, [stations]);

  // Add/update current user location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Xóa marker cũ nếu có
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    //nếu có tọa độ người dùng thì thêm marker 
    if (userLocation && userLocation.longitude != null && userLocation.latitude != null) {
      // Tạo marker giống Google Maps (vòng tròn xanh nhấp nháy)
      const el = document.createElement('div');
      el.className = 'user-location-marker';

      const style = document.createElement('style');
      style.textContent = `
      .user-location-marker {
        position: relative;
        width: 20px;
        height: 20px;
        background: #4285F4;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 rgba(66,133,244,0.4);
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(66,133,244,0.4);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(66,133,244,0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(66,133,244,0);
        }
      }
    `;
      document.head.appendChild(style);

      userMarkerRef.current = new trackasia.Marker({ element: el })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(mapInstanceRef.current);

      // Tự động zoom & di chuyển tới vị trí hiện tại
      mapInstanceRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        speed: 1.2, // tốc độ di chuyển
        curve: 1.5, // độ mượt
        essential: true,
      });
    }
  }, [userLocation]);

  // const handleGoToPlans = () => {
  //   setShowSubscriptionAlert(false);
  //   navigate('/driver/plans');
  // };

  // const handleCloseAlert = () => {
  //   setShowSubscriptionAlert(false);
  // };

  return (
    <div className="w-full h-full p-4 bg-hidden rounded-lg">
      <div className="bg-transparent rounded-lg h-full relative overflow-hidden">
        <div
          ref={mapRef}
          className="w-full h-full rounded-lg"
          style={{ minHeight: '400px' }}
        />

        {/* Current Location Button */}
        <button
          onClick={onLocate}
          className="absolute top-6 right-6 bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow z-10 border border-gray-200"
        >
          <MapPin size={20} className="text-blue-700" />
        </button>
      </div>

      {/* Subscription Required Alert Modal - Same as StationCard */}
      {/* {showSubscriptionAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Chưa có gói đăng ký
                </h3>
                <p className="text-gray-600 mb-4">
                  Bạn cần đăng ký một gói dịch vụ trước khi có thể đặt lịch thay pin.
                  Vui lòng chọn gói phù hợp với nhu cầu của bạn.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseAlert}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleGoToPlans}
                className="flex-1 bg-blue-700 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Xem gói đăng ký
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

