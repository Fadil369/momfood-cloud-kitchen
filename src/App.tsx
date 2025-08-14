import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { House, Motorcycle, ChefHat } from '@phosphor-icons/react'
// Import main view components
import { CustomerView } from '@/components/customer/CustomerView.tsx'
import { KitchenView } from '@/components/kitchen/KitchenView.tsx'
import { DriverView } from '@/components/driver/DriverView.tsx'

type UserRole = 'customer' | 'kitchen' | 'driver'

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('customer')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2">
                <ChefHat className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MomFood</h1>
                <p className="text-sm text-muted-foreground">طعام الأم</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={currentRole === 'customer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentRole('customer')}
                className="flex items-center gap-2"
              >
                <House className="h-4 w-4" />
                <span className="hidden sm:inline">العملاء</span>
              </Button>
              <Button
                variant={currentRole === 'kitchen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentRole('kitchen')}
                className="flex items-center gap-2"
              >
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline">المطاعم</span>
              </Button>
              <Button
                variant={currentRole === 'driver' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentRole('driver')}
                className="flex items-center gap-2"
              >
                <Motorcycle className="h-4 w-4" />
                <span className="hidden sm:inline">السائقين</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {currentRole === 'customer' && <CustomerView />}
        {currentRole === 'kitchen' && <KitchenView />}
        {currentRole === 'driver' && <DriverView />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden">
        <div className="flex items-center justify-around py-2">
          <Button
            variant={currentRole === 'customer' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentRole('customer')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <House className="h-5 w-5" />
            <span className="text-xs">العملاء</span>
          </Button>
          <Button
            variant={currentRole === 'kitchen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentRole('kitchen')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <ChefHat className="h-5 w-5" />
            <span className="text-xs">المطاعم</span>
          </Button>
          <Button
            variant={currentRole === 'driver' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentRole('driver')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Motorcycle className="h-5 w-5" />
            <span className="text-xs">السائقين</span>
          </Button>
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 md:hidden" />
    </div>
  )
}

export default App