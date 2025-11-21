import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { packageService } from "../services/packageService";
import { subscriptionService } from "../services/subscriptionService";

const { getAllPackages: getAllPackagesService } = packageService;
const {
    getAllSubscriptions: getAllSubscriptionsService,
    getSubscriptionById: getSubscriptionByIdService,
    getSubscriptionsByUserId: getSubscriptionsByUserIdService,
    getActiveSubscriptionByUserId: getActiveSubscriptionByUserIdService,
    createSubscription: createSubscriptionService,
    updateSubscription: updateSubscriptionService,
    cancelSubscription: cancelSubscriptionService,
    checkExpiredSubscriptions: checkExpiredSubscriptionsService,
    incrementSwapCount: incrementSwapCountService,
} = subscriptionService;

export const ServiceContext = createContext();

export const ServiceProvider = ({ children }) => {
    // ============ PACKAGE STATE (from PackageContext) ============
    const [packages, setPackages] = useState([]);
    const [packageLoading, setPackageLoading] = useState(false);
    const [packageError, setPackageError] = useState(null);

    // ============ SUBSCRIPTION STATE (from SubscriptionContext) ============
    const [subscriptions, setSubscriptions] = useState([]);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState(null);

    // ============ PACKAGE METHODS ============
    const getAllPackages = async () => {
        setPackageLoading(true);
        setPackageError(null);
        try {
            const response = await getAllPackagesService();
            setPackages(response);
            return response;
        } catch (err) {
            setPackageError("Failed to fetch packages");
            throw err;
        } finally {
            setPackageLoading(false);
        }
    };

    const getPackageById = async (packageId) => {
        try {
            const response = await packageService.getPackageById(packageId);
            return response;
        } catch (err) {
            setPackageError("Failed to fetch package");
            throw err;
        }
    };

    // ============ SUBSCRIPTION METHODS ============
    const fetchAllSubscriptions = async () => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const data = await getAllSubscriptionsService();
            setSubscriptions(data);
            return data;
        } catch (err) {
            console.error("fetchAllSubscriptions error", err);
            setSubscriptionError("Failed to fetch subscriptions");
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const getSubscriptionById = async (id) => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const data = await getSubscriptionByIdService(id);
            return data;
        } catch (err) {
            console.error("getSubscriptionById error", err);
            setSubscriptionError("Failed to fetch subscription");
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const getSubscriptionsByUserId = async (userId) => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const data = await getSubscriptionsByUserIdService(userId);
            setSubscriptions(data);
            return data;
        } catch (err) {
            console.error("getSubscriptionsByUserId error", err);
            setSubscriptionError("Failed to fetch user subscriptions");
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const getActiveSubscription = useCallback(async (userId) => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const data = await getActiveSubscriptionByUserIdService(userId);
            setActiveSubscription(data);
            return data;
        } catch (err) {
            console.error("getActiveSubscription error", err);
            setSubscriptionError("Failed to fetch active subscription");
            setActiveSubscription(null);
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    }, []);

    const createSubscription = async (subscriptionData) => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const newSubscription = await createSubscriptionService(subscriptionData);
            setSubscriptions((prev) => [...prev, newSubscription]);
            return newSubscription;
        } catch (err) {
            console.error("createSubscription error", err);
            setSubscriptionError("Failed to create subscription");
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const updateSubscription = async (id, subscriptionData) => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const updated = await updateSubscriptionService(id, subscriptionData);
            setSubscriptions((prev) =>
                prev.map((sub) => (sub.subscription_id === id ? updated : sub))
            );
            if (activeSubscription?.subscription_id === id) {
                setActiveSubscription(updated);
            }
            return updated;
        } catch (err) {
            console.error("updateSubscription error", err);
            setSubscriptionError("Failed to update subscription");
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const cancelSubscription = async (id) => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const cancelled = await cancelSubscriptionService(id);
            setSubscriptions((prev) =>
                prev.map((sub) => (sub.subscription_id === id ? cancelled : sub))
            );
            if (activeSubscription?.subscription_id === id) {
                setActiveSubscription(null);
            }
            return cancelled;
        } catch (err) {
            console.error("cancelSubscription error", err);
            setSubscriptionError("Failed to cancel subscription");
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const checkExpiredSubscriptions = async () => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const result = await checkExpiredSubscriptionsService();
            return result;
        } catch (err) {
            console.error("checkExpiredSubscriptions error", err);
            setSubscriptionError("Failed to check expired subscriptions");
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const incrementSwapCount = async (id) => {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
            const updated = await incrementSwapCountService(id);
            setSubscriptions((prev) =>
                prev.map((sub) => (sub.subscription_id === id ? updated : sub))
            );
            if (activeSubscription?.subscription_id === id) {
                setActiveSubscription(updated);
            }
            return updated;
        } catch (err) {
            console.error("incrementSwapCount error", err);
            setSubscriptionError("Failed to increment swap count");
            throw err;
        } finally {
            setSubscriptionLoading(false);
        }
    };

    // ============ EFFECTS ============
    // Get user from AuthContext
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const { token } = authContext || {};

    // Load packages on mount
    useEffect(() => {
        if (!token) return;
        let mounted = true;

        const fetchPackages = async () => {
            setPackageLoading(true);
            setPackageError(null);
            try {
                const response = await getAllPackagesService();
                if (mounted) setPackages(response);
            } catch (err) {
                if (mounted) setPackageError("Failed to fetch packages");
            } finally {
                if (mounted) setPackageLoading(false);
            }
        };

        fetchPackages();

        return () => {
            mounted = false;
        };
    }, [token]);

    // Load subscriptions for driver on mount/login
    useEffect(() => {
        const userId = user?.user_id || user?.id;

        if (!token || !userId) {
            console.log('ServiceContext: No token or user - skipping subscriptions fetch');
            return;
        }

        // Only fetch subscriptions for driver role
        if (user.role !== 'driver') {
            console.log(`ServiceContext: User role is ${user.role} - skipping subscriptions fetch (driver only)`);
            return;
        }

        if (subscriptions.length === 0 && !subscriptionLoading) {
            console.log('ServiceContext: Fetching subscriptions for driver user:', userId);
            getSubscriptionsByUserId(userId).catch(err => {
                console.error('ServiceContext: Failed to fetch subscriptions:', err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user?.user_id, user?.id, user?.role]);

    // Combined loading/error for backward compatibility
    const loading = packageLoading || subscriptionLoading;
    const error = packageError || subscriptionError;

    return (
        <ServiceContext.Provider value={{
            // Package data & methods
            packages,
            getAllPackages,
            getPackageById,

            // Subscription data & methods
            subscriptions,
            activeSubscription,
            fetchAllSubscriptions,
            getSubscriptionById,
            getSubscriptionsByUserId,
            getActiveSubscription,
            createSubscription,
            updateSubscription,
            cancelSubscription,
            checkExpiredSubscriptions,
            incrementSwapCount,

            // Combined status
            loading,
            error,

            // Individual status (for advanced use)
            packageLoading,
            packageError,
            subscriptionLoading,
            subscriptionError,
        }}>
            {children}
        </ServiceContext.Provider>
    );
};
