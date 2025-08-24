import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { House, Motorcycle, ChefHat } from '@phosphor-icons/react'
import { USER_ROLES } from '@/lib/constants'

const roleConfig = {
  [USER_ROLES.CUSTOMER]: {
    path: '/customer',
    icon: House,
    labelAr: 'العملاء',
    labelEn: 'Customers'
  },
  [USER_ROLES.KITCHEN]: {
    path: '/kitchen',
    icon: ChefHat,
    labelAr: 'المطاعم',
    labelEn: 'Restaurants'
  },
  [USER_ROLES.DRIVER]: {
    path: '/driver',
    icon: Motorcycle,
    labelAr: 'السائقين',
    labelEn: 'Drivers'
  }
}

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const getCurrentRole = () => {
    const currentPath = location.pathname
    if (currentPath.startsWith('/kitchen')) return USER_ROLES.KITCHEN
    if (currentPath.startsWith('/driver')) return USER_ROLES.DRIVER
    return USER_ROLES.CUSTOMER
  }

  const currentRole = getCurrentRole()

  const handleRoleChange = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    if (config) {
      navigate(config.path)
    }
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-2">
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon
          const isActive = currentRole === role
          
          return (
            <Button
              key={role}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange(role)}
              className="flex items-center gap-2 btn-primary"
            >
              <Icon className="h-4 w-4" />
              <span className="arabic-text" lang="ar">{config.labelAr}</span>
            </Button>
          )
        })}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon
            const isActive = currentRole === role
            
            return (
              <Button
                key={role}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleRoleChange(role)}
                className="flex flex-col items-center gap-1 h-auto py-2 btn-primary"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs arabic-text" lang="ar">{config.labelAr}</span>
              </Button>
            )
          })}
        </div>
      </nav>
    </>
  )
}