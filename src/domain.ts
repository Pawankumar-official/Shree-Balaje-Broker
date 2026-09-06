export type DealStage = 'Matching' | 'Truck Assigned' | 'In Transit' | 'Delivered' | 'Payment Pending' | 'Closed' | 'Cancelled'
export type LedgerType = 'Commodity' | 'Buyer Commission' | 'Seller Commission'

export type Party = { id: string; name: string; phone: string; location: string; trust: 'High' | 'Normal' | 'Watch'; notes: string }
export type Deal = { id: string; dealDate: string; dailySerial: number; monthlySerial: number; buyerId: string; sellerId: string; commodity: string; quantity: number; rate: number; route: string; stage: DealStage; truck: string; expectedPayment: string; cancelledReason?: string }
export type DealTrip = { id: string; dealId: string; transporterId: string; truckNumber: string; freight: number; assignedDate: string; notes: string }
export type Payment = { id: string; dealId: string; ledger: LedgerType; amount: number; date: string; note: string }
export type PaymentObligation = { id: string; dealId: string; ledger: LedgerType; amount: number; expectedPayment: string }
export type Transporter = { id: string; name: string; phone: string; routes: string; reliability: 'High' | 'Normal' | 'Watch' }
export type Truck = { id: string; number: string; transporterId: string; capacity: string; driverPhone: string }
export type Offer = { id: string; sellerId: string; commodity: string; quantity: number; rate: number; location: string; status: 'Open' | 'Converted' | 'Closed' }
export type Requirement = { id: string; buyerId: string; commodity: string; quantity: number; targetRate: number; deliveryLocation: string; status: 'Open' | 'Converted' | 'Closed' }
export type Todo = { id: string; text: string; done: boolean; due: string }

export type AppData = { parties: Party[]; deals: Deal[]; dealTrips: DealTrip[]; payments: Payment[]; obligations: PaymentObligation[]; transporters: Transporter[]; trucks: Truck[]; offers: Offer[]; requirements: Requirement[]; todos: Todo[] }

export const today = '2026-09-06'
export const stages: DealStage[] = ['Matching', 'Truck Assigned', 'In Transit', 'Delivered', 'Payment Pending', 'Closed']
export const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const demoData: AppData = {
  parties: [
    { id: 'p1', name: 'Patna Rice Mill', phone: '98765 41001', location: 'Patna', trust: 'High', notes: 'Regular paddy buyer' },
    { id: 'p2', name: 'Kisan Traders', phone: '98765 41002', location: 'Buxar', trust: 'High', notes: 'Seasonal paddy supplier' },
    { id: 'p3', name: 'Maa Durga Foods', phone: '98765 41003', location: 'Bihar Sharif', trust: 'Normal', notes: '' },
    { id: 'p4', name: 'Bihar Agro', phone: '98765 41004', location: 'Ara', trust: 'Normal', notes: '' },
    { id: 'p5', name: 'Shakti Rice Works', phone: '98765 41005', location: 'Patna', trust: 'Watch', notes: 'Follow up on outstanding' },
    { id: 'p6', name: 'Sonal Enterprises', phone: '98765 41006', location: 'Sasaram', trust: 'Normal', notes: '' },
  ],
  dealTrips: [
    { id: 'trip1', dealId: 'd17', transporterId: 't1', truckNumber: 'BR 01 GK 4821', freight: 85000, assignedDate: today, notes: '' },
    { id: 'trip2', dealId: 'd18', transporterId: 't2', truckNumber: 'BR 21 GA 7612', freight: 62000, assignedDate: today, notes: '' },
  ],
  deals: [
    { id: 'd17', dealDate: today, dailySerial: 1, monthlySerial: 17, buyerId: 'p1', sellerId: 'p2', commodity: 'Paddy', quantity: 420, rate: 2350, route: 'Buxar → Patna', stage: 'In Transit', truck: 'BR 01 GK 4821', expectedPayment: '2026-09-08' },
    { id: 'd18', dealDate: today, dailySerial: 2, monthlySerial: 18, buyerId: 'p3', sellerId: 'p4', commodity: 'Wheat', quantity: 280, rate: 2680, route: 'Ara → Bihar Sharif', stage: 'Truck Assigned', truck: 'BR 21 GA 7612', expectedPayment: '2026-09-09' },
    { id: 'd19', dealDate: today, dailySerial: 3, monthlySerial: 19, buyerId: 'p5', sellerId: 'p6', commodity: 'Paddy', quantity: 610, rate: 2325, route: 'Sasaram → Patna', stage: 'Payment Pending', truck: '', expectedPayment: '2026-09-04' },
    { id: 'd20', dealDate: today, dailySerial: 4, monthlySerial: 20, buyerId: 'p1', sellerId: 'p4', commodity: 'Rice', quantity: 160, rate: 3520, route: 'Begusarai → Patna', stage: 'Matching', truck: '', expectedPayment: '2026-09-12' },
  ],
  payments: [{ id: 'pay1', dealId: 'd19', ledger: 'Commodity', amount: 993250, date: '2026-09-02', note: 'Part payment received' }],
  obligations: [
    { id: 'ob1', dealId: 'd17', ledger: 'Buyer Commission', amount: 12600, expectedPayment: '2026-09-10' },
    { id: 'ob2', dealId: 'd17', ledger: 'Seller Commission', amount: 8400, expectedPayment: '2026-09-10' },
    { id: 'ob3', dealId: 'd19', ledger: 'Buyer Commission', amount: 18300, expectedPayment: '2026-09-04' },
  ],
  transporters: [{ id: 't1', name: 'Ganga Roadlines', phone: '98765 42001', routes: 'Buxar–Patna, Ara–Patna', reliability: 'High' }, { id: 't2', name: 'Raj Transport', phone: '98765 42002', routes: 'Sasaram–Patna', reliability: 'Normal' }],
  trucks: [{ id: 'tr1', number: 'BR 01 GK 4821', transporterId: 't1', capacity: '420 Qtl', driverPhone: '98765 43001' }, { id: 'tr2', number: 'BR 21 GA 7612', transporterId: 't2', capacity: '300 Qtl', driverPhone: '' }],
  offers: [{ id: 'o1', sellerId: 'p2', commodity: 'Paddy', quantity: 500, rate: 2340, location: 'Buxar', status: 'Open' }],
  requirements: [{ id: 'r1', buyerId: 'p3', commodity: 'Paddy', quantity: 450, targetRate: 2380, deliveryLocation: 'Bihar Sharif', status: 'Open' }],
  todos: [{ id: 'todo1', text: 'Confirm unloading for daily no. 1', done: false, due: today }, { id: 'todo2', text: 'Follow up outstanding with Shakti Rice Works', done: false, due: today }],
}

export const emptyData: AppData = { parties: [], deals: [], dealTrips: [], payments: [], obligations: [], transporters: [], trucks: [], offers: [], requirements: [], todos: [] }

export const partyName = (parties: Party[], id: string) => parties.find((party) => party.id === id)?.name ?? 'Unknown party'
export const dealValue = (deal: Deal) => deal.quantity * deal.rate
export const monthlyKey = (date: string) => date.slice(0, 7)
