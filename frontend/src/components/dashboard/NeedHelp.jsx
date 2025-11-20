import { Card, CardContent, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { Phone, HelpCircle, MessageSquare, Headphones } from "lucide-react"

const helpOptions = [
  {
    icon: Phone,
    title: "Contact Support",
    description: "Get immediate help from our support team",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
    textColor: "text-blue-700"
  }
]

export default function NeedHelp() {
  return (
    <Card className="bg-white shadow-lg border border-gray-200">
      <CardHeader className="bg-blue-800 text-white rounded-lg pt-2">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5" />
          <h2 className="text-lg font-bold">Need Help?</h2>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {helpOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <Button
                key={index}
                variant="ghost"
                className={`w-full justify-start text-left p-4 h-auto bg-gray-200 hover:bg-indigo-300 shadow-lg border border-gray-200`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm text-indigo-800`}>{option.title}</p>
                    <p className="text-gray-600 text-xs">{option.description}</p>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}