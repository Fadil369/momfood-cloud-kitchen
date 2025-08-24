import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ChefHat } from '@phosphor-icons/react'
import { Navigation } from '@/components/layout/Navigation'
import { CustomerPage } from '@/pages/CustomerPage'
import { KitchenPage } from '@/pages/KitchenPage'
import { DriverPage } from '@/pages/DriverPage'
import { RestaurantDetailPage } from '@/pages/RestaurantDetailPage'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2">
                <ChefHat className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground font-display">MomFood</h1>
                <p className="text-sm text-muted-foreground arabic-text" lang="ar">لقمه يمه</p>
              </div>
            </div>

            <Navigation />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <Navigation />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/customer" element={
          <AppLayout>
            <CustomerPage />
          </AppLayout>
        } />
        <Route path="/kitchen" element={
          <AppLayout>
            <KitchenPage />
          </AppLayout>
        } />
        <Route path="/driver" element={
          <AppLayout>
            <DriverPage />
          </AppLayout>
        } />
        <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
        <Route path="/" element={<Navigate to="/customer" replace />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
