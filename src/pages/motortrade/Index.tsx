import { useMemo, useState } from 'react'
import { Button, Card, Checkbox, Input, Space, Table, Typography } from 'antd'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import styles from './Index.module.scss'

/** Overview page for the Motortrade client. */
export function MotortradePage() {
  const recent = useQuery(api.motortradeWaybills.listRecent, { limit: 10 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [printOptions, setPrintOptions] = useState({
    ttc: false,
    customer: false,
    carrier: false,
  })

  type SavedWaybill = {
    _id: string
    deliveryFrom: string
    deliveryTo: string
    waybillNo: string
    kmpcDrNo: string
    items: Array<{
      model: string
      qty: number | null
      color: string
      frame: string
      engine: string
    }>
  }

  const recentWaybills = useMemo(() => (recent ?? []) as SavedWaybill[], [recent])

  const filteredWaybills = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return recentWaybills.filter((row) => {
      const isAssigned = Boolean(row.waybillNo?.trim())
      if (statusFilter === 'assigned' && !isAssigned) return false
      if (statusFilter === 'unassigned' && isAssigned) return false

      if (!q) return true
      return (
        row.waybillNo.toLowerCase().includes(q) ||
        row.kmpcDrNo.toLowerCase().includes(q) ||
        row.deliveryFrom.toLowerCase().includes(q) ||
        row.deliveryTo.toLowerCase().includes(q)
      )
    })
  }, [recentWaybills, searchTerm, statusFilter])

  const assignedCount = useMemo(
    () => filteredWaybills.filter((r) => Boolean(r.waybillNo?.trim())).length,
    [filteredWaybills]
  )
  const selected = useMemo(
    () => recentWaybills.find((r) => r._id === selectedId) ?? null,
    [recentWaybills, selectedId]
  )

  const cloneHeadStyles = () => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('')
  }

  const handlePrintViewer = (idx: string, type: 'all' | 'ttc' | 'customer' | 'carrier') => {
    const content = document.getElementById(`viewer-content-${idx}`) ?? new HTMLElement()
    const getPrintHtml = (label: string) => {
      return `
        <div style='position: relative; padding-bottom: 20px; font-size: 12px;'>
          ${content.outerHTML}
          <div style='position: absolute; right: 200px; font-size: 14px; font-weight: bold;'>
            <span>${label}</span>
          </div>
        </div>
      `
    }

    const printWindow = window.open('', '', 'width=920,height=650') ?? new Window()
    const printStyle = `
      ${cloneHeadStyles()}
      <style>
        @page { size: legal; }
        @media print { .no-print { display: none; } }
      </style>
    `

    const pageBreak = `<div style="page-break-after: always; break-after: page;"></div>`
    let printHtml = ''

    if (type === 'all') {
      printHtml += getPrintHtml('TTC COPY')
      printHtml += pageBreak
      printHtml += getPrintHtml('CUSTOMER COPY')
      printHtml += pageBreak
      printHtml += getPrintHtml('CARRIER COPY')
    } else {
      const label =
        type === 'ttc' ? 'TTC COPY' : type === 'customer' ? 'CUSTOMER COPY' : 'CARRIER COPY'
      printHtml = getPrintHtml(label)
    }

    printWindow.document.write(
      '<html><head><title>Print Viewer</title>' +
        printStyle +
        '</head><body>' +
        printHtml +
        '</body></html>'
    )
    printWindow.document.close()
    // printWindow.print()
  }

  const handlePrintSelected = () => {
    if (!selectedId) return
    const selectedTypes = (['ttc', 'customer', 'carrier'] as const).filter((k) => printOptions[k])
    if (selectedTypes.length === 0) return
    if (selectedTypes.length === 3) {
      handlePrintViewer(selectedId, 'all')
      return
    }

    // Print chosen copies, each starting on a new page.
    const content = document.getElementById(`viewer-content-${selectedId}`) ?? new HTMLElement()
    const getPrintHtml = (label: string) => {
      return `
        <div style='position: relative; padding-bottom: 20px; font-size: 12px;'>
          ${content.outerHTML}
          <div style='position: absolute; right: 200px; font-size: 14px; font-weight: bold;'>
            <span>${label}</span>
          </div>
        </div>
      `
    }
    const labelFor = (t: (typeof selectedTypes)[number]) =>
      t === 'ttc' ? 'TTC COPY' : t === 'customer' ? 'CUSTOMER COPY' : 'CARRIER COPY'
    const pageBreak = `<div style="page-break-after: always; break-after: page;"></div>`

    const printWindow = window.open('', '', 'width=920,height=650') ?? new Window()
    const printStyle = `
      ${cloneHeadStyles()}
      <style>
        @page { size: legal; }
        @media print { .no-print { display: none; } }
      </style>
    `

    let html = ''
    selectedTypes.forEach((t, i) => {
      html += getPrintHtml(labelFor(t))
      if (i < selectedTypes.length - 1) html += pageBreak
    })

    printWindow.document.write(
      '<html><head><title>Print Viewer</title>' + printStyle + '</head><body>' + html + '</body></html>'
    )
    printWindow.document.close()
    // printWindow.print()
  }

  return (
    <div className={styles.page}>
      <Typography.Title level={3}>Motortrade</Typography.Title>
      <Typography.Paragraph type="secondary">
        High-level summary for Motortrade motorcycle and parts brokerage activity.
      </Typography.Paragraph>

      <div className={styles.layout}>
        {/* Left: recent saves list */}
        <div className={styles.leftPane}>
          <div className={styles.leftHeader}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Recent waybills
            </Typography.Title>
            <Typography.Text type="secondary">
              {assignedCount} / {filteredWaybills.length} assigned
            </Typography.Text>
          </div>

          <div className={styles.list}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space direction="vertical" className={styles.controls} style={{ width: '100%' }}>
                <Input
                  placeholder="Search waybills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />
                <Space size={4} wrap className={styles.filters}>
                  <Button
                    size="small"
                    type={statusFilter === 'all' ? 'primary' : 'default'}
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    size="small"
                    type={statusFilter === 'assigned' ? 'primary' : 'default'}
                    onClick={() => setStatusFilter('assigned')}
                  >
                    Assigned
                  </Button>
                  <Button
                    size="small"
                    type={statusFilter === 'unassigned' ? 'primary' : 'default'}
                    onClick={() => setStatusFilter('unassigned')}
                  >
                    Unassigned
                  </Button>
                </Space>
              </Space>

              {filteredWaybills.map((row) => {
                const isSelected = row._id === selectedId
                return (
                  <button
                    key={row._id}
                    type="button"
                    onClick={() => setSelectedId(row._id)}
                    className={[
                      styles.listItem,
                      isSelected ? styles.listItemSelected : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div>
                      <Typography.Text strong>{row.waybillNo || '(no waybill no)'}</Typography.Text>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row.kmpcDrNo || ''}
                    </Typography.Text>
                  </button>
                )
              })}
            </Space>
          </div>
        </div>

        {/* Right: selected details */}
        <div className={styles.rightPane}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Details
          </Typography.Title>

          {!selected ? (
            <Typography.Paragraph type="secondary">
              Select a waybill on the left to view its details.
            </Typography.Paragraph>
          ) : (
            <>
              <Card size="small" style={{ marginBottom: 12 }}>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailsRow}>
                    <Typography.Text type="secondary">Waybill No</Typography.Text>
                    <Typography.Text>{selected.waybillNo}</Typography.Text>
                  </div>
                  <div className={styles.detailsRow}>
                    <Typography.Text type="secondary">KMPC DR No.</Typography.Text>
                    <Typography.Text>{selected.kmpcDrNo}</Typography.Text>
                  </div>
                  <div className={styles.detailsRow}>
                    <Typography.Text type="secondary">Delivery From</Typography.Text>
                    <Typography.Text>{selected.deliveryFrom}</Typography.Text>
                  </div>
                  <div className={styles.detailsRow}>
                    <Typography.Text type="secondary">Delivery To</Typography.Text>
                    <Typography.Text>{selected.deliveryTo}</Typography.Text>
                  </div>
                </div>
              </Card>

              <Card size="small" style={{ marginBottom: 12 }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Print Options
                </Typography.Text>
                <Space direction="vertical" style={{ marginTop: 8 }}>
                  <Checkbox
                    checked={printOptions.ttc}
                    onChange={(e) => setPrintOptions((p) => ({ ...p, ttc: e.target.checked }))}
                  >
                    TTC Copy
                  </Checkbox>
                  <Checkbox
                    checked={printOptions.customer}
                    onChange={(e) =>
                      setPrintOptions((p) => ({ ...p, customer: e.target.checked }))
                    }
                  >
                    Customer&apos;s Copy
                  </Checkbox>
                  <Checkbox
                    checked={printOptions.carrier}
                    onChange={(e) =>
                      setPrintOptions((p) => ({ ...p, carrier: e.target.checked }))
                    }
                  >
                    Carrier Copy
                  </Checkbox>
                </Space>

                <Space style={{ marginTop: 12 }}>
                  <Button
                    disabled={!printOptions.ttc && !printOptions.customer && !printOptions.carrier}
                    onClick={handlePrintSelected}
                  >
                    Print
                  </Button>
                  <Button
                    type="primary"
                    disabled={!selectedId}
                    onClick={() => selectedId && handlePrintViewer(selectedId, 'all')}
                  >
                    Print All
                  </Button>
                </Space>
              </Card>

              <Typography.Title level={5} style={{ marginTop: 0 }}>
                Items
              </Typography.Title>
              <Table
                size="small"
                pagination={false}
                rowKey={(_, index) => String(index)}
                dataSource={selected.items ?? []}
                columns={[
                  { title: 'Model', dataIndex: 'model', key: 'model' },
                  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80 },
                  { title: 'Color', dataIndex: 'color', key: 'color' },
                  { title: 'Frame', dataIndex: 'frame', key: 'frame' },
                  { title: 'Engine', dataIndex: 'engine', key: 'engine' },
                ]}
              />
            </>
          )}
        </div>
      </div>

      {/* Printable DOM block for printing selected record */}
      {selected && selectedId && (
        <div className={styles.printableDiv} id={`viewer-content-${selectedId}`}>
          <div style={{ textAlign: 'center' }}>ERVY LOGISTICS</div>
          <div style={{ textAlign: 'center' }}>PRK BANAWAG TAWAGAN NORTE, LABANGAN ZAMBOANGA DEL SUR</div>
          <div style={{ textAlign: 'center' }}>Cp. # 09451659947 / 09451098670</div>
          <div style={{ textAlign: 'center' }}>DELIVERY RECEIPT</div>
        
          <div style={{ display: 'flex', justifyContent: 'space-between', marginRight: '50px'  }}>
            <div>
              <div style={{ display: 'flex' }}>
                <div style={{ marginRight: '13px' }}>Delivery From:</div>
                <div>{selected.deliveryFrom}</div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ marginRight: '32px' }}>Delivery To:</div>
                <div>{selected.deliveryTo}</div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 180 }}>
                <div>WAYBILL NO.</div>
                <div>{selected.waybillNo}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 180 }}>
                <div>KMPC DR No.</div>
                <div>{selected.kmpcDrNo}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div>Address: </div>
            <div style={{ width: '100%', borderBottomWidth: '1px', borderBottom: '1px solid black', marginLeft: '50px', marginRight: '50px' }}></div>
          </div>
          <div style={{ marginTop: '50px' }}>
            <table className={styles.printableTable}>
              <thead>
                <tr>
                  <th>MODEL</th>
                  <th>QTY</th>
                  <th>COLOR</th>
                  <th>FRAME</th>
                  <th>ENGINE</th>
                  <th>REMARKS</th>
                  <th>DEALER RECEIVER BY:</th>
                </tr>
              </thead>
              <tbody>
                {(selected.items ?? []).map((it, i) => (
                  <tr key={i}>
                    <td>{it.model}</td>
                    <td>{it.qty ?? ''}</td>
                    <td>{it.color}</td>
                    <td>{it.frame}</td>
                    <td>{it.engine}</td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', marginBottom: '50px' }}> {/* footer */}
          <div>
            <div style={{ display: 'flex' }}>
              <div>Trucking Name:</div>
              <div style={{ width: '180px', borderBottomWidth: '1px', borderBottom: '1px solid black'}}></div>
            </div>
            <div style={{ display: 'flex' }}>
              <div>Date and Time:</div>
              <div style={{ width: '180px', borderBottomWidth: '1px', borderBottom: '1px solid black'}}></div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '330px' }}>
              <div>TRUCK PLATE NO.:</div>
              <div style={{ width: '180px', borderBottomWidth: '1px', borderBottom: '1px solid black'}}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '330px' }}>
              <div>DRIVER NAME:</div>
              <div style={{ width: '180px', borderBottomWidth: '1px', borderBottom: '1px solid black'}}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '330px' }}>
              <div>HELPER NAME:</div>
              <div style={{ width: '180px', borderBottomWidth: '1px', borderBottom: '1px solid black'}}></div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '12px' }}>NOTE: THIS COMPANY IS NOT RESPONSIBLE FOR THE CONTENT OF ANY PACKAGES DELIVERED IN APPARENT GOOD ORDER</div>
        <div style={{ textAlign: 'center', fontSize: '12px' }}>ANY DELAY TO THE TRUCK VERIFY THE CONTENT OF EACH PACKAGES WILL BE AT YOUR EXPENSES.</div>
        </div>
      )}
    </div>
  )
}

