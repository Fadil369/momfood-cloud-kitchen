import { cn } from "@/lib/utils"

interface CalendarProps {
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3", className)}>
      {/* Placeholder calendar component - implement when react-day-picker is needed */}
      <div className="text-center text-muted-foreground">
        Calendar component placeholder
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }