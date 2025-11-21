import api from "./api";
import { API_ENDPOINTS } from "../constants";

// Function get payment by user ID
const getPaymentByUserId = async (userId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.PAYMENT.GET_PAYMENTS_BY_USER(userId)
    );
    console.log("Fetched payments:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching payments by user ID:", error);
    throw error;
  }
};

const createPayment = async (paymentData) => {
  try {
    const response = await api.post(API_ENDPOINTS.PAYMENT.CREATE_VNPAY_URL_WITH_FEES, paymentData);
    console.log("Created payment:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

const createMomoPayment = async (paymentData) => {
  try {
    const response = await api.post(API_ENDPOINTS.PAYMENT.CREATE_MOMO_URL, paymentData);
    console.log("Created MOMO payment:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating MOMO payment:", error);
    throw error;
  }
};  

const createDirectPaymentWithFees = async (paymentData) => {
  try {
    // ⚠️ Use MOCK_PAYMENT because DIRECT_WITH_FEES returns 404
    const response = await api.post(API_ENDPOINTS.PAYMENT.MOCK_PAYMENT, paymentData);
    console.log("Created direct payment with fees:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating direct payment with fees:", error);
    throw error;
  }
};

const renewSubscription = async (renewalData) => {
  try {
    const response = await api.post(API_ENDPOINTS.PAYMENT.RENEW_SUBSCRIPTION, renewalData);
    console.log("Renewed subscription payment:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error renewing subscription payment:", error);
    throw error;
  }
};

const renewSubscriptionMomo = async (renewalData) => {
  try {
    const response = await api.post(API_ENDPOINTS.PAYMENT.RENEW_SUBSCRIPTION_MOMO, renewalData);  
    console.log("Renewed MOMO subscription payment:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error renewing MOMO subscription payment:", error);
    throw error;
  }
};

const renewSubscriptionDirect = async (renewalData) => {
  try {
    const response = await api.post(API_ENDPOINTS.PAYMENT.DIRECT_RENEW_SUBSCRIPTION, renewalData);  
    console.log("Renewed direct subscription payment:", response.data);
    return response.data;
  }
  catch (error) {
    console.error("Error renewing direct subscription payment:", error);
    throw error;
  }
};

const payPenaltyOnly = async (penaltyData) => {
  try {
    const response = await api.post(API_ENDPOINTS.PAYMENT.PAY_PENALTY_ONLY, penaltyData);
    console.log("Paid penalty only:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error paying penalty only:", error);
    throw error;
  }
};


const getPaymentById = async (paymentId) => {
  try {
    const response = await api.get(API_ENDPOINTS.PAYMENT.GET_PAYMENT(paymentId));
    console.log("Fetched payment by ID:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching payment by ID:", error);
    throw error;
  } 
};


      
// const createDirectPayment = async (paymentData) => {
//   try {
//     const response = await api.post(API_ENDPOINTS.PAYMENT.DIRECT_PAYMENT, paymentData);   
//     console.log("Created direct payment:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Error creating direct payment:", error);
//     throw error;
//   }   
// };

const handleVnpayReturn = async (queryParams) => {
  try {
    const response = await api.get(API_ENDPOINTS.PAYMENT.VNPAY_RETURN, {
      params: queryParams,
    });
    console.log("vnpay return data: ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error handling VNPay return:", error);
    throw error;
  }
};

export const paymentService = {
  getPaymentByUserId,
  createPayment,
  createDirectPaymentWithFees,
  handleVnpayReturn,
  renewSubscription,
  renewSubscriptionDirect,
  payPenaltyOnly,
  getPaymentById,
  createMomoPayment,
  renewSubscriptionMomo,
};





