import AdSlot from '@/components/ads/AdSlot'
import BaseLayout from './BaseLayout'
import { useAppSelector } from '@/store/hooks'
import { selectIsAdmin, selectIsMechanic, selectUser } from '@/store/authSlice'

export default function Layout({ children }: { children: React.ReactNode }) {
  const user       = useAppSelector(selectUser)
  const isAdmin    = useAppSelector(selectIsAdmin)
  const isMechanic = useAppSelector(selectIsMechanic)

  const navLinks = [
    { to: '/',          label: 'Find a Mechanic' },
    { to: '/pricing',   label: 'For Mechanics'   },
    { to: '/affiliate', label: '💸 Earn' },
    ...(isMechanic ? [{ to: '/dashboard', label: 'My Listing' }] : []),
    ...(isAdmin    ? [{ to: '/admin',     label: 'Admin'      }] : []),
    ...(!user             ? [{ to: '/signup',    label: 'Sign Up'    }] : []),
  ]

  return (
    <BaseLayout navLinks={navLinks}>
      {children}
      <AdSlot placement="global_footer" className="px-4 py-4 max-w-7xl mx-auto w-full" />
    </BaseLayout>
  )
}