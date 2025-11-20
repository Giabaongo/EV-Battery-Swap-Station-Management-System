import React from 'react'
import PlanCard from './PlanCard'

export default function PlansList({ plans, onSubscribe, loading }) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const plansPerPage = 3
  
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No plans available at the moment.</p>
      </div>
    )
  }

  const totalPages = Math.ceil(plans.length / plansPerPage)
  const startIndex = (currentPage - 1) * plansPerPage
  const endIndex = startIndex + plansPerPage
  const currentPlans = plans.slice(startIndex, endIndex)

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  return (
    <div>
      <div className="grid lg:grid-cols-3 gap-6">
        {currentPlans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            subscribed={false}
            onSubscribe={onSubscribe}
            loading={loading}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
                className={`h-10 w-10 rounded-lg font-medium transition-colors ${
                  currentPage === idx + 1
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
