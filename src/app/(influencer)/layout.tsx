import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function InfluencerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error('Auth check failed:', e)
  }

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-64 border-r bg-muted/40 p-4">
        <div className="mb-4">
          <img src="/celepulse-logo.svg" alt="CelePulse" className="h-6 w-auto" />
        </div>
        <nav className="space-y-2">
          <a href="/i/dashboard" className="block px-3 py-2 rounded-md hover:bg-accent">仪表盘</a>
          <a href="/i/collaborations" className="block px-3 py-2 rounded-md hover:bg-accent">我的合作</a>
          <a href="/i/invoices" className="block px-3 py-2 rounded-md hover:bg-accent">Invoice</a>
          <a href="/i/companies" className="block px-3 py-2 rounded-md hover:bg-accent">付款方</a>
          <a href="/i/bank-accounts" className="block px-3 py-2 rounded-md hover:bg-accent">银行账户</a>
          <a href="/i/profile" className="block px-3 py-2 rounded-md hover:bg-accent">我的档案</a>
        </nav>
      </div>
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
