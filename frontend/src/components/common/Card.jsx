import { useBattery, useAuth } from "../../hooks/useContext";

export default function Card({ type = "battery-stats" }) {
  const { batteries } = useBattery();
  const { user } = useAuth();

  // Staff's assigned station id
  const staffStationId = user?.station_id ?? null;

  const matchStation = (item, stationId) => {
    if (!item || !stationId) return false;
    const s = item?.station_id;
    return String(s) === String(stationId);
  };

  const BatteryStatsCards = () => {
    const fullBatteries = batteries
      ? batteries.filter(b => matchStation(b, staffStationId) && ((b?.status || '').toString().toLowerCase() === 'full')).length
      : 0;

    const chargingBatteries = batteries
      ? batteries.filter(b => matchStation(b, staffStationId) && (['charging'].includes(((b?.status || '').toString().toLowerCase())))).length
      : 0;

    const maintenanceBatteries = batteries
      ? batteries.filter(b => matchStation(b, staffStationId) && ['maintenance'].includes(((b?.status || '').toString().toLowerCase()))).length
      : 0;

    return (
      <div className="grid grid-rows-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Full Batteries */}
        <div className="flex items-start gap-4 rounded-xl p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-center size-12 rounded-lg bg-green-100 dark:bg-green-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256" className="text-green-600 dark:text-green-400">
              <path d="M200,56H32A24,24,0,0,0,8,80v96a24,24,0,0,0,24,24H200a24,24,0,0,0,24-24V80A24,24,0,0,0,200,56Zm8,120a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H200a8,8,0,0,1,8,8ZM192,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm-32,0v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm-32,0v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM96,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM64,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm184,8v48a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Total Full Batteries</p>
            <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">{fullBatteries}</p>
          </div>
        </div>

        {/* Batteries Currently Charging */}
        <div className="flex items-start gap-4 rounded-xl p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-center size-12 rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256" className="text-blue-700 dark:text-blue-400">
              <path d="M256,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM224,56V200a24,24,0,0,1-24,24H56a24,24,0,0,1-24-24V56A24,24,0,0,1,56,32H200A24,24,0,0,1,224,56Zm-16,0a8,8,0,0,0-8-8H56a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H200a8,8,0,0,0,8-8ZM144,96.8l-34-20.4A8,8,0,0,0,98,83.2v41.6a8,8,0,0,0,12,6.93l34-20.4A8,8,0,0,0,144,96.8Z"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Batteries Currently Charging</p>
            <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">{chargingBatteries}</p>
          </div>
        </div>

        {/* Batteries Under Maintenance */}
        <div className="flex items-start gap-4 rounded-xl p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-center size-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256" className="text-yellow-600 dark:text-yellow-400">
              <path d="M224,48H32A16,16,0,0,0,16,64V176a16,16,0,0,0,16,16H76.7l-3.6,10.7A8,8,0,0,0,80.7,216h94.6a8,8,0,0,0,7.6-10.7L179.3,192H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,128H32V64H224V176ZM168.6,200H87.4l3.2-9.6a8,8,0,0,0,7.6-10.7L92,162.3a4,4,0,0,1,3.8-5.3h64.4a4,4,0,0,1,3.8,5.3l-6.2,17.4a8,8,0,0,0,7.6,10.7Zm0-56H139.3l18.4-18.3a8,8,0,0,0-11.4-11.4L128,132.7l-18.3-18.4a8,8,0,0,0-11.4,11.4L116.7,144H87.4a8,8,0,0,0,0,16h81.2a8,8,0,0,0,0-16Z"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Batteries Under Maintenance</p>
            <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">{maintenanceBatteries}</p>
          </div>
        </div>
      </div>
    );
  };

  if (type === "battery-stats") {
    return <BatteryStatsCards />;
  }

  return null;
}

