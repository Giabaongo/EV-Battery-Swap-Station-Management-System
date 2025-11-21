import React, { useState, useEffect } from 'react';
import { stationService } from '../../services/stationService';
import SupportHeader from '../../components/support/SupportHeader';
import SupportTicketCard from '../../components/support/SupportTicketCard';
import SupportContact from '../../components/support/SupportContact';
import MyTickets from '../../components/support/MyTickets';

export default function Support() {
  const [allStations, setAllStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await stationService.getAllStations();
        setAllStations(Array.isArray(data) ? data : (data?.data || []));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Only show stations with status 'active'
  const activeStations = (allStations || []).filter(
    st => String(st.status).toLowerCase() === 'active'
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <SupportHeader />
        {loading ? (
          <div className="text-center py-8">Loading station lists...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        ) : (
          <SupportTicketCard stations={activeStations} />
        )}
        <MyTickets />
        <SupportContact />
      </div>
    </div>
  );
}
