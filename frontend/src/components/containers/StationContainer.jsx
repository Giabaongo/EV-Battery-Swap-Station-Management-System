import { useStationHandler } from "../../hooks/useStationHandler";
import MapPage from "../../pages/Map";
import StationCard from "../map/StationCard";

export default function StationContainer({ mode }) {
    const { loading, runGetAllStations, getAllStationsLoading, runGetStationById, getStationByIdLoading } = useStationHandler();

    const handleGetAllStations = () => {
        runGetAllStations();
    };

    const handleGetStationById = (id) => {
        runGetStationById(id);
    };

    return (
        <div>
            {mode === "getAllStations" && (
                <MapPage
                    onGetAllStations={handleGetAllStations}
                    loading={loading || getAllStationsLoading}
                />
            )}
            {mode === "getStationById" && (
                <StationCard
                    onGetStationById={handleGetStationById}
                    loading={loading || getStationByIdLoading}
                />
            )}
        </div>
    );
}
