import { useEffect, useState } from 'react'
import type { AppData, DealStage, LedgerType } from './domain'
import { emptyData } from './domain'
import { supabase } from './lib/supabase'

const fromDbLedger = (value: string) => value.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ') as LedgerType
const fromDbStage = (value: string) => value.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ') as DealStage
const rupees = (paise: number | null) => Number(paise ?? 0) / 100

export function useCloudData() {
  const [data, setData] = useState<AppData>(emptyData)
  const [loaded, setLoaded] = useState(false)
  const reload = async () => {
    if (!supabase) return
      const [parties, deals, payments, obligations, transporters, trucks, offers, requirements, todos] = await Promise.all([
        supabase.from('parties').select('*').order('created_at'), supabase.from('deals').select('*').order('deal_date').order('daily_serial'), supabase.from('payment_entries').select('*'), supabase.from('payment_obligations').select('*'), supabase.from('transporters').select('*'), supabase.from('trucks').select('*'), supabase.from('offers').select('*'), supabase.from('requirements').select('*'), supabase.from('todos').select('*'),
      ])
      const trips = await supabase.from('deal_trips').select('*')
      if ([parties, deals, payments, obligations, transporters, trucks, offers, requirements, todos, trips].some((result) => result.error)) { setLoaded(true); return }
      const truckById = new Map((trucks.data ?? []).map((truck) => [truck.id, truck.registration_number]))
      const commodityObligation = new Map((obligations.data ?? []).filter((item) => item.ledger === 'commodity').map((item) => [item.deal_id, item]))
      setData({
        parties: (parties.data ?? []).map((p) => ({ id: p.id, name: p.name, phone: p.phone, location: p.location, trust: p.trust[0].toUpperCase() + p.trust.slice(1), notes: p.notes })),
        deals: (deals.data ?? []).map((d) => ({ id: d.id, dealDate: d.deal_date, dailySerial: d.daily_serial, monthlySerial: d.monthly_serial, buyerId: d.buyer_party_id, sellerId: d.seller_party_id, commodity: d.commodity, quantity: Number(d.quantity_qtl), rate: rupees(d.rate_per_qtl_paise), route: d.route, stage: fromDbStage(d.stage), truck: '', expectedPayment: commodityObligation.get(d.id)?.expected_payment_date ?? '', cancelledReason: d.cancelled_reason ?? undefined })),
        dealTrips: (trips.data ?? []).map((trip) => ({ id: trip.id, dealId: trip.deal_id, transporterId: trip.transporter_id, truckNumber: truckById.get(trip.truck_id) ?? 'Unknown truck', freight: rupees(trip.freight_paise), assignedDate: trip.assigned_at?.slice(0, 10) ?? '', notes: trip.notes })),
        payments: (payments.data ?? []).map((p) => ({ id: p.id, dealId: p.deal_id, ledger: fromDbLedger(p.ledger), amount: rupees(p.amount_paise), date: p.payment_date, note: p.note })),
        obligations: (obligations.data ?? []).filter((o) => o.ledger !== 'commodity').map((o) => ({ id: o.id, dealId: o.deal_id, ledger: fromDbLedger(o.ledger), amount: rupees(o.amount_paise), expectedPayment: o.expected_payment_date ?? '' })),
        transporters: (transporters.data ?? []).map((t) => ({ id: t.id, name: t.name, phone: t.phone, routes: '', reliability: t.reliability[0].toUpperCase() + t.reliability.slice(1) })),
        trucks: (trucks.data ?? []).map((t) => ({ id: t.id, number: t.registration_number, transporterId: t.transporter_id, capacity: t.capacity_qtl ? String(t.capacity_qtl) : '', driverPhone: '' })),
        offers: (offers.data ?? []).map((o) => ({ id: o.id, sellerId: o.seller_party_id, commodity: o.commodity, quantity: Number(o.quantity_qtl), rate: rupees(o.rate_per_qtl_paise), location: o.location, status: o.status[0].toUpperCase() + o.status.slice(1) })),
        requirements: (requirements.data ?? []).map((r) => ({ id: r.id, buyerId: r.buyer_party_id, commodity: r.commodity, quantity: Number(r.quantity_qtl), targetRate: rupees(r.target_rate_paise), deliveryLocation: r.delivery_location, status: r.status[0].toUpperCase() + r.status.slice(1) })),
        todos: (todos.data ?? []).map((t) => ({ id: t.id, text: t.text, done: Boolean(t.completed_at), due: t.due_date ?? '' })),
      })
      setLoaded(true)
  }
  useEffect(() => { void reload() }, [])
  return [data, setData, loaded, reload] as const
}
