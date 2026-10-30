import { useState } from 'react';
import { TrendingUp, Target, DollarSign, Star, Plus, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import usePersistentState from '../../hooks/usePersistentState';
import { Modal, SelectField, TextField } from '../../components/people';

interface OutcomeMetric { month: string; contributions: number; conversions: number; pledges: number }
interface MaterialLog { id: string; donor: string; item: string; project: string; date: string; value: string }
interface Pledge { id: string; donor: string; amount: string; cause: string; dueDate: string; status: string; campaign: string; category: string }
interface DonorContribution { donor: string; category: string; amount: number; date: string }

const initialOutcomeData: OutcomeMetric[] = [
  { month: 'May', contributions: 48, conversions: 32, pledges: 15 },
  { month: 'Jun', contributions: 55, conversions: 38, pledges: 22 },
  { month: 'Jul', contributions: 62, conversions: 44, pledges: 28 },
  { month: 'Aug', contributions: 70, conversions: 52, pledges: 35 },
  { month: 'Sep', contributions: 68, conversions: 49, pledges: 31 },
  { month: 'Oct', contributions: 74, conversions: 56, pledges: 38 },
];

const initialMaterialLogs: MaterialLog[] = [
  { id: 'MAT-001', donor: 'Tata Trust', item: 'School Bags (500 sets)', project: 'Girls Education', date: '5 Oct 2025', value: '₹1,50,000' },
  { id: 'MAT-002', donor: 'Ramesh Gupta', item: 'Medical Kits (50 units)', project: 'Healthcare Outreach', date: '2 Oct 2025', value: '₹80,000' },
  { id: 'MAT-003', donor: 'HCL Foundation', item: 'Laptops (30 units)', project: 'Digital Literacy', date: '28 Sep 2025', value: '₹9,00,000' },
];

const initialPledges: Pledge[] = [
  { id: 'PLG-001', donor: 'Birla Charitable', amount: '₹2,00,000', cause: 'Rural Dev', dueDate: '31 Dec 2025', status: 'Confirmed', campaign: 'Diwali Drive', category: 'Fundraising Events' },
  { id: 'PLG-002', donor: 'Sunita Mehra', amount: '₹50,000', cause: 'Women Empowerment', dueDate: '30 Nov 2025', status: 'Verbal', campaign: 'General', category: 'Online Donations' },
  { id: 'PLG-003', donor: 'Anonymous CSR', amount: '₹5,00,000', cause: 'Education', dueDate: '15 Jan 2026', status: 'Pending', campaign: 'Corporate CSR Match', category: 'CSR Funds' },
];

const initialDonorContributions: DonorContribution[] = [
  { donor: 'Asha Nair', category: 'Online Donations', amount: 25000, date: '09 Oct 2026' },
  { donor: 'Sparsh Foods Pvt Ltd', category: 'CSR Funds', amount: 450000, date: '04 Oct 2026' },
  { donor: 'Nitin Mehta', category: 'Crowdfunding', amount: 12500, date: '01 Oct 2026' },
];

const DONATION_CATEGORIES = ['Crowdfunding', 'Donation Boxes', 'Fundraising Events', 'Online Donations', 'Material Donations', 'Time/Volunteer Donations', 'CSR Funds', 'International CSR', 'Employee Giving', 'Matching Funds', 'Brand Sponsorships', 'NGO/Government Grants', 'Foreign Grants', 'Auctions', 'Bequests', 'Family Philanthropy', 'Social Businesses', 'Mission-Linked Services', 'Session/Training Fees', 'Course Fees', 'Memberships', 'Corpus/Endowment', 'Awards', 'Social Media Income'];

const pledgeStyle: Record<string, string> = {
  Confirmed: 'badge badge-green',
  Verbal: 'badge badge-yellow',
  Pending: 'badge badge-gray',
  Converted: 'badge badge-teal',
};

export default function OutcomesPage() {
  const [activeTab, setActiveTab] = useState('tracking');
  const [outcomeData, setOutcomeData] = usePersistentState<OutcomeMetric[]>('outcomes.metrics', initialOutcomeData);
  const [materialLogs, setMaterialLogs] = usePersistentState<MaterialLog[]>('outcomes.material', initialMaterialLogs);
  const [pledges, setPledges] = usePersistentState<Pledge[]>('outcomes.pledges', initialPledges);
  const [donorContributions, setDonorContributions] = usePersistentState<DonorContribution[]>('donor-management.contributions', initialDonorContributions);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [pledgeModalOpen, setPledgeModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [outcomeForm, setOutcomeForm] = useState({ type: 'Contribution', count: '1' });
  const [pledgeForm, setPledgeForm] = useState({ donor: '', amount: '', cause: '', campaign: '', dueDate: '', category: 'Online Donations' });
  const [materialForm, setMaterialForm] = useState({ donor: '', item: '', project: '', value: '' });

  const logOutcome = () => {
    const count = Number(outcomeForm.count);
    if (!Number.isFinite(count) || count < 1) return;
    const month = new Date().toLocaleDateString('en-US', { month: 'short' });
    const key = outcomeForm.type === 'Contribution' ? 'contributions' : outcomeForm.type === 'Conversion' ? 'conversions' : 'pledges';
    setOutcomeData(current => current.some(row => row.month === month)
      ? current.map(row => row.month === month ? { ...row, [key]: row[key] + count } : row)
      : [...current, { month, contributions: 0, conversions: 0, pledges: 0, [key]: count }]);
    setOutcomeModalOpen(false);
  };

  const addPledge = () => {
    const amount = Number(pledgeForm.amount);
    if (!pledgeForm.donor.trim() || !Number.isFinite(amount) || amount < 1) return;
    setPledges(current => [{
      id: `PLG-${Date.now()}`, donor: pledgeForm.donor.trim(), amount: `₹${amount.toLocaleString('en-IN')}`,
      cause: pledgeForm.cause.trim(), campaign: pledgeForm.campaign.trim(),
      dueDate: pledgeForm.dueDate ? new Date(`${pledgeForm.dueDate}T00:00:00`).toLocaleDateString('en-GB') : 'Not set',
      category: pledgeForm.category, status: 'Pending',
    }, ...current]);
    setPledgeForm({ donor: '', amount: '', cause: '', campaign: '', dueDate: '', category: 'Online Donations' });
    setPledgeModalOpen(false);
  };

  const convertPledge = (pledge: Pledge) => {
    if (pledge.status === 'Converted') return;
    const amount = Number(pledge.amount.replace(/[₹,]/g, ''));
    setPledges(current => current.map(item => item.id === pledge.id ? { ...item, status: 'Converted' } : item));
    setDonorContributions(current => [...current, {
      donor: pledge.donor, category: pledge.category, amount,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    }]);
  };

  const addMaterial = () => {
    const value = Number(materialForm.value);
    if (!materialForm.donor.trim() || !materialForm.item.trim() || !Number.isFinite(value) || value < 0) return;
    setMaterialLogs(current => [{
      id: `MAT-${Date.now()}`, donor: materialForm.donor.trim(), item: materialForm.item.trim(),
      project: materialForm.project.trim() || 'Unassigned', date: new Date().toLocaleDateString('en-GB'), value: `₹${value.toLocaleString('en-IN')}`,
    }, ...current]);
    setMaterialForm({ donor: '', item: '', project: '', value: '' });
    setMaterialModalOpen(false);
  };

  const materialTotal = materialLogs.reduce((sum, log) => sum + Number(log.value.replace(/[₹,]/g, '')), 0);
  const latestMetrics = outcomeData[outcomeData.length - 1];
  const conversionRate = latestMetrics?.contributions ? `${(latestMetrics.conversions / latestMetrics.contributions * 100).toFixed(1)}%` : '0%';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Outcomes & Conversion</h1>
          <p className="page-subtitle">Track engagement outcomes, pledges, material donations, and revenue conversion</p>
        </div>
        <button className="btn-primary" onClick={() => setOutcomeModalOpen(true)}><Plus size={16} /> Log Outcome</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Latest Conversion Rate', value: conversionRate, color: '#10B981' },
          { label: 'Pledges Logged', value: String(pledges.length), color: '#1AACB8' },
          { label: 'Material Value Recorded', value: `₹${materialTotal.toLocaleString('en-IN')}`, color: '#6366F1' },
          { label: 'Revenue Streams', value: '4 active', color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl font-extrabold" style={{ color: s.color, fontFamily: 'Nunito, sans-serif' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tab-bar w-fit">
        {['tracking', 'pledges', 'material', 'revenue'].map(t => (
          <button key={t} className={`tab-item capitalize ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {activeTab === 'tracking' && (
        <>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Outcome Tracking – May to October 2025</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={outcomeData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="contributions" stroke="#1AACB8" strokeWidth={2.5} dot={{ r: 3 }} name="Contributions" />
                  <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} name="Conversions" />
                  <Line type="monotone" dataKey="pledges" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} name="Pledges" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-6 justify-center mt-2">
                {[
                  { label: 'Contributions', color: '#1AACB8' },
                  { label: 'Conversions', color: '#10B981' },
                  { label: 'Pledges', color: '#F59E0B' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-0.5 rounded" style={{ background: l.color, display: 'inline-block' }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Response Rate', value: '82%', icon: '📊' },
              { label: 'Avg Gift (Individual)', value: '₹18,400', icon: '💝' },
              { label: 'Cause Matched', value: '94%', icon: '🎯' },
              { label: 'Follow-up Scheduled', value: '87%', icon: '📅' },
            ].map(s => (
              <div key={s.label} className="stat-card flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="text-xl font-extrabold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'pledges' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <span className="card-title">Pledge Tracking</span>
            <button className="btn-primary text-xs py-1.5" onClick={() => setPledgeModalOpen(true)}><Plus size={13} /> Log Pledge</button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr><th>Donor</th><th>Pledge Amount</th><th>Cause</th><th>Campaign</th><th>Due Date</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pledges.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold text-slate-800">{p.donor}</td>
                    <td className="font-bold text-slate-700">{p.amount}</td>
                    <td className="text-xs">{p.cause}</td>
                    <td className="text-xs text-slate-600">{p.campaign}</td>
                    <td className="text-xs">{p.dueDate}</td>
                    <td><span className={pledgeStyle[p.status]}>{p.status}</span></td>
                    <td>
                      <button className="btn-secondary text-xs py-1" disabled={p.status === 'Converted'} onClick={() => convertPledge(p)}>{p.status === 'Converted' ? 'Donation Recorded' : 'Convert to Donation'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'material' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <span className="card-title">Material & Time Donations</span>
            <button className="btn-primary text-xs py-1.5" onClick={() => setMaterialModalOpen(true)}><Plus size={13} /> Log Material</button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr><th>Donor</th><th>Item / Description</th><th>Project</th><th>Date</th><th>Estimated Value</th></tr>
              </thead>
              <tbody>
                {materialLogs.map(m => (
                  <tr key={m.id}>
                    <td className="font-semibold text-slate-800">{m.donor}</td>
                    <td>{m.item}</td>
                    <td className="text-xs text-slate-600">{m.project}</td>
                    <td className="text-xs">{m.date}</td>
                    <td className="font-bold text-slate-700">{m.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { stream: 'Public Donations', sources: ['Individual Donors', 'Crowdfunding', 'Online Platforms', 'Events & Marathons'], icon: '👥', total: '₹1.2 Cr' },
            { stream: 'Corporate Giving', sources: ['CSR Funds', 'Employee Giving', 'Matching Grants', 'Brand Sponsorships'], icon: '🏢', total: '₹1.4 Cr' },
            { stream: 'Self-Funding', sources: ['Social Businesses', 'Training Fees', 'Course Fees', 'Memberships', 'Awards'], icon: '💼', total: '₹40L' },
            { stream: 'Grants & Funding', sources: ['Government Grants', 'Foreign Grants', 'Corpus / Endowment'], icon: '🎗️', total: '₹55L' },
          ].map(s => (
            <div key={s.stream} className="card">
              <div className="card-body flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="font-bold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{s.stream}</div>
                    <div className="text-xs text-slate-400">Total: {s.total}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {s.sources.map(src => (
                    <div key={src} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={12} className="text-teal-500 flex-shrink-0" />
                      {src}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={outcomeModalOpen} onClose={() => setOutcomeModalOpen(false)} title="Log Outcome" submitLabel="Save Outcome" onSubmit={logOutcome}>
        <SelectField label="Outcome metric" value={outcomeForm.type} onChange={value => setOutcomeForm(current => ({ ...current, type: value }))} options={['Contribution', 'Conversion', 'Pledge']} />
        <TextField label="Count" type="number" value={outcomeForm.count} onChange={value => setOutcomeForm(current => ({ ...current, count: value }))} required />
      </Modal>
      <Modal open={pledgeModalOpen} onClose={() => setPledgeModalOpen(false)} title="Log Pledge" submitLabel="Save Pledge" onSubmit={addPledge}>
        <TextField label="Donor" value={pledgeForm.donor} onChange={value => setPledgeForm(current => ({ ...current, donor: value }))} required wide />
        <TextField label="Amount (₹)" type="number" value={pledgeForm.amount} onChange={value => setPledgeForm(current => ({ ...current, amount: value }))} required />
        <SelectField label="Donation category" value={pledgeForm.category} onChange={value => setPledgeForm(current => ({ ...current, category: value }))} options={DONATION_CATEGORIES} />
        <TextField label="Cause" value={pledgeForm.cause} onChange={value => setPledgeForm(current => ({ ...current, cause: value }))} required />
        <TextField label="Campaign" value={pledgeForm.campaign} onChange={value => setPledgeForm(current => ({ ...current, campaign: value }))} />
        <TextField label="Due date" type="date" value={pledgeForm.dueDate} onChange={value => setPledgeForm(current => ({ ...current, dueDate: value }))} />
      </Modal>
      <Modal open={materialModalOpen} onClose={() => setMaterialModalOpen(false)} title="Log Material Donation" submitLabel="Save Donation" onSubmit={addMaterial}>
        <TextField label="Donor" value={materialForm.donor} onChange={value => setMaterialForm(current => ({ ...current, donor: value }))} required />
        <TextField label="Item / description" value={materialForm.item} onChange={value => setMaterialForm(current => ({ ...current, item: value }))} required />
        <TextField label="Project" value={materialForm.project} onChange={value => setMaterialForm(current => ({ ...current, project: value }))} />
        <TextField label="Estimated value (₹)" type="number" value={materialForm.value} onChange={value => setMaterialForm(current => ({ ...current, value }))} required />
      </Modal>
    </div>
  );
}
