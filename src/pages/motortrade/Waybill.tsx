import { useMemo, useState } from 'react'
import { Button, Input, InputNumber, Space, Spin, Table, Typography, message } from 'antd'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

/** Motortrade waybill workspace. */
export function MotortradeWaybillPage() {
  const saveWaybill = useMutation(api.motortradeWaybills.save)
  const recent = useQuery(api.motortradeWaybills.listRecent, { limit: 10 })

  const [deliveryFrom, setDeliveryFrom] = useState('')
  const [deliveryTo, setDeliveryTo] = useState('')
  const [waybillNo, setWaybillNo] = useState('')
  const [kmpcDrNo, setKmpcDrNo] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  type LineItem = {
    id: string
    model: string
    qty: number | null
    color: string
    frame: string
    engine: string
  }

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

  const recentColumns = useMemo(
    () => [
      { title: 'Waybill No', dataIndex: 'waybillNo', key: 'waybillNo' },
      { title: 'Delivery From', dataIndex: 'deliveryFrom', key: 'deliveryFrom' },
      { title: 'Delivery To', dataIndex: 'deliveryTo', key: 'deliveryTo' },
      { title: 'KMPC DR No.', dataIndex: 'kmpcDrNo', key: 'kmpcDrNo' },
      {
        title: 'Items',
        key: 'itemsCount',
        render: (_: unknown, record: SavedWaybill) => String(record.items?.length ?? 0),
        width: 80,
      },
    ],
    []
  )

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), model: '', qty: null, color: '', frame: '', engine: '' },
  ])

  const resetForm = () => {
    setDeliveryFrom('')
    setDeliveryTo('')
    setWaybillNo('')
    setKmpcDrNo('')
    setItems([{ id: crypto.randomUUID(), model: '', qty: null, color: '', frame: '', engine: '' }])
  }

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), model: '', qty: null, color: '', frame: '', engine: '' },
    ])
  }

  const columns = useMemo(
    () => [
      {
        title: 'Model',
        dataIndex: 'model',
        key: 'model',
        render: (_: unknown, record: LineItem) => (
          <Input
            value={record.model}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((r) => (r.id === record.id ? { ...r, model: e.target.value } : r))
              )
            }
            placeholder="Model"
          />
        ),
      },
      {
        title: 'Qty',
        dataIndex: 'qty',
        key: 'qty',
        width: 110,
        render: (_: unknown, record: LineItem) => (
          <InputNumber
            value={record.qty}
            onChange={(value) =>
              setItems((prev) =>
                prev.map((r) => (r.id === record.id ? { ...r, qty: value ?? null } : r))
              )
            }
            min={0}
            style={{ width: '100%' }}
            placeholder="0"
          />
        ),
      },
      {
        title: 'Color',
        dataIndex: 'color',
        key: 'color',
        render: (_: unknown, record: LineItem) => (
          <Input
            value={record.color}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((r) => (r.id === record.id ? { ...r, color: e.target.value } : r))
              )
            }
            placeholder="Color"
          />
        ),
      },
      {
        title: 'Frame',
        dataIndex: 'frame',
        key: 'frame',
        render: (_: unknown, record: LineItem) => (
          <Input
            value={record.frame}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((r) => (r.id === record.id ? { ...r, frame: e.target.value } : r))
              )
            }
            placeholder="Frame"
          />
        ),
      },
      {
        title: 'Engine',
        dataIndex: 'engine',
        key: 'engine',
        render: (_: unknown, record: LineItem) => (
          <Input
            value={record.engine}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((r) => (r.id === record.id ? { ...r, engine: e.target.value } : r))
              )
            }
            placeholder="Engine"
          />
        ),
      },
    ],
    []
  )

  /** Returns true if a line item is effectively blank and should be ignored on save. */
  const isBlankLineItem = (item: LineItem) => {
    return (
      !item.model.trim() &&
      item.qty == null &&
      !item.color.trim() &&
      !item.frame.trim() &&
      !item.engine.trim()
    )
  }

  /** Saves the current form to Convex and shows a user-friendly result message. */
  const handleSave = async () => {
    if (isSaving) return

    const trimmedDeliveryFrom = deliveryFrom.trim()
    const trimmedDeliveryTo = deliveryTo.trim()
    const trimmedWaybillNo = waybillNo.trim()
    const trimmedKmpcDrNo = kmpcDrNo.trim()

    if (!trimmedDeliveryFrom || !trimmedDeliveryTo || !trimmedWaybillNo || !trimmedKmpcDrNo) {
      message.warning('Please fill in Delivery From, Delivery To, Waybill No, and KMPC DR No.')
      return
    }

    const nonBlankItems = items.filter((item) => !isBlankLineItem(item))
    if (nonBlankItems.length === 0) {
      message.warning('Please add at least one item before saving.')
      return
    }

    setIsSaving(true)
    try {
      const id = await saveWaybill({
        deliveryFrom: trimmedDeliveryFrom,
        deliveryTo: trimmedDeliveryTo,
        waybillNo: trimmedWaybillNo,
        kmpcDrNo: trimmedKmpcDrNo,
        items: nonBlankItems.map(({ model, qty, color, frame, engine }) => ({
          model: model.trim(),
          qty,
          color: color.trim(),
          frame: frame.trim(),
          engine: engine.trim(),
        })),
      })

      resetForm()
      message.success(`Waybill saved. Id: ${id}`)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save Motortrade waybill:', err)
      const errorMessage =
        err instanceof Error && err.message ? err.message : 'Unknown error'
      message.error(
        `Save failed: ${errorMessage}. If you're running locally, ensure \`npm run convex:dev\` is running.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%', position: 'relative' }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Motortrade – Waybill
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Manage and review Motortrade waybills in this section.
        </Typography.Paragraph>
      </div>

      <div className={'header-fields'} style={{ width: '100%' }}>
        <Space size={12} wrap style={{ width: '100%' }}>
          <div style={{ minWidth: 220 }}>
            <Typography.Text strong>Delivery From</Typography.Text>
            <Input
              value={deliveryFrom}
              onChange={(e) => setDeliveryFrom(e.target.value)}
              placeholder="Enter delivery from"
              style={{ marginTop: 4 }}
            />
          </div>

          <div style={{ minWidth: 220 }}>
            <Typography.Text strong>Delivery To</Typography.Text>
            <Input
              value={deliveryTo}
              onChange={(e) => setDeliveryTo(e.target.value)}
              placeholder="Enter delivery to"
              style={{ marginTop: 4 }}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <Typography.Text strong>Waybill No</Typography.Text>
            <Input
              value={waybillNo}
              onChange={(e) => setWaybillNo(e.target.value)}
              placeholder="Enter waybill no"
              style={{ marginTop: 4 }}
            />
          </div>

          <div style={{ minWidth: 200 }}>
            <Typography.Text strong>KMPC DR No.</Typography.Text>
            <Input
              value={kmpcDrNo}
              onChange={(e) => setKmpcDrNo(e.target.value)}
              placeholder="Enter KMPC DR no."
              style={{ marginTop: 4 }}
            />
          </div>
        </Space>
      </div>

      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Typography.Text strong>Items</Typography.Text>
          <Button onClick={addRow}>Add row</Button>
        </div>
        <div style={{ marginTop: 8 }}>
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            dataSource={items}
            columns={columns}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <Button
          type="primary"
          loading={isSaving}
          onClick={handleSave}
        >
          Save
        </Button>
        <Button onClick={addRow}>Add row</Button>
      </div>

      <div style={{ width: '100%' }}>
        <Typography.Text strong>Recent saves</Typography.Text>
        <div style={{ marginTop: 8 }}>
          <Table<SavedWaybill>
            size="small"
            pagination={false}
            rowKey="_id"
            dataSource={(recent ?? []) as SavedWaybill[]}
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(_, index) => String(index)}
                  dataSource={record.items ?? []}
                  columns={[
                    { title: 'Model', dataIndex: 'model', key: 'model' },
                    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80 },
                    { title: 'Color', dataIndex: 'color', key: 'color' },
                    { title: 'Frame', dataIndex: 'frame', key: 'frame' },
                    { title: 'Engine', dataIndex: 'engine', key: 'engine' },
                  ]}
                />
              ),
              rowExpandable: (record) => (record.items?.length ?? 0) > 0,
            }}
            columns={recentColumns}
          />
        </div>
      </div>

      {isSaving && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            zIndex: 10,
          }}
        >
          <Spin size="large" tip="Saving waybill..." />
        </div>
      )}
    </Space>
  )
}

