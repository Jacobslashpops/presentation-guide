import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PlatformBadge } from '@/components/shared/platform-tag'
import { InfluencerProfileForm } from './profile-form'

export default async function InfluencerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: influencer } = await supabase
    .from('influencers')
    .select('*')
    .eq('email', user.email)
    .single()

  // If no profile, show registration form
  if (!influencer) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">注册红人档案</h1>
          <p className="text-muted-foreground">请填写您的基本信息以完成注册</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>注册后运营团队将审核并激活您的账号</CardDescription>
          </CardHeader>
          <CardContent>
            <InfluencerProfileForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show existing profile
  const initials = influencer.display_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">我的档案</h1>
        <p className="text-muted-foreground">查看和管理您的红人信息</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={influencer.avatar_url || undefined} alt={influencer.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{influencer.display_name}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{influencer.email}</p>
              <PlatformBadge platforms={influencer.platform} />
            </div>
          </div>
          <InfluencerProfileForm influencer={influencer} />
        </CardContent>
      </Card>
    </div>
  )
}
