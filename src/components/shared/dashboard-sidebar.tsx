'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: '仪表盘' },
  { href: '/clients', label: '客户' },
  { href: '/projects', label: '项目' },
  { href: '/collaborations', label: '合作' },
  { href: '/influencers', label: '红人' },
  { href: '/payments', label: '付款' },
  { href: '/invoices', label: 'Invoice' },
  { href: '/admin/currencies', label: '币种管理' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="w-64 border-r bg-muted/40 flex flex-col">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="font-semibold text-lg">
          CelePulse
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          退出登录
        </Button>
      </div>
    </div>
  )
}
