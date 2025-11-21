import { Card, CardContent } from "../ui/card"
import { Zap, CreditCard, Car, BarChart3, MapPin } from 'lucide-react'

// Danh sách các tính năng chính của dịch vụ KIRI Swap
const features = [
  {
    icon: Zap,
    title: "Ultra-Fast Swap",
    description: "Complete battery swap in just minutes, eliminating charging downtime and getting you back on the road quickly."
  },
  {
    icon: CreditCard,
    title: "Smart Booking & Payment",
    description: "Easy reservation and flexible payment options via our mobile app. Choose pay-per-swap or subscription plans."
  },
  {
    icon: Car,
    title: "Multi-Vehicle Compatibility",
    description: "Our system supports a diverse range of EV types and battery models for maximum convenience."
  },
  {
    icon: BarChart3,
    title: "Transparent Management",
    description: "Track your swap history, battery health, and costs with our intuitive dashboard interface."
  },
  {
    icon: MapPin,
    title: "Ready-to-Go Network",
    description: "Extensive station network ensures a fully charged battery is always available when you need it."
  }
]

// Component hiển thị 5 tính năng chính của KIRI Swap
export default function KeyFeatures() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Key Service Features
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our battery swap service offers unmatched convenience and efficiency for EV owners
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Icon className="w-12 h-12 text-blue-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </div>
    </section>
  )
}