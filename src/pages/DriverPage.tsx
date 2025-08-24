import { DriverView } from '@/components/driver/DriverView'
import { PageErrorBoundary } from '@/components/common/ErrorBoundary'

export function DriverPage() {
  return (
    <PageErrorBoundary language="ar">
      <DriverView />
    </PageErrorBoundary>
  )
}