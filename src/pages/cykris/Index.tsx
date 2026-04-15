import { Typography } from 'antd'

/** Overview page for the Cykris client. */
export function CykrisPage() {
  return (
    <div>
      <Typography.Title level={3}>Cykris</Typography.Title>
      <Typography.Paragraph type="secondary">
        High-level summary for Cykris helmet lines and brokerage activity.
      </Typography.Paragraph>
    </div>
  )
}

