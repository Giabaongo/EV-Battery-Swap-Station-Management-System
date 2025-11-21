import {  createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supportService } from '../services/supportService';
import { useAuth } from '../hooks/useAuth';

const SupportContext = createContext();

export const SupportProvider = ({ children }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState(null);

  // Function to create a new support ticket
    const createSupportTicket = async (ticketData) => {
        setError(null);
        try {
            const newTicket = await supportService.createSupportTicket({
                ...ticketData,
                userId: user.id,
            });
            setTickets((prevTickets) => [...prevTickets, newTicket]);
            return newTicket;
        } catch (error) {
            setError(error);
            throw error;
        }   
    };

  const value = useMemo(() => ({
    tickets,
    error,
    createSupportTicket,
  }), [tickets, error]);
    return (
    <SupportContext.Provider value={value}>
        {children}
    </SupportContext.Provider>
  );
};