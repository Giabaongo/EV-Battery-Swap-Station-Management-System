import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "../../lib/utils"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]
const CHART_STYLES = `
  --chart-1: 12 76% 61%;
  --chart-2: 160 84% 39%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 85% 56%;
  --chart-5: 26 83% 67%;
`

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

const ChartContainer = React.forwardRef(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId()
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          id={chartId}
          className={cn("w-full h-[300px]", className)}
          {...props}
          style={{
            ...props.style,
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
                #${chartId} {
                  ${CHART_STYLES}
                }
              `,
            }}
          />
          {children}
        </div>
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  const cssVariables = Object.entries(config).reduce((acc, [key, value]) => {
    if (value.color) {
      acc += `--color-${key}: ${value.color};`
    }
    return acc
  }, "")

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          #${chartId} {
            ${cssVariables}
          }
        `,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef(
  ({ active, payload, label, labelFormatter, formatter, color, nameKey, hideLabel }, ref) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className="rounded-lg border border-border bg-background p-2 shadow-md"
      >
        {!hideLabel && label && (
          <div className="text-sm font-medium text-foreground">
            {labelFormatter ? labelFormatter(label) : label}
          </div>
        )}
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center gap-2 text-sm"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color || color }}
              />
              <span className="text-xs text-muted-foreground">
                {nameKey ? item.payload[nameKey] : item.name}
              </span>
              <span className="font-medium text-foreground">
                {formatter ? formatter(item.value) : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

// Re-export recharts components
const ChartBarChart = RechartsPrimitive.BarChart
const ChartLineChart = RechartsPrimitive.LineChart
const ChartPieChart = RechartsPrimitive.PieChart
const ChartPie = RechartsPrimitive.Pie
const ChartCell = RechartsPrimitive.Cell
const ChartLine = RechartsPrimitive.Line
const ChartBar = RechartsPrimitive.Bar
const ChartXAxis = RechartsPrimitive.XAxis
const ChartYAxis = RechartsPrimitive.YAxis
const ChartCartesianGrid = RechartsPrimitive.CartesianGrid
const ChartLegend = RechartsPrimitive.Legend
const ChartResponsiveContainer = RechartsPrimitive.ResponsiveContainer
const ChartLabelList = RechartsPrimitive.LabelList

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartBarChart,
  ChartLineChart,
  ChartPieChart,
  ChartPie,
  ChartCell,
  ChartLine,
  ChartBar,
  ChartXAxis,
  ChartYAxis,
  ChartCartesianGrid,
  ChartLegend,
  ChartResponsiveContainer,
  ChartLabelList,
  useChart,
  COLORS,
}
