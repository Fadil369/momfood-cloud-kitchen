import { KitchenView } from '@/components/kitchen/KitchenView'
import { PageErrorBoundary } from '@/components/common/ErrorBoundary'

export function KitchenPage() {
  return (
    <PageErrorBoundary language="ar">
      <KitchenView />
    </PageErrorBoundary>
  )
}