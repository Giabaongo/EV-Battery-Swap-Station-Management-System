import { Button } from "../ui/button"

export default function PlanCard({ plan, onSubscribe, subscribed, loading }) {
  const inUse = Boolean(subscribed)

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 h-full flex flex-col">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-800 truncate">{plan.name}</h3>
            </div>
            <p className="text-sm text-gray-600">{plan.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{plan.price}</div>
            <div className="text-sm text-gray-500">{plan.period}</div>
          </div>
        </div>
        {inUse && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700 mt-3">
            Active subscription
          </span>
        )}
        <ul className="mt-4 space-y-2">
          {plan.features.map((f, i) => (
            <li key={i} className="text-sm text-gray-600">• {f}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <Button 
          className="w-full" 
          onClick={() => onSubscribe(plan)} 
          disabled={loading || inUse}
          variant={inUse ? "outline" : "default"}
        >
          {inUse ? 'Subscribed' : 'Subscribe'}
        </Button>
      </div>
    </div>
  )
}