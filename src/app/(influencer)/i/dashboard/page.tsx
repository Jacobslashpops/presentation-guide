export default function InfluencerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">我的仪表盘</h1>
        <p className="text-muted-foreground">管理您的合作、Invoice 和收款</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">-</div>
          <p className="text-sm text-muted-foreground">进行中的合作</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">-</div>
          <p className="text-sm text-muted-foreground">待收款金额</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">-</div>
          <p className="text-sm text-muted-foreground">已收款总额</p>
        </div>
      </div>
    </div>
  )
}
