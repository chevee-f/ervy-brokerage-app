import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Layout, Space, Typography } from 'antd'
import { DollarOutlined, HomeOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import styles from './App.module.scss'
import { Navigation } from './components/Navigation/Navigation'
import { DashboardPage } from './pages/Dashboard'
import { GardeniaPage } from './pages/Gardenia'
import { TrimotorsPage } from './pages/trimotors/Index'
import { TrimotorsWaybillPage } from './pages/trimotors/Waybill'
import { TrimotorsBillingPage } from './pages/trimotors/Billing'
import { CykrisPage } from './pages/cykris/Index'
import { CykrisWaybillPage } from './pages/cykris/Waybill'
import { CykrisBillingPage } from './pages/cykris/Billing'
import { MotortradePage } from './pages/motortrade/Index'
import { MotortradeWaybillPage } from './pages/motortrade/Waybill'
import { MotortradeBillingPage } from './pages/motortrade/Billing'

/** Root app shell layout and page routing. */
function App() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const pathKey = location.pathname === '/' ? 'dashboard' : location.pathname.replace(/^\//, '')

  const renderActivePage = () => {
    switch (pathKey) {
      case 'dashboard':
        return <DashboardPage />
      case 'gardenia':
        return <GardeniaPage />
      case 'trimotors':
        return <TrimotorsPage />
      case 'trimotors/waybill':
        return <TrimotorsWaybillPage />
      case 'trimotors/billing':
        return <TrimotorsBillingPage />
      case 'cykris':
        return <CykrisPage />
      case 'cykris/waybill':
        return <CykrisWaybillPage />
      case 'cykris/billing':
        return <CykrisBillingPage />
      case 'motortrade':
        return <MotortradePage />
      case 'motortrade/waybill':
        return <MotortradeWaybillPage />
      case 'motortrade/billing':
        return <MotortradeBillingPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <Layout className={styles.appShell}>
      <Layout.Header className={styles.header}>
        <Space size={10}>
          <span className={styles.brandMark} aria-hidden />
          <Typography.Title level={4} className={styles.brandTitle}>
            Ervy Brokerage
          </Typography.Title>
        </Space>
        <Space>
          <Button icon={<HomeOutlined />} type="text">
            Dashboard
          </Button>
          <Button icon={<DollarOutlined />} type="primary">
            New quote
          </Button>
        </Space>
      </Layout.Header>

      <Layout>
        <Navigation
          isCollapsed={isNavCollapsed}
          activeKey={pathKey}
          onNavigate={(key) => navigate(key === 'dashboard' ? '/' : `/${key}`)}
        />

        <div className={styles.collapseButton}>
          <Button
            type="text"
            size="small"
            aria-label={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            icon={isNavCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setIsNavCollapsed((current) => !current)}
          />
        </div>

        <Layout.Content className={styles.content}>
          <div className={styles.container}>{renderActivePage()}</div>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

export default App
