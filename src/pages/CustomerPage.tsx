import { CustomerView } from '@/components/customer/CustomerView'
import { PageErrorBoundary } from '@/components/common/ErrorBoundary'

export function CustomerPage() {
  return (
    <PageErrorBoundary language="ar">
      <CustomerView />
    </PageErrorBoundary>
  )
}