'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, Shield, User } from 'lucide-react'
import { NotificationBell } from './notification-bell'

const navItems = [
  { href: '/dashboard', label: '仪表盘' },
  { href: '/clients', label: '客户' },
  { href: '/projects', label: '项目' },
  { href: '/collaborations', label: '合作' },
  { href: '/influencers', label: '红人' },
  { href: '/posts', label: 'Posts' },
  { href: '/payments', label: '付款' },
  { href: '/invoices', label: 'Invoice' },
  { href: '/admin/currencies', label: '币种管理' },
]

export function DashboardSidebar({ userId }: { userId?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="w-64 border-r bg-muted/40 flex flex-col sticky top-0 h-screen shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <Link href="/dashboard">
          <img src="/celepulse-logo.svg" alt="CelePulse" className="h-6 w-auto" />
        </Link>
        {userId && <NotificationBell userId={userId} />}
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
      <div className="p-3 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent transition-colors text-left">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  J
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">Jacob Guo</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span>Superadmin</span>
                </div>
              </div>
            </button>
          } />
          <DropdownMenuContent align="end" side="top" className="w-56">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  J
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Jacob Guo</div>
                <div className="text-xs text-muted-foreground">jacob@celepulse.com</div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
