import { Card, CardContent } from "../ui/card"
import { Star, User } from 'lucide-react'

const testimonials = [
  {
    rating: 5,
    text: "PowerSwap has completely changed how I use my EV. No more range anxiety or waiting hours to charge. I'm in and out in minutes!",
    author: "Sarah L.",
    role: "Daily Commuter"
  },
  {
    rating: 5,
    text: "As a full-time driver, minimizing downtime is crucial. The subscription plan saves me money and the quick swaps keep me earning.",
    author: "Michael T.",
    role: "Rideshare Driver"
  },
  {
    rating: 5,
    text: "Managing a fleet of 15 EVs became so much easier with PowerSwap. The dashboard gives me all the insights I need in one place.",
    author: "Elena K.",
    role: "Business Fleet Manager"
  }
]

export default function CustomerTestimonials() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Join thousands of satisfied EV owners who've made the switch to battery swapping
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-lg">
              <CardContent className="p-6">
                {/* Star Rating */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <p className="text-gray-700 italic mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                
                {/* Author Info */}
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <User className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
