import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

/** Convex schema for Motortrade waybills + line items. */
export default defineSchema({
  motortradeWaybills: defineTable({
    deliveryFrom: v.string(),
    deliveryTo: v.string(),
    waybillNo: v.string(),
    kmpcDrNo: v.string(),
    items: v.array(
      v.object({
        model: v.string(),
        qty: v.union(v.number(), v.null()),
        color: v.string(),
        frame: v.string(),
        engine: v.string(),
      })
    ),
  }),
})

