import React, { useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { vehicleService } from '../../services/vehicleService'
// import { useAuth } from '../../hooks/useContext'
import { useNavigate } from 'react-router-dom'

export default function AssignVehicle({ onAdded }) {
    // const { user } = useAuth()
    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)

    // Step 1 fields
    const [vin, setVin] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [assignedVehicle, setAssignedVehicle] = useState(null)


    const onContinue = async () => {
        // validate
        if (!vin) {
            setError('Please fill VIN')
            return
        }
        setError(null)
        setLoading(true)

        try {
            console.log('Adding vehicle with VIN:', vin);
            // Use PATCH /vehicles/add-vehicle for driver self-assignment
            const assign = await vehicleService.addVehicleToCurrentUser(vin)
            setAssignedVehicle(assign)
            if (typeof onAdded === 'function') onAdded(assign)
            setStep(2)
        } catch (err) {
            console.error('Error adding vehicle:', err)
            setError(err?.response?.data?.message || err.message || 'Failed to add vehicle')
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = () => {
        // navigate to plans and pass vehicle id
        setOpen(false)
        if (assignedVehicle?.vehicle_id) {
            navigate('/driver/plans', { state: { vehicle_id: assignedVehicle.vehicle_id } })
        } else {
            navigate('/driver/plans')
        }
    }

    const handleFinishWithoutSubscribe = () => {
        setOpen(false)
        // notify parent to refresh list and optionally show banner
        if (onAdded) onAdded({ vehicle: assignedVehicle, suggestedSubscription: true })
        // reset form
        setStep(1)
        setVin('')
        setAssignedVehicle(null)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div>
                <DialogTrigger asChild>
                    <Button className="bg-blue-700 hover:bg-blue-700">Add Vehicle</Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{step === 1 ? 'Add Vehicle' : 'Subscription'}</DialogTitle>
                    </DialogHeader>

                    {step === 1 ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-700">VIN</label>
                                <Input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="Enter VIN" />
                            </div>

                            {error && <div className="text-sm text-red-600">{error}</div>}

                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={onContinue} disabled={loading}>{loading ? 'Working…' : 'Tiếp tục'}</Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p>Bạn có muốn đăng ký gói thuê pin cho xe này không?</p>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={handleFinishWithoutSubscribe}>Không</Button>
                                <Button onClick={handleSubscribe}>Có — Đăng ký</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </div>
        </Dialog>
    )
}

