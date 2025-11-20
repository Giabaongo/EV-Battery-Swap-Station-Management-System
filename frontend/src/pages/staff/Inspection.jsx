import BatteryReturn from "../../components/batteries/BatteryReturn"

export default function StaffInspection() {
    return (
        <div>
            <div>
                <div class="mb-8">
                    <h1 class="text-3xl font-bold mb-2">Battery Inspection</h1>
                    <p class="text-gray-400">Assess returned battery physical condition</p>
                </div>
            </div>

            <BatteryReturn />
        </div>
    )
}
