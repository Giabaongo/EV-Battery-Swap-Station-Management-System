import { Card, CardContent, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { Check } from 'lucide-react'

const plans = [
  {
    name: "Pay-Per-Swap",
    description: "Perfect for occasional EV users",
    price: "$15",
    period: "per swap",
    features: [
      "No monthly commitment",
      "Standard battery quality",
      "Access to all stations",
      "Mobile app access",
      "24/7 customer support"
    ],
    buttonText: "Start Now",
    buttonVariant: "outline",
    popular: false
  },
  {
    name: "Monthly Subscription",
    description: "Ideal for regular commuters",
    price: "$99",
    period: "per month",
    features: [
      "Up to 10 swaps per month",
      "Premium battery quality",
      "Priority booking",
      "Advanced analytics",
      "24/7 priority support"
    ],
    buttonText: "Subscribe Now",
    buttonVariant: "default",
    popular: true
  },
  {
    name: "Business Plan",
    description: "For fleets and business use",
    price: "Custom",
    period: "pricing",
    features: [
      "Unlimited swaps",
      "Dedicated stations",
      "Fleet management tools",
      "API integration",
      "Dedicated account manager"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline",
    popular: false
  }
]

export default function PricingPlans() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Pricing and Service Packages
          </h2>
          <p className="text-lg text-gray-600">
            Choose the plan that works best for your EV charging needs
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-blue-700 shadow-xl scale-105' : 'border-gray-200 shadow-lg'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-700 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className={`text-center ${plan.popular ? 'bg-blue-700 text-white' : 'bg-white'} rounded-t-lg`}>
                <h3 className="text-2xl font-bold mb-2">
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600'} mb-4`}>
                  {plan.description}
                </p>
                <div className="text-4xl font-bold">
                  {plan.price}
                  <span className={`text-lg font-normal ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 bg-white">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-blue-700 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-700 hover:bg-blue-700 text-white' : ''}`}
                  variant={plan.buttonVariant}
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
