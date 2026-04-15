import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/** Saves a Motortrade waybill header + line items. */
export const save = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('motortradeWaybills', args)
  },
})

/** Returns the most recently saved Motortrade waybills. */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20
    return await ctx.db.query('motortradeWaybills').order('desc').take(limit)
  },
})

