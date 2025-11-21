import { User, MapPin, Calendar, Battery } from 'lucide-react';

const steps = [
  {
    icon: User,
    title: "Register",
    description: "Create an account via our mobile app or website"
  },
  {
    icon: MapPin,
    title: "Select Station",
    description: "Find and choose the most convenient station for you"
  },
  {
    icon: Calendar,
    title: "Book Swap Slot",
    description: "Reserve your slot through the app in seconds"
  },
  {
    icon: Battery,
    title: "Receive New Battery",
    description: "Arrive at the station and get your fresh battery"
  }
]

export default function QuickStartGuide() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Quick Start Guide
          </h2>
          <p className="text-lg text-gray-600">
            Getting started with our battery swap service is simple and straightforward
          </p>
        </div>
        
        {/* Steps Grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
            <div key={index} className="text-center">
              {/* Icon Circle */}
              <div className="w-20 h-20 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-10 h-10 text-white" />
              </div>
              
              {/* Step Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              
              {/* Step Description */}
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
            );
          })}
        </div>
      </div>

      {/* Full-width Image Below */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-16">
        <img 
          src="/images/swap.jpg" 
          alt="Battery Swap Process" 
          className="w-full h-auto object-cover"
        />
      </div>
    </section>
  )
}
