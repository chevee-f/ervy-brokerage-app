import { Typography } from 'antd'

/** Dashboard landing page for the brokerage app. */
export function DashboardPage() {
  return (
    <div>
      <Typography.Title level={3}>Dashboard</Typography.Title>
      <Typography.Paragraph type="secondary">
        This is where high-level brokerage metrics and recent activity will appear.
      </Typography.Paragraph>
    </div>
  )
}

