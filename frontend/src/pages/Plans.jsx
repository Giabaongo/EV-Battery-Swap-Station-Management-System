import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import PlansList from '../components/plans/PlansList'
import SubscribedList from '../components/plans/SubscribedList'
import CancelledSubscriptions from '../components/plans/CancelledSubscriptions'
import { packageService } from '../services/packageService'
import { subscriptionService } from '../services/subscriptionService'
import SubscribeModal from '../components/plans/SubscribeModal'
import { paymentService } from '../services/paymentService'
import { useVehicle } from '../hooks/useContext'

export default function Plans() {
  // Get user from parent (Driver.jsx) via Outlet context
  const { user } = useOutletContext()
  const { fetchAllVehicles } = useVehicle()

  const [packages, setPackages] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [activeSubscriptions, setActiveSubscriptions] = useState([])
  const [cancelledSubscriptions, setCancelledSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState(null)

  // Format number with commas (e.g., 300000 -> 300,000)
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return amount
    return Number(amount).toLocaleString('en-US')
  }

  // Transform package data from backend to UI format
  const transformPackageToUI = (pkg) => ({
    id: String(pkg.package_id),
    name: pkg.name,
    description: pkg.description,
    price: pkg.base_price && pkg.base_price > 0 ? `${formatCurrency(pkg.base_price)} VND` : 'Contact sales',
    period: pkg.duration_days && pkg.duration_days > 0
      ? pkg.duration_days === 30
        ? 'per month'
        : `per ${pkg.duration_days} days`
      : 'per swap',
    features: [
      pkg.base_distance && pkg.base_distance > 0 ? `${formatCurrency(pkg.base_distance)} km included` : 'Flexible swaps',
      pkg.phi_phat && pkg.phi_phat > 0 ? `Extra fee: ${formatCurrency(pkg.phi_phat)} VNĐ` : 'No extra fee',
      'Access to all stations',
      '24/7 customer support'
    ],
    details: pkg.description,
    rawData: pkg
  })

  // Fetch packages from backend
  const fetchPackages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await packageService.getAllPackages()
      const packagesData = response.data || response

      // Filter active packages and transform for UI
      const activePackages = packagesData
        .filter(pkg => pkg.active)
        .map(transformPackageToUI)

      setPackages(activePackages)
      return activePackages
    } catch (err) {
      setError(err.message)
      console.error('Error fetching packages:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Fetch user subscriptions from backend
  const fetchUserSubscriptions = async () => {
    if (!user?.user_id) {
      console.warn('No user ID found')
      return []
    }

    try {
      const response = await subscriptionService.getSubscriptionsByUserId(user.user_id)
      const subscriptionsData = response.data || response
      console.log('Fetched subscriptions:', subscriptionsData)
      return Array.isArray(subscriptionsData) ? subscriptionsData : []
    } catch (err) {
      console.error('Error fetching subscriptions:', err)
      return []
    }
  }

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      // fetch packages and subscriptions in parallel and return results
      const [fetchedPackages, fetchedSubscriptions] = await Promise.all([
        fetchPackages(),
        fetchUserSubscriptions()
      ])

      // Enrich subscriptions with package UI info when possible
      const enrichedSubs = (fetchedSubscriptions || []).map(sub => {
        // subscription may contain package_id or a nested package object
        const pkgId = sub.package_id || sub.package?.package_id || sub.packageId || sub.packageId
        const matched = (fetchedPackages || []).find(p => String(p.rawData.package_id) === String(pkgId) || String(p.id) === String(pkgId))
        return {
          ...sub,
          // prefer package fields from matched package, fall back to existing fields
          name: matched?.name || sub.name || (sub.package && sub.package.name),
          description: matched?.description || sub.description || (sub.package && sub.package.description),
          details: matched?.details || sub.details || (sub.package && sub.package.description),
          price: matched?.price || sub.price || (sub.package && sub.package.base_price),
          period: matched?.period || sub.period,
          package_id: pkgId || sub.package_id
        }
      })

      // Separate active and cancelled subscriptions
      const active = enrichedSubs.filter(sub =>
        sub.status !== 'cancelled'
      )
      const cancelled = enrichedSubs.filter(sub =>
        sub.status === 'cancelled'
      )

      setSubscriptions(enrichedSubs)
      setActiveSubscriptions(active)
      setCancelledSubscriptions(cancelled)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch packages on component mount
  useEffect(() => {
    fetchAllData()
    // Also fetch vehicles to ensure they're available for subscription modal
    if (fetchAllVehicles && user?.user_id) {
      fetchAllVehicles(user.user_id)
    }
  }, [user?.user_id])


  // Open subscribe modal (choose vehicle, confirm payment)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paying, setPaying] = useState(false)

  const openSubscribeModal = (plan) => {
    setSelectedPlan(plan)
    setModalOpen(true)
  }

  // Called when user clicks Pay in modal
  const handlePay = async (vehicleId) => {
    if (!user?.user_id || !selectedPlan) {
      toast.error('Missing user or package info')
      return
    }

    setPaying(true)
    try {
      const payload = {
        user_id: user.user_id,
        package_id: selectedPlan.rawData.package_id,
        vehicle_id: parseInt(vehicleId)
        //TODO: THÊM PAYMENT TYPE VÔ CÁI NÀY 
      }

      const res = await paymentService.createPayment(payload)
      // Expect backend to return a redirect url to VNPay
      const redirectUrl = res?.vnpUrl || res?.paymentUrl || res?.url || res?.redirectUrl || res
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        toast.error('Payment URL not returned by server')
      }
    } catch (err) {
      console.error('Payment creation failed', err)
      toast.error('Payment creation failed: ' + (err.message || err))
    } finally {
      setPaying(false)
    }
  }

  // Thanh toan tien mat
  const handlePayDirectly = async (vehicleId) => {
    if (!user?.user_id || !selectedPlan) {
      toast.error('Missing user or package info')
      return
    }

    setPaying(true)
    try {
      const payload = {
        user_id: user.user_id,
        package_id: selectedPlan.rawData.package_id,
        vehicle_id: parseInt(vehicleId)
      }

      console.log('Creating direct payment with payload:', payload)
      const res = await paymentService.createDirectPaymentWithFees(payload)
      
      if (res) {
        toast.success('Payment created successfully! Waiting for staff approval.')
        setModalOpen(false)
        // Refresh subscriptions after payment
        await fetchAllData()
      } else {
        toast.error('Payment creation failed')
      }
    } catch (err) {
      console.error('Direct payment creation failed', err)
      toast.error('Payment creation failed: ' + (err.message || err))
    } finally {
      setPaying(false)
    }
  }

  // Note: User can now subscribe to the same package multiple times
  // as long as they use different vehicles. Validation is done in SubscribeModal
  // by checking if the selected vehicle already has an active subscription.

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading packages and subscriptions...</div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium text-lg">Error loading packages</h3>
            <p className="text-red-600 text-sm mt-2">{error}</p>
            <button
              onClick={fetchAllData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No user state
  if (!user) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-yellow-800 font-medium text-lg">Authentication Required</h3>
            <p className="text-yellow-600 text-sm mt-2">Please login to view and manage your subscriptions.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Plans & Subscriptions</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.username}!</p>
        </div>

        <section className="mb-8">
          <PlansList
            plans={packages}
            subscriptions={activeSubscriptions}
            onSubscribe={openSubscribeModal}
            loading={subscribing}
          />
        </section>

        {/* Subscribe modal */}
        <SubscribeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          plan={selectedPlan}
          user={user}
          onPay={handlePay}
          onPayDirectly={handlePayDirectly}
          paying={paying}
          subscriptions={activeSubscriptions}
        />

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Active Subscriptions</h2>
          <SubscribedList
            subscriptions={activeSubscriptions}
            onRefresh={fetchAllData}
          />
        </section>

        {/* Cancelled Subscriptions Dropdown */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Cancelled Subscriptions</h2>
          <CancelledSubscriptions subscriptions={cancelledSubscriptions} />
        </section>
      </div>
    </div>
  )
}