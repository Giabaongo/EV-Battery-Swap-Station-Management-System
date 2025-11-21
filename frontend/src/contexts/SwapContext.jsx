import { createContext, useState, useEffect } from "react";
import { swapService } from "../services/swapService";
import { swappingService } from "../services/swappingService";
import { useNavigate } from "react-router-dom";

const { createSwapTransaction: createSwapTransactionService,
    getAllSwapTransactions: getAllSwapTransactionsService,
    getSwapTransactionById: getSwapTransactionByIdService,
    updateSwapTransaction: updateSwapTransactionService
}
    = swapService;

export const SwapContext = createContext();

export const SwapProvider = ({ children }) => {
    const navigate = useNavigate();
    const [swapTransaction, setSwapTransaction] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to create a new swap transaction
    const createSwapTransaction = async (swapData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createSwapTransactionService(swapData);
            // If backend returns the created swap object under `swapTransaction`, use it.
            const created = response?.swapTransaction || response;
            // prepend to local list so UI reflects newest transaction immediately
            setSwapTransaction(prev => [created, ...prev]);
            return response;
        } catch (error) {
            setError(error);
            // propagate error so callers (UI) can react to failures
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Function to perform automatic swap flow (server resolves vehicle/subscription/batteries)
    const swapBatteries = async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const response = await swappingService.swapBatteries(payload);
            // backend returns swapTransaction inside response.swapTransaction (see backend)
            const created = response?.swapTransaction || response;
            // prepend to local list so UI reflects newest transaction immediately
            setSwapTransaction(prev => [created, ...prev]);
            return response;
        } catch (error) {
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Function to get a swap transaction by ID
    const getSwapTransactionById = async (transactionId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getSwapTransactionByIdService(transactionId);
            return response;
        } catch (error) {
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Function to update a swap transaction
    const updateSwapTransaction = async (transactionId, updateData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await updateSwapTransactionService(transactionId, updateData);
            // replace existing item in state if present, otherwise append
            setSwapTransaction(prev => {
                const updatedItem = response?.swapTransaction || response;
                const idx = prev.findIndex(t => String(t.transaction_id || t.id) === String(transactionId));
                if (idx === -1) return [updatedItem, ...prev];
                const copy = [...prev];
                copy[idx] = updatedItem;
                return copy;
            });
            return response;
        } catch (error) {
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Function to get all swap transaction histories by user ID
    const getAllSwapHistoriesByUserId = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAllSwapTransactionsByUserIdService(userId);
            console.log("Fetched swap histories by user ID:", response);
            return response;
        } catch (error) {
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Function to get all swap transaction histories
    const getAllSwapHistories = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getAllSwapTransactionsService();
            // store fetched histories in local state
            setSwapTransaction(Array.isArray(response) ? response : (response?.data || []));
            return response;
        } catch (error) {
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAllSwapHistories();
    }, []);

    return (
        <SwapContext.Provider
            value={{
                loading,
                error,
                createSwapTransaction,
                swapBatteries,
                getSwapTransactionById,
                getAllSwapHistories,
                updateSwapTransaction,
                swapTransaction,
                getAllSwapHistoriesByUserId,
            }}
        >
            {children}
        </SwapContext.Provider>
    );
};
