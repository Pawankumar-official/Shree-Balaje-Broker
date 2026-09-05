import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type DealStage = 'Matching' | 'Truck Assigned' | 'In Transit' | 'Delivered' | 'Payment Pending' | 'Closed'

type Deal = {
  id: string
  dealDate: string
  dailySerial: number
  monthlySerial: number
  buyer: string
  seller: string
  commodity: string
  quantity: number
  rate: number
  route: string
  stage: DealStage
  truck?: string
  due: number
  expectedPayment: string
}

const stages: DealStage[] = ['Matching', 'Truck Assigned', 'In Transit', 'Delivered', 'Payment Pending', 'Closed']

const initialDeals: Deal[] = [
  { id: 'record-17', dealDate: '2026-09-06', dailySerial: 1, monthlySerial: 17, buyer: 'Patna Rice Mill', seller: 'Kisan Traders', commodity: 'Paddy', quantity: 420, rate: 2350, route: 'Buxar → Patna', stage: 'In Transit', truck: 'BR 01 GK 4821', due: 0, expectedPayment: '08 Sep 2026' },
  { id: 'record-18', dealDate: '2026-09-06', dailySerial: 2, monthlySerial: 18, buyer: 'Maa Durga Foods', seller: 'Bihar Agro', commodity: 'Wheat', quantity: 280, rate: 2680, route: 'Ara → Bihar Sharif', stage: 'Truck Assigned', truck: 'BR 21 GA 7612', due: 0, expectedPayment: '09 Sep 2026' },
  { id: 'record-19', dealDate: '2026-09-06', dailySerial: 3, monthlySerial: 19, buyer: 'Shakti Rice Works', seller: 'Sonal Enterprises', commodity: 'Paddy', quantity: 610, rate: 2325, route: 'Sasaram → Patna', stage: 'Payment Pending', due: 425000, expectedPayment: '04 Sep 2026' },
  { id: 'record-20', dealDate: '2026-09-06', dailySerial: 4, monthlySerial: 20, buyer: 'Ganga Foods', seller: 'Raj Grain House', commodity: 'Rice', quantity: 160, rate: 3520, route: 'Begusarai → Patna', stage: 'Matching', due: 0, expectedPayment: '12 Sep 2026' },
]

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

function App() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [isDealFormOpen, setDealFormOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [toast, setToast] = useState('')

  const summary = useMemo(() => ({
    active: deals.filter((deal) => !['Closed', 'Payment Pending'].includes(deal.stage)).length,
    transit: deals.filter((deal) => deal.stage === 'In Transit').length,
    paymentPending: deals.filter((deal) => deal.stage === 'Payment Pending').length,
    outstanding: deals.reduce((sum, deal) => sum + deal.due, 0),
  }), [deals])

  const updateStage = (id: string, stage: DealStage) => {
    setDeals((current) => current.map((deal) => deal.id === id ? { ...deal, stage } : deal))
    setToast('Deal status updated. Financial records were not changed.')
  }

  const createDeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const dealDate = '2026-09-06'
    const sameDayDeals = deals.filter((deal) => deal.dealDate === dealDate)
    const sameMonthDeals = deals.filter((deal) => deal.dealDate.slice(0, 7) === dealDate.slice(0, 7))
    const newDeal: Deal = {
      id: `record-${Date.now()}`,
      dealDate,
      dailySerial: Math.max(0, ...sameDayDeals.map((deal) => deal.dailySerial)) + 1,
      monthlySerial: Math.max(0, ...sameMonthDeals.map((deal) => deal.monthlySerial)) + 1,
      buyer: String(form.get('buyer')),
      seller: String(form.get('seller')),
      commodity: String(form.get('commodity')),
      quantity: Number(form.get('quantity')),
      rate: Number(form.get('rate')),
      route: String(form.get('route')),
      stage: 'Matching',
      due: 0,
      expectedPayment: String(form.get('expectedPayment')) || 'Not set',
    }
    setDeals((current) => [...current, newDeal])
    setDealFormOpen(false)
    setToast(`Daily no. ${newDeal.dailySerial} / monthly no. ${newDeal.monthlySerial} created in Matching.`)
  }

  const attentionDeals = deals.filter((deal) => deal.stage === 'Matching' || deal.stage === 'Payment Pending')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">SB</span><span>Shree Balaje<small>Brokerage</small></span></div>
        <nav aria-label="Main navigation">
          {['Dashboard', 'Deals', 'Parties', 'Transport', 'Payments', 'Daily Register', 'Monthly Ledger', 'To-Do', 'Reports'].map((item) => (
            <button key={item} className={activeNav === item ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav(item)}>
              <span>{item === 'Dashboard' ? '⌂' : item === 'Deals' ? '◇' : item === 'Parties' ? '♙' : item === 'Transport' ? '▰' : item === 'Payments' ? '₹' : item === 'Daily Register' ? '▤' : item === 'Monthly Ledger' ? '▥' : item === 'To-Do' ? '✓' : '↗'}</span>{item}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer"><span className="online-dot"/> Business data is local demo data</div>
      </aside>

      <main>
        <header className="topbar">
          <div><p className="eyebrow">Saturday, 06 September 2026</p><h1>{activeNav === 'Dashboard' ? "Today's Business" : activeNav}</h1></div>
          <div className="header-actions"><button className="icon-button" aria-label="Notifications">♧<span className="notification-dot"/></button><button className="profile">PB <span>⌄</span></button><button className="primary-button" onClick={() => setDealFormOpen(true)}>+ New Deal</button></div>
        </header>

        {toast && <div className="toast" role="status">{toast}<button onClick={() => setToast('')} aria-label="Dismiss message">×</button></div>}

        <section className="summary-grid" aria-label="Business summary">
          <article className="summary-card"><span className="card-icon gold">◇</span><div><p>Active Deals</p><strong>{summary.active}</strong><small>Across all active stages</small></div></article>
          <article className="summary-card"><span className="card-icon blue">▰</span><div><p>In Transit</p><strong>{summary.transit}</strong><small>Truck currently moving</small></div></article>
          <article className="summary-card"><span className="card-icon orange">₹</span><div><p>Payment Pending</p><strong>{summary.paymentPending}</strong><small>{money.format(summary.outstanding)} outstanding</small></div></article>
          <article className="summary-card"><span className="card-icon red">!</span><div><p>Attention Required</p><strong>{attentionDeals.length}</strong><small>Needs your decision</small></div></article>
        </section>

        <section className="content-grid">
          <div className="panel active-deals">
            <div className="panel-heading"><div><p className="eyebrow">WORKING NOW</p><h2>Active Deals</h2></div><button className="text-button" onClick={() => setActiveNav('Deals')}>View all →</button></div>
            <div className="table-wrap"><table><thead><tr><th>Daily No.</th><th>Buyer / Seller</th><th>Commodity</th><th>Route</th><th>Status</th><th></th></tr></thead><tbody>
              {deals.slice(0, 5).map((deal) => <tr key={deal.id}><td><strong>{deal.dailySerial}</strong><small>Monthly no. {deal.monthlySerial} · {deal.quantity} Qtl</small></td><td><strong>{deal.buyer}</strong><small>{deal.seller}</small></td><td>{deal.commodity}<small>{money.format(deal.rate)}/Qtl</small></td><td>{deal.route}</td><td><span className={`status status-${deal.stage.toLowerCase().replace(' ', '-')}`}>{deal.stage}</span></td><td><select value={deal.stage} aria-label={`Update stage for daily deal number ${deal.dailySerial}`} onChange={(event) => updateStage(deal.id, event.target.value as DealStage)}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></td></tr>)}
            </tbody></table></div>
          </div>

          <aside className="side-panels">
            <section className="panel attention"><div className="panel-heading"><div><p className="eyebrow">PRIORITY</p><h2>Attention Required</h2></div><span className="attention-count">{attentionDeals.length}</span></div>
              {attentionDeals.slice(0, 3).map((deal) => <div className="attention-row" key={deal.id}><span className={deal.stage === 'Payment Pending' ? 'attention-icon overdue' : 'attention-icon'}>{deal.stage === 'Payment Pending' ? '₹' : '◇'}</span><div><strong>{deal.stage === 'Payment Pending' ? 'Payment follow-up' : 'Complete deal details'}</strong><p>Daily no. {deal.dailySerial} · {deal.buyer}</p></div><button onClick={() => setToast(`Daily deal no. ${deal.dailySerial} is the next workflow step.`)}>→</button></div>)}
            </section>
            <section className="panel transport-card"><div><p className="eyebrow">TRANSPORT</p><h2>Truck activity</h2></div><div className="transport-stats"><span><strong>{deals.filter((deal) => deal.stage === 'Matching').length}</strong> Awaiting</span><span><strong>{deals.filter((deal) => deal.stage === 'Truck Assigned').length}</strong> Assigned</span><span><strong>{summary.transit}</strong> In transit</span></div><button className="secondary-button" onClick={() => setActiveNav('Transport')}>Manage transport</button></section>
          </aside>
        </section>

        <section className="bottom-grid">
          <div className="panel register"><div className="panel-heading"><div><p className="eyebrow">SOURCE OF TRUTH</p><h2>Today’s Daily Register</h2></div><button className="text-button" onClick={() => setActiveNav('Daily Register')}>Open register →</button></div><div className="register-row"><span>06 Sep</span><strong>Daily serials 1–{deals.length}</strong><p>Monthly serials continue from 17 · {summary.paymentPending} payment pending</p></div></div>
          <div className="panel todo"><div className="panel-heading"><div><p className="eyebrow">FOLLOW-UPS</p><h2>To-Do</h2></div><button className="text-button">+ Add</button></div><label><input type="checkbox"/> Confirm unloading for daily no. 1</label><label><input type="checkbox"/> Follow up ₹4,25,000 from Shakti Rice Works</label></div>
        </section>
      </main>

      {isDealFormOpen && <div className="modal-backdrop" role="presentation"><section className="deal-modal" role="dialog" aria-modal="true" aria-labelledby="new-deal-title"><div className="modal-heading"><div><p className="eyebrow">ONE-SCREEN QUICK ENTRY</p><h2 id="new-deal-title">Create New Deal</h2><p>Only enter what is known now. Missing transport and payment details can be added later.</p></div><button className="close-button" onClick={() => setDealFormOpen(false)} aria-label="Close">×</button></div><form onSubmit={createDeal}><div className="form-grid"><label>Buyer<input name="buyer" required placeholder="Select or type buyer" /></label><label>Seller<input name="seller" required placeholder="Select or type seller" /></label><label>Commodity<select name="commodity" defaultValue="Paddy"><option>Paddy</option><option>Wheat</option><option>Rice</option></select></label><label>Quantity (Qtl)<input name="quantity" type="number" min="0.01" step="0.01" required /></label><label>Rate (₹/Qtl)<input name="rate" type="number" min="0" required /></label><label>Route<input name="route" required placeholder="e.g. Buxar → Patna" /></label><label>Expected payment date<input name="expectedPayment" type="date" /></label></div><div className="form-note">This creates a deal in <strong>Matching</strong>. No offer, payment, or truck is created automatically.</div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setDealFormOpen(false)}>Cancel</button><button className="primary-button" type="submit">Create Deal</button></div></form></section></div>}
    </div>
  )
}

export default App
