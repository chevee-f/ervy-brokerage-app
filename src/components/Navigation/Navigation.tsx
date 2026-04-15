import { ApiOutlined, CarOutlined, DashboardOutlined, SafetyCertificateOutlined, ShopOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Layout } from 'antd'
import styles from './Navigation.module.scss'

export type NavigationProps = {
  /** Whether the sidebar is collapsed (icons only). */
  isCollapsed: boolean
  /** Currently active route key (e.g. "dashboard", "trimotors/waybill"). */
  activeKey: string
  /** Called when the user chooses a new navigation target. */
  onNavigate: (key: string) => void
}

type NavChild = {
  key: string
  label: string
}

type NavCompany = {
  key: string
  label: string
  icon: ReactNode
  children?: NavChild[]
}

const NAV_ITEMS: NavCompany[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardOutlined />,
  },
  {
    key: 'gardenia',
    label: 'Gardenia',
    icon: <ShopOutlined />,
  },
  {
    key: 'trimotors',
    label: 'Trimotors',
    icon: <ApiOutlined />,
    children: [
      { key: 'trimotors/waybill', label: 'Waybill' },
      { key: 'trimotors/billing', label: 'Billing' },
    ],
  },
  {
    key: 'cykris',
    label: 'Cykris',
    icon: <SafetyCertificateOutlined />,
    children: [
      { key: 'cykris/waybill', label: 'Waybill' },
      { key: 'cykris/billing', label: 'Billing' },
    ],
  },
  {
    key: 'motortrade',
    label: 'Motortrade',
    icon: <CarOutlined />,
    children: [
      { key: 'motortrade/waybill', label: 'Waybill' },
      { key: 'motortrade/billing', label: 'Billing' },
    ],
  },
]

/** App navigation sidebar with custom HTML layout. */
export function Navigation({ isCollapsed, activeKey, onNavigate }: NavigationProps) {
  const handleNavigate = (key: string) => {
    onNavigate(key)
  }

  if (isCollapsed) {
    return (
      <Layout.Sider
        width={72}
        theme="light"
        collapsible
        collapsed
        collapsedWidth={72}
        trigger={null}
        breakpoint="lg"
      >
        <nav className={styles.navRootCollapsed} aria-label="Primary navigation (collapsed)">
          {NAV_ITEMS.map((company) => (
            <button
              key={company.key}
              type="button"
              className={`${styles.iconOnlyItem} ${
                activeKey === company.key ? styles.iconOnlyItemActive : ''
              }`}
              onClick={() => handleNavigate(company.key)}
            >
              {company.icon}
            </button>
          ))}
        </nav>
      </Layout.Sider>
    )
  }

  return (
    <Layout.Sider
      width={180}
      theme="light"
      collapsible
      collapsed={false}
      collapsedWidth={72}
      trigger={null}
      breakpoint="lg"
    >
      <nav className={styles.navRoot} aria-label="Primary navigation">
        {NAV_ITEMS.map((company) => (
          <div key={company.key} className={styles.group}>
            <button
              type="button"
              className={`${styles.companyRow} ${
                activeKey === company.key ? styles.companyRowActive : ''
              }`}
              onClick={() => handleNavigate(company.key)}
            >
              <span className={styles.companyIcon}>{company.icon}</span>
              <span className={styles.companyLabel}>{company.label}</span>
            </button>

            {company.children && (
              <div className={styles.childrenRow}>
                {company.children.map((child) => (
                  <button
                    key={child.key}
                    type="button"
                    className={`${styles.childLink} ${
                      activeKey === child.key ? styles.childLinkActive : ''
                    }`}
                    onClick={() => handleNavigate(child.key)}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </Layout.Sider>
  )
}