import { useState } from 'react';
import { Plus, DollarSign, Warehouse, TrendingDown, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import usePersistentState from '../../hooks/usePersistentState';
import { Modal, SelectField, TextField } from '../../components/people';

const budgetData = [
  { project: 'Clean Water', allocated: 850000, spent: 578000 },
  { project: 'Digital Literacy', allocated: 320000, spent: 144000 },
  { project: 'Healthcare', allocated: 560000, spent: 67200 },
  { project: 'School Reno', allocated: 210000, spent: 208500 },
  { project: 'Women Hub', allocated: 475000, spent: 261250 },
];

const expenses = [
  { category: 'Personnel', amount: '₹12,40,000', pct: 38, color: '#1AACB8' },
  { category: 'Materials', amount: '₹8,20,000', pct: 25, color: '#6366F1' },
  { category: 'Operations', amount: '₹6,50,000', pct: 20, color: '#10B981' },
  { category: 'Marketing', amount: '₹3,90,000', pct: 12, color: '#F59E0B' },
  { category: 'Other', amount: '₹1,60,000', pct: 5, color: '#94A3B8' },
];

interface InventoryItem { item: string; qty: number; unit: string; project: string; status: string }
interface InventoryRequest { id: string; item: string; qty: number; requestedOn: string; status: 'Pending' }

const initialInventory: InventoryItem[] = [
  { item: 'Medical Kits', qty: 120, unit: 'kits', project: 'Healthcare Outreach', status: 'Adequate' },
  { item: 'Laptops/Tablets', qty: 85, unit: 'devices', project: 'Digital Literacy Drive', status: 'Adequate' },
  { item: 'Water Purifiers', qty: 42, unit: 'units', project: 'Clean Water Initiative', status: 'Low' },
  { item: 'School Stationery', qty: 2400, unit: 'sets', project: 'Girls Education', status: 'Adequate' },
  { item: 'First Aid Boxes', qty: 8, unit: 'boxes', project: 'Health Camp', status: 'Critical' },
  { item: 'Folding Tables', qty: 35, unit: 'pcs', project: 'Events', status: 'Adequate' },
];

const donors_funding = [
  { source: 'Corporate CSR', amount: '₹1.4 Cr', pct: 43 },
  { source: 'Individual Donors', amount: '₹92L', pct: 28 },
  { source: 'Government Grants', amount: '₹55L', pct: 17 },
  { source: 'Self-Funding', amount: '₹40L', pct: 12 },
];

const inventoryStatus: Record<string, string> = {
  Adequate: 'badge badge-green',
  Low: 'badge badge-yellow',
  Critical: 'badge badge-red',
};

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('budget');
  const [inventory, setInventory] = usePersistentState<InventoryItem[]>('resources.inventory', initialInventory);
  const [requests, setRequests] = usePersistentState<InventoryRequest[]>('resources.inventory.requests', []);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [requestItem, setRequestItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({ item: '', qty: '', unit: '', project: '', status: 'Adequate' });
  const [requestQty, setRequestQty] = useState('');

  const addInventoryItem = () => {
    const qty = Number(itemForm.qty);
    if (!itemForm.item.trim() || !itemForm.unit.trim() || !itemForm.project.trim() || !Number.isFinite(qty) || qty < 0) return;
    setInventory(current => [{ item: itemForm.item.trim(), qty, unit: itemForm.unit.trim(), project: itemForm.project.trim(), status: itemForm.status }, ...current]);
    setItemForm({ item: '', qty: '', unit: '', project: '', status: 'Adequate' });
    setItemModalOpen(false);
  };

  const submitRequest = () => {
    const qty = Number(requestQty);
    if (!requestItem || !Number.isFinite(qty) || qty < 1) return;
    setRequests(current => [{ id: `REQ-${Date.now()}`, item: requestItem.item, qty, requestedOn: new Date().toLocaleDateString('en-GB'), status: 'Pending' }, ...current]);
    setRequestItem(null);
    setRequestQty('');
  };

  const openAddItem = () => { setActiveTab('inventory'); setItemModalOpen(true); };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Resources & Budget</h1>
          <p className="page-subtitle">Monitor budgets, expenses, inventory, and funding sources</p>
        </div>
        <button className="btn-primary" onClick={openAddItem}><Plus size={16} /> Add Resource</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Annual Budget', value: '₹4.8 Cr', icon: <DollarSign size={18} />, color: '#1AACB8' },
          { label: 'Spent YTD', value: '₹3.2 Cr', icon: <TrendingDown size={18} />, color: '#6366F1' },
          { label: 'Remaining', value: '₹1.6 Cr', icon: <Warehouse size={18} />, color: '#10B981' },
          { label: 'Critical Inventory Items', value: String(inventory.filter(item => item.status === 'Critical').length), icon: <AlertCircle size={18} />, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: s.color + '15' }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tab-bar w-fit">
        {['budget', 'expenses', 'inventory', 'funding'].map(t => (
          <button key={t} className={`tab-item capitalize ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {activeTab === 'budget' && (
        <>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Budget vs Spent by Project</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={budgetData} barGap={4}>
                  <XAxis dataKey="project" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                    tickFormatter={(v: any) => `₹${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => `₹${(v / 1000).toFixed(0)}k`}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="allocated" fill="#E6F7F9" radius={[4, 4, 0, 0]} name="Allocated" barSize={20} />
                  <Bar dataKey="spent" fill="#1AACB8" radius={[4, 4, 0, 0]} name="Spent" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-6 justify-center mt-2">
                <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-teal-100" /> Allocated</div>
                <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-teal-500" /> Spent</div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header"><span className="card-title">Project Budget Summary</span></div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr><th>Project</th><th>Allocated</th><th>Spent</th><th>Remaining</th><th>Utilization</th></tr>
                </thead>
                <tbody>
                  {budgetData.map((b, i) => {
                    const remaining = b.allocated - b.spent;
                    const util = Math.round((b.spent / b.allocated) * 100);
                    return (
                      <tr key={i}>
                        <td className="font-semibold text-slate-800">{b.project}</td>
                        <td>₹{b.allocated.toLocaleString()}</td>
                        <td>₹{b.spent.toLocaleString()}</td>
                        <td className={remaining < 0 ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                          ₹{Math.abs(remaining).toLocaleString()}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-slate-100">
                              <div className="h-full rounded-full" style={{
                                width: `${util}%`,
                                background: util > 90 ? '#EF4444' : util > 70 ? '#F59E0B' : '#1AACB8'
                              }} />
                            </div>
                            <span className="text-xs text-slate-500">{util}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header"><span className="card-title">Expense by Category</span></div>
            <div className="card-body flex flex-col gap-3">
              {expenses.map(e => (
                <div key={e.category} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-slate-500 text-right">{e.category}</div>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${e.pct}%`, background: e.color }} />
                  </div>
                  <div className="w-24 text-xs font-semibold text-slate-700">{e.amount}</div>
                  <div className="w-8 text-xs text-slate-400">{e.pct}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Expense Distribution</span></div>
            <div className="card-body flex flex-col items-center gap-3">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={expenses} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="pct">
                    {expenses.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 text-xs w-full">
                {expenses.map(e => (
                  <div key={e.category} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                    <span className="text-slate-500">{e.category}</span>
                    <span className="ml-auto font-bold text-slate-700">{e.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <span className="card-title">Material Inventory</span>
            <button className="btn-primary text-xs py-1.5" onClick={() => setItemModalOpen(true)}><Plus size={13} /> Add Item</button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Project</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.item}>
                    <td className="font-semibold text-slate-800">{item.item}</td>
                    <td className="font-bold text-slate-700">{item.qty}</td>
                    <td className="text-xs text-slate-500">{item.unit}</td>
                    <td className="text-xs text-slate-600">{item.project}</td>
                    <td><span className={inventoryStatus[item.status]}>{item.status}</span></td>
                    <td><button className="btn-secondary text-xs py-1" onClick={() => { setRequestItem(item); setRequestQty(''); }}>Request More</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {requests.length > 0 && <div className="border-t border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Supply Requests</h3>
            <div className="overflow-x-auto"><table className="data-table w-full"><thead><tr><th>Item</th><th>Quantity</th><th>Requested</th><th>Status</th></tr></thead>
              <tbody>{requests.map(request => <tr key={request.id}><td className="font-semibold">{request.item}</td><td>{request.qty}</td><td>{request.requestedOn}</td><td><span className="badge badge-yellow">{request.status}</span></td></tr>)}</tbody>
            </table></div>
          </div>}
        </div>
      )}

      {activeTab === 'funding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {donors_funding.map((f, i) => (
            <div key={i} className="stat-card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{f.source}</span>
                <span className="badge badge-teal">{f.pct}%</span>
              </div>
              <div className="text-2xl font-extrabold" style={{ color: '#1AACB8', fontFamily: 'Nunito, sans-serif' }}>{f.amount}</div>
              <div className="w-full h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-400" style={{ width: `${f.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={itemModalOpen} onClose={() => setItemModalOpen(false)} title="Add Inventory Item" submitLabel="Add Item" onSubmit={addInventoryItem}>
        <TextField label="Item name" value={itemForm.item} onChange={value => setItemForm(current => ({ ...current, item: value }))} required wide />
        <TextField label="Quantity" type="number" value={itemForm.qty} onChange={value => setItemForm(current => ({ ...current, qty: value }))} required />
        <TextField label="Unit" value={itemForm.unit} onChange={value => setItemForm(current => ({ ...current, unit: value }))} required />
        <TextField label="Project" value={itemForm.project} onChange={value => setItemForm(current => ({ ...current, project: value }))} required wide />
        <SelectField label="Stock status" value={itemForm.status} onChange={value => setItemForm(current => ({ ...current, status: value }))} options={['Adequate', 'Low', 'Critical']} />
      </Modal>

      <Modal open={!!requestItem} onClose={() => setRequestItem(null)} title={`Request ${requestItem?.item ?? 'supplies'}`} submitLabel="Submit Request" onSubmit={submitRequest}>
        {requestItem && <div className="sm:col-span-2 text-sm text-slate-600">Current stock: {requestItem.qty} {requestItem.unit}</div>}
        <TextField label="Quantity requested" type="number" value={requestQty} onChange={setRequestQty} required />
      </Modal>
    </div>
  );
}
