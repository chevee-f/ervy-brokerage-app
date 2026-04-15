import { useMemo, useState } from 'react'
import type { UploadFile, UploadProps } from 'antd'
import { Button, Card, Checkbox, Input, Space, Spin, Typography, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import styles from './Waybill.module.scss'

/** Converts header labels like "REF NO." into snake_case variable-style names (e.g. "ref_no"). */
function headerLabelToKey(label: unknown): string {
  if (typeof label !== 'string') return ''
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // collapse non-alphanumerics to underscores
    .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
}

/** Derives a grouping key from a ref_no, using the numeric suffix in parentheses when present. */
function getGroupKeyFromRef(ref: string): string {
  const match = ref.match(/\((\d+)\)\s*$/)
  if (match) return match[1]
  return ref
}

/** Trimotors waybill workspace with XLSX upload and preview table. */
export function TrimotorsWaybillPage() {
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const [assignedBillNoByGroupKey, setAssignedBillNoByGroupKey] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [housewayBillNo, setHousewayBillNo] = useState<string>('')
  const [printOptions, setPrintOptions] = useState({
    ttc: false,
    customer: false,
    carrier: false,
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const groupedWaybills = useMemo(() => {
    type Item = { row: Record<string, unknown>; index: number; refNo: string; groupKey: string; isAssigned: boolean }
    const trimmedSearch = searchTerm.trim().toLowerCase()

    const items: Item[] = rawData
      .map((row, index) => {
        const refNoValue = row.ref_no
        const refNo =
          typeof refNoValue === 'string'
            ? refNoValue
            : refNoValue != null
            ? String(refNoValue)
            : `Ref #${index + 1}`
        const groupKey = getGroupKeyFromRef(refNo)
        const isAssigned = Boolean(assignedBillNoByGroupKey[groupKey])
        return { row, index, refNo, groupKey, isAssigned }
      })
      .filter((item) => {
        if (statusFilter === 'assigned' && !item.isAssigned) return false
        if (statusFilter === 'unassigned' && item.isAssigned) return false
        if (!trimmedSearch) return true
        return item.refNo.toLowerCase().includes(trimmedSearch)
      })

    const groupsOrder: string[] = []
    const groupsMap: Record<
      string,
      { groupKey: string; items: Item[] }
    > = {}

    for (const item of items) {
      if (!groupsMap[item.groupKey]) {
        groupsMap[item.groupKey] = { groupKey: item.groupKey, items: [] }
        groupsOrder.push(item.groupKey)
      }
      groupsMap[item.groupKey].items.push(item)
    }

    const groups = groupsOrder.map((key) => groupsMap[key])

    const assignedCount = groups.reduce(
      (sum, group) => (assignedBillNoByGroupKey[group.groupKey] ? sum + group.items.length : sum),
      0
    )

    return { groups, assignedCount }
  }, [rawData, assignedBillNoByGroupKey, searchTerm, statusFilter])

  const handleFile: UploadProps['beforeUpload'] = async (file) => {
    setIsUploading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null })

      // Ignore the first 3 rows and last 4 rows of the sheet.
      const trimmed = json.slice(3, Math.max(json.length - 4, 3))

      // Use the first remaining row as the header row to build variable-style keys,
      // then map subsequent rows to objects keyed by those names.
      const headerRowValues = trimmed[0] ? Object.values(trimmed[0]) : []
      const headerKeys = headerRowValues.map((label) => headerLabelToKey(label))

      // REMOVE THIS COMMENT: assign headers coming from xlsx and update the json to get thsoe keys and have values as the table data
      // remove eslint for this one
      const mappedRows =
        trimmed.length > 1
          ? trimmed.slice(1).map((row) => {
              const values = Object.values(row)
              const result: Record<string, unknown> = {}

              headerKeys.forEach((key, index) => {
                if (!key) return
                result[key] = values[index]
              })

              return result
            })
          : []

      setRawData(mappedRows)
      // Temporary debug output until we wire this into a proper table/workflow.
      // eslint-disable-next-line no-console
      console.log('Trimotors waybill XLSX data (mapped):', mappedRows)
    } finally {
      setIsUploading(false)
    }

    return false
  }

  const cloneHeadStyles = () => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('');
  };

  // Update handlePrintViewer to accept a type
  const handlePrintViewer = (idx: string, type: string) => {
    const content = document.getElementById(`viewer-content-${idx}`) ?? new HTMLElement;
    const getPrintHtml = (label: string) => {
      // Use outerHTML so the `printableDiv` class (from CSS modules) is preserved in the print window.
      return `
        <div style='position: relative; padding-bottom: 20px; font-size: 12px;'>
          ${content.outerHTML}
          <div style='position: absolute;right: 200px;font-size: 14px;font-weight: bold;'>
            <span style=''>${label}</span>
          </div>
        </div>
      `;
    }
    // const printWindow = window.open('', '', 'width=850,height=700') ?? new Window;
    const printWindow = window.open('', '', 'width=920,height=650') ?? new Window;
    const printStyle = `
    ${cloneHeadStyles()}
    <style>
      @page { size: legal; }
      @media print {
        .no-print { display: none; }
      }
    </style>
  `;
    let printHtml = '';
    if (type === 'all') {
      printHtml += getPrintHtml('TTC COPY');
      printHtml += `<div style="page-break-after: always; break-after: page;"></div>`;
      printHtml += getPrintHtml("CUSTOMER COPY");
      printHtml += `<div style="page-break-after: always; break-after: page;"></div>`;
      printHtml += getPrintHtml('CARRIER COPY');
    } else {
      let label = '';
      if (type === 'ttc') label = 'TTC COPY';
      if (type === 'customer') label = "CUSTOMER COPY";
      if (type === 'carrier') label = 'CARRIER COPY';
      printHtml = getPrintHtml(label);
    }
    printWindow.document.write('<html><head><title>Print Viewer</title>' + printStyle + '</head><body>' + printHtml + '</body></html>');
    printWindow.document.close();
    // printWindow.print();
  };

  return (
    <Space direction="vertical" size={9} className={styles.waybillPage}>
      <div className={styles.waybillPage__header}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Motortrade – Waybill
          </Typography.Title>
        </div>

        <div className={styles.waybillPage__headerUpload}>
          {uploadedFiles[0]?.name && (
            <Typography.Text
              type="secondary"
              className={styles.waybillPage__headerFilename}
              ellipsis
            >
              {uploadedFiles[0].name}
            </Typography.Text>
          )}

          <Upload
            accept=".xlsx,.xls"
            maxCount={1}
            showUploadList={false}
            fileList={uploadedFiles}
            beforeUpload={handleFile}
            onChange={({ fileList }) => {
              setUploadedFiles(fileList.slice(-1))
            }}
          >
            <Button icon={<UploadOutlined />}>Upload waybill (.xlsx)</Button>
          </Upload>
        </div>
      </div>

      <div className={styles.waybillPage__layout}>
        {/* Left: list of ref_no values */}
        <div className={styles.waybillPage__left}>
          <div className={styles.waybillPage__leftHeader}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Waybills
            </Typography.Title>
            {rawData.length > 0 && (
              <Typography.Text
                type="secondary"
                className={styles.waybillPage__leftHeaderStats}
              >
                {groupedWaybills.assignedCount} / {rawData.length} assigned
              </Typography.Text>
            )}
          </div>

          <Space direction="vertical" className={styles.waybillPage__search}>
            <Input
              placeholder="Search by ref no."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
            <Space size={4} wrap className={styles.waybillPage__filters}>
              <Button
                type={statusFilter === 'all' ? 'primary' : 'default'}
                size="small"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                type={statusFilter === 'assigned' ? 'primary' : 'default'}
                size="small"
                onClick={() => setStatusFilter('assigned')}
              >
                Assigned
              </Button>
              <Button
                type={statusFilter === 'unassigned' ? 'primary' : 'default'}
                size="small"
                onClick={() => setStatusFilter('unassigned')}
              >
                Unassigned
              </Button>
            </Space>
          </Space>

          <div className={styles.waybillPage__list}>
            {rawData.length === 0 ? (
              <Typography.Paragraph type="secondary">
                Upload a file to see waybills.
              </Typography.Paragraph>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {groupedWaybills.groups.map((group) => {
                  const billNo = assignedBillNoByGroupKey[group.groupKey]
                  const isAssigned = Boolean(billNo)
                  const isSelected = selectedGroupKey === group.groupKey

                  return (
                    <button
                      key={group.groupKey}
                      type="button"
                      onClick={() => {
                        setSelectedGroupKey(group.groupKey)
                        const firstIndex = group.items[0]?.index ?? null
                        setSelectedIndex(firstIndex)
                        setHousewayBillNo(billNo ?? '')
                      }}
                      className={[
                        styles.waybillPage__item,
                        isSelected ? styles['waybillPage__item--selected'] : '',
                        !isSelected && isAssigned ? styles['waybillPage__item--reviewed'] : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <div className={styles.waybillPage__itemRefs}>
                        {group.items.map((item) => (
                          <div
                            key={item.index}
                            className={styles.waybillPage__itemContent}
                          >
                            <Typography.Text strong>{item.refNo}</Typography.Text>
                          </div>
                        ))}
                      </div>
                      {isAssigned && billNo && (
                        <Typography.Text
                          type="success"
                          className={styles.waybillPage__itemTag}
                        >
                          {billNo}
                        </Typography.Text>
                      )}
                    </button>
                  )
                })}
              </Space>
            )}
          </div>
        </div>

        {/* Right: details for selected group */}
        <div className={styles.waybillPage__right}>
          {selectedGroupKey === null || selectedIndex === null || !rawData[selectedIndex] ? (
            <Typography.Paragraph type="secondary">
              Select a reference number on the left to view its details.
            </Typography.Paragraph>
          ) : (
            <>
              <div className={styles.waybillPage__topRow}>
                {/* Left: Houseway Bill + review button in card */}
                <div className={styles.waybillPage__topCard}>
                  <Card size="small" bordered style={{ height: '100%' }}>
                    {(() => {
                      const group = groupedWaybills.groups.find(
                        (g) => g.groupKey === selectedGroupKey
                      )
                      if (!group) return null

                      return (
                        <div className={styles.waybillPage__selectedRef}>
                          {group.items.map((item) => (
                            <div key={item.index}>{item.refNo}</div>
                          ))}
                        </div>
                      )
                    })()}
                    <Typography.Text strong style={{ display: 'block', marginTop: 10 }}>
                      Houseway Bill No
                    </Typography.Text>
                    {(() => {
                      if (!selectedGroupKey) return null
                      const isAssigned = Boolean(assignedBillNoByGroupKey[selectedGroupKey])

                      return (
                        <div className={styles.waybillPage__housewayRow}>
                          <Input
                            placeholder="Enter houseway bill no"
                            value={housewayBillNo}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '')
                              const withDash =
                                raw.length <= 3
                                  ? raw
                                  : `${raw.slice(0, 3)}-${raw.slice(3, 7)}`
                              setHousewayBillNo(withDash)
                            }}
                            onKeyDown={(e) => {
                              if(e.keyCode === 13) {
                                setAssignedBillNoByGroupKey((prev) => {
                                  if (!selectedGroupKey) return prev
                                  if (isAssigned) {
                                    const next = { ...prev }
                                    delete next[selectedGroupKey]
                                    return next
                                  }
                                  return { ...prev, [selectedGroupKey]: housewayBillNo.trim() }
                                })
                              }
                            }}
                            disabled={isAssigned}
                            className={styles.waybillPage__housewayInput}
                          />
                          <Button
                            type={isAssigned ? 'default' : 'primary'}
                            danger={isAssigned}
                            disabled={!isAssigned && !housewayBillNo.trim()}
                            onClick={() =>
                              setAssignedBillNoByGroupKey((prev) => {
                                if (!selectedGroupKey) return prev
                                if (isAssigned) {
                                  const next = { ...prev }
                                  delete next[selectedGroupKey]
                                  return next
                                }
                                return { ...prev, [selectedGroupKey]: housewayBillNo.trim() }
                              })
                            }
                          >
                            {isAssigned ? 'Unset' : 'Set'}
                          </Button>
                        </div>
                      )
                    })()}
                  </Card>
                </div>

                {/* Right: Print options card */}
                <div className={styles.waybillPage__topCard}>
                  <Card size="small" bordered style={{ height: '100%' }}>
                    <Typography.Text strong className={styles.waybillPage__printTitle}>
                      Print Options
                    </Typography.Text>
                    <Space direction="vertical" style={{ marginTop: 8 }}>
                      <Checkbox
                        checked={printOptions.ttc}
                        onChange={(e) =>
                          setPrintOptions((prev) => ({ ...prev, ttc: e.target.checked }))
                        }
                      >
                        TTC Copy
                      </Checkbox>
                      <Checkbox
                        checked={printOptions.customer}
                        onChange={(e) =>
                          setPrintOptions((prev) => ({ ...prev, customer: e.target.checked }))
                        }
                      >
                        Customer&apos;s Copy
                      </Checkbox>
                      <Checkbox
                        checked={printOptions.carrier}
                        onChange={(e) =>
                          setPrintOptions((prev) => ({ ...prev, carrier: e.target.checked }))
                        }
                      >
                        Carrier Copy
                      </Checkbox>
                    </Space>

                    <Space style={{ marginTop: 12 }}>
                      <Button
                        disabled={!printOptions.ttc && !printOptions.customer && !printOptions.carrier}
                      >
                        Print
                      </Button>
                      <Button type="primary"
                        onClick={() => handlePrintViewer(selectedGroupKey, 'all')}
                      >Print All</Button>
                    </Space>
                  </Card>
                </div>
              </div>

              <div className={styles.waybillPage__detailsCard}>
                {Object.entries(rawData[selectedIndex])
                  .filter(([key]) => key !== 'ref_no')
                  .map(([key, value]) => {
                    const label = key.replace(/_/g, ' ').toUpperCase()
                    return (
                      <div key={key} className={styles.waybillPage__detailsRow}>
                        <Typography.Text type="secondary">{label}</Typography.Text>
                        <Typography.Text>{String(value ?? '')}</Typography.Text>
                      </div>
                    )
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {isUploading && (
        <div className={styles.waybillPage__overlay}>
          <Spin size="large" tip="Processing waybill..." />
        </div>
      )}
      <div className={styles.printableDiv} id={`viewer-content-${selectedGroupKey}`}>
        <div style={{ textAlign: 'center' }}>ERVY LOGISTICS</div>
        <div style={{ textAlign: 'center' }}>PRK BANAWAG TAWAGAN NORTE, LABANGAN ZAMBOANGA DEL SUR</div>
        <div style={{ textAlign: 'center' }}>Cp. # 09451659947 / 09451098670</div>
        <div style={{ textAlign: 'center' }}>DELIVERY RECEIPT</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginRight: '50px' }}>
          <div>
            <div style={{ display: 'flex' }}>
              <div style={{ marginRight: '13px' }}>Delivery From:</div>
              <div>MDI-PAGADIAN WAREHOUSE</div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ marginRight: '32px' }}>Delivery to:</div>
              <div>MDI-IMELDA</div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px' }}>
              <div>WAYBILL NO.</div>
              <div>00000001</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px' }}>
              <div>KMPC DR No.:</div>
              <div>12345637256</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <div>Address: </div>
          <div style={{ width: '100%', borderBottomWidth: '1px', borderBottom: '1px solid black', marginLeft: '50px', marginRight: '50px' }}></div>
        </div>
        <div style={{ marginTop: '50px' }}> {/* table div */}
          <table className={styles.printableTable}>
            <tr>
              <th>MODEL</th>
              <th>QTY</th>
              <th>COLOR</th>
              <th>FRAME</th>
              <th>ENGINE</th>
              <th>REMARKS</th>
              <th>DEALER RECEIVER BY:</th>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>HONDA A123456</td>
              <td>1</td>
              <td>PEARL SILVERTIS GRAY</td>
              <td>K2V1234567</td>
              <td>JA23456789</td>
              <td></td>
              <td></td>
            </tr>
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
    </Space>
  )
}

