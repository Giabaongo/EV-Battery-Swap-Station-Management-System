const stats = [
  {
    number: "500+",
    label: "Battery Swaps Completed"
  },
  {
    number: "3 min",
    label: "Average Swap Time"
  },
  {
    number: "98%",
    label: "Customer Satisfaction"
  },
  {
    number: "50+",
    label: "Stations Nationwide"
  }
]

export default function Statistics() {
  return (
    <section className="bg-blue-700 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Our Impact by the Numbers
          </h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center text-white">
              <div className="text-4xl lg:text-5xl font-bold mb-2">
                {stat.number}
              </div>
              <div className="text-lg text-blue-100">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
