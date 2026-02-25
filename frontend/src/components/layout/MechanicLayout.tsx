import AdSlot     from '@/components/ads/AdSlot'
import BaseLayout  from './BaseLayout'

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  const navLinks = [
    { to: '/',          label: 'Find a Mechanic', match: undefined   },
    { to: '/search',    label: 'Search',          match: '/search'   },
    { to: '/dashboard', label: 'My Listing',      match: '/dashboard'},
    { to: '/pricing',   label: 'Plans',           match: '/pricing'  },
  ]

  return (
    <BaseLayout navLinks={navLinks}>
      {children}
      <AdSlot placement="global_footer" className="px-4 py-4 max-w-7xl mx-auto w-full" />
    </BaseLayout>
  )
}