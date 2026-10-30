import { useState } from 'react';
import { Gift, Bell, Calendar, Star, Plus } from 'lucide-react';
import usePersistentState from '../../hooks/usePersistentState';
import { Modal, SelectField, TextAreaField, TextField } from '../../components/people';

interface OccasionRecord {
  id: string; name: string; occasion: string; date: string; type: string; daysLeft: number;
  lastEngagement: string; priority: string; greetingSent?: boolean; greetingTemplate?: string;
}
interface GreetingTemplate { id: string; name: string; preview: string }

const initialOccasions: OccasionRecord[] = [
  { id: 'OCC-001', name: 'Ramesh Gupta', occasion: 'Birthday', date: '15 Oct 2025', type: 'Individual', daysLeft: 8, lastEngagement: '3 months ago', priority: 'High' },
  { id: 'OCC-002', name: 'Tata Trust Anniversary', occasion: 'Corporate Anniversary', date: '18 Oct 2025', type: 'Corporate', daysLeft: 11, lastEngagement: '6 months ago', priority: 'High' },
  { id: 'OCC-003', name: 'Sunita Mehra', occasion: 'Birthday', date: '22 Oct 2025', type: 'Individual', daysLeft: 15, lastEngagement: '1 month ago', priority: 'Medium' },
  { id: 'OCC-004', name: 'HCL Foundation Day', occasion: 'Foundation Day', date: '1 Nov 2025', type: 'Corporate', daysLeft: 25, lastEngagement: '2 months ago', priority: 'Medium' },
  { id: 'OCC-005', name: 'Meena Kapoor', occasion: 'Birthday', date: '5 Nov 2025', type: 'Individual', daysLeft: 29, lastEngagement: '8 months ago', priority: 'High' },
];

const initialGreetingTemplates: GreetingTemplate[] = [
  { id: 'TPL-001', name: 'Birthday – Individual', preview: 'Dear [Name], Wishing you a very happy birthday! On this special day, we at Hope Foundation...' },
  { id: 'TPL-002', name: 'Corporate Anniversary', preview: 'Dear [Organisation], As you celebrate this important milestone, we are grateful for your...' },
  { id: 'TPL-003', name: 'Festive Greetings (Diwali)', preview: 'Dear [Name], As the festival of lights approaches, we extend our warmest wishes to you...' },
  { id: 'TPL-004', name: 'Year-end Thank You', preview: 'Dear [Name], As we approach the end of 2025, we want to take a moment to thank you...' },
  { id: 'TPL-005', name: 'New Year Greeting', preview: 'Dear [Name], As we welcome a new year, we are filled with hope and gratitude for supporters like you...' },
];

const initialSettings = { autoSend: false, copyDepartmentHead: false, trackEngagement: true };

const priorityStyle: Record<string, string> = {
  High: 'badge badge-red',
  Medium: 'badge badge-yellow',
  Low: 'badge badge-gray',
};

export default function OccasionsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingOccasions, setUpcomingOccasions] = usePersistentState<OccasionRecord[]>('occasions.records', initialOccasions);
  const [greetingTemplates, setGreetingTemplates] = usePersistentState<GreetingTemplate[]>('occasions.templates', initialGreetingTemplates);
  const [reminderDays, setReminderDays] = usePersistentState('occasions.reminderDays', 7);
  const [settings, setSettings] = usePersistentState('occasions.settings', initialSettings);
  const [occasionModalOpen, setOccasionModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [greetingOccasion, setGreetingOccasion] = useState<OccasionRecord | null>(null);
  const [greetingForm, setGreetingForm] = useState({ templateId: '', message: '' });
  const [occasionForm, setOccasionForm] = useState({ name: '', occasion: 'Birthday', date: '', type: 'Individual', priority: 'Medium' });
  const [templateForm, setTemplateForm] = useState({ name: '', preview: '' });

  const addOccasion = () => {
    if (!occasionForm.name.trim() || !occasionForm.date) return;
    const dateValue = new Date(`${occasionForm.date}T00:00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    setUpcomingOccasions(current => [{
      id: `OCC-${Date.now()}`, name: occasionForm.name.trim(), occasion: occasionForm.occasion,
      date: dateValue.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      type: occasionForm.type, daysLeft: Math.max(0, Math.ceil((dateValue.getTime() - today.getTime()) / 86400000)),
      lastEngagement: 'No previous engagement', priority: occasionForm.priority,
    }, ...current]);
    setOccasionForm({ name: '', occasion: 'Birthday', date: '', type: 'Individual', priority: 'Medium' });
    setOccasionModalOpen(false);
  };

  const openGreeting = (occasion: OccasionRecord) => {
    const template = greetingTemplates.find(item => item.id === selectedTemplateId)
      ?? greetingTemplates.find(item => occasion.type === 'Corporate' ? item.name.includes('Corporate') : item.name.includes('Birthday'))
      ?? greetingTemplates[0];
    setGreetingOccasion(occasion);
    setGreetingForm({ templateId: template?.id ?? '', message: template?.preview.replace(/\[Name\]/g, occasion.name).replace(/\[Organisation\]/g, occasion.name) ?? '' });
  };

  const recordGreeting = () => {
    if (!greetingOccasion || !greetingForm.message.trim()) return;
    const template = greetingTemplates.find(item => item.id === greetingForm.templateId);
    setUpcomingOccasions(current => current.map(occasion => occasion.id === greetingOccasion.id
      ? { ...occasion, greetingSent: true, greetingTemplate: template?.name ?? 'Custom greeting' }
      : occasion));
    setGreetingOccasion(null);
  };

  const openTemplateEditor = (template?: GreetingTemplate) => {
    setEditingTemplateId(template?.id ?? null);
    setTemplateForm({ name: template?.name ?? '', preview: template?.preview ?? '' });
    setTemplateModalOpen(true);
  };

  const saveTemplate = () => {
    if (!templateForm.name.trim() || !templateForm.preview.trim()) return;
    if (editingTemplateId) {
      setGreetingTemplates(current => current.map(template => template.id === editingTemplateId ? { ...template, ...templateForm, name: templateForm.name.trim(), preview: templateForm.preview.trim() } : template));
    } else {
      setGreetingTemplates(current => [...current, { id: `TPL-${Date.now()}`, name: templateForm.name.trim(), preview: templateForm.preview.trim() }]);
    }
    setTemplateModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Occasions & Calendar</h1>
          <p className="page-subtitle">Track birthdays, anniversaries, and special occasions for personalized donor engagement</p>
        </div>
        <button className="btn-primary" onClick={() => setOccasionModalOpen(true)}><Plus size={16} /> Add Occasion</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tracked Occasions', value: String(upcomingOccasions.length), icon: '🎂', color: '#EC4899' },
          { label: 'Reminder Window', value: `${reminderDays} days`, icon: '🔔', color: '#1AACB8' },
          { label: 'Greetings Recorded', value: String(upcomingOccasions.filter(occasion => occasion.greetingSent).length), icon: '✉️', color: '#10B981' },
          { label: 'Upcoming (30 days)', value: String(upcomingOccasions.filter(occasion => occasion.daysLeft <= 30).length), icon: '📅', color: '#6366F1' },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className="text-2xl font-extrabold" style={{ color: s.color, fontFamily: 'Nunito, sans-serif' }}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reminder config */}
      <div className="card">
        <div className="card-body flex items-center gap-4 flex-wrap">
          <Bell size={18} style={{ color: '#1AACB8' }} />
          <span className="text-sm font-semibold text-slate-700">Reminder window:</span>
          <div className="flex gap-2">
            {[3, 5, 7, 14].map(d => (
              <button key={d}
                onClick={() => setReminderDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  reminderDays === d ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-600 border-slate-200'
                }`}>{d} days before</button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-auto">Auto-alerts enabled ✓</span>
        </div>
      </div>

      <div className="tab-bar w-fit">
        {['upcoming', 'templates', 'settings'].map(t => (
          <button key={t} className={`tab-item capitalize ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {activeTab === 'upcoming' && (
        <div className="flex flex-col gap-3">
          {selectedTemplateId && <div className="text-sm text-teal-700">Selected template: {greetingTemplates.find(template => template.id === selectedTemplateId)?.name}</div>}
          {upcomingOccasions.map(o => (
            <div key={o.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="p-3 rounded-xl" style={{ background: '#FCE7F3' }}>
                  <Gift size={22} style={{ color: '#EC4899' }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{o.name}</div>
                  <div className="text-xs text-slate-500">{o.occasion} · {o.date} · Last contact: {o.lastEngagement}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-lg font-extrabold" style={{ color: '#1AACB8', fontFamily: 'Nunito, sans-serif' }}>{o.daysLeft}</div>
                    <div className="text-[10px] text-slate-400">days left</div>
                  </div>
                  <span className={priorityStyle[o.priority]}>{o.priority}</span>
                  <button className="btn-primary text-xs py-1.5" disabled={o.greetingSent} onClick={() => openGreeting(o)}>{o.greetingSent ? 'Greeting Recorded' : 'Send Greeting'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {greetingTemplates.map(t => (
            <div key={t.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Star size={15} style={{ color: '#F59E0B' }} />
                  <span className="font-bold text-slate-800 text-sm">{t.name}</span>
                </div>
                <p className="text-xs text-slate-500 italic leading-relaxed">{t.preview}</p>
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1 text-xs py-1.5" onClick={() => openTemplateEditor(t)}>Edit Template</button>
                  <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => { setSelectedTemplateId(t.id); setActiveTab('upcoming'); }}>Use Template</button>
                </div>
              </div>
            </div>
          ))}
          <button className="card border-2 border-dashed border-slate-200 hover:border-teal-300 transition-all text-center" onClick={() => openTemplateEditor()}>
            <div className="card-body flex flex-col items-center justify-center gap-2 min-h-[120px] text-slate-400 hover:text-teal-500 transition-colors">
              <Plus size={24} />
              <span className="text-sm font-semibold">Create New Template</span>
            </div>
          </button>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Occasion Settings</span></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'autoSend', label: 'Auto-send on Birthday' },
              { key: 'copyDepartmentHead', label: 'CC to Department Head' },
              { key: 'trackEngagement', label: 'Track Engagement After Send' },
            ].map(setting => <label key={setting.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span className="text-sm text-slate-700">{setting.label}</span>
              <input type="checkbox" className="h-4 w-4 accent-teal-600" checked={settings[setting.key as keyof typeof settings]} onChange={event => setSettings(current => ({ ...current, [setting.key]: event.target.checked }))} />
            </label>)}
          </div>
        </div>
      )}

      <Modal open={occasionModalOpen} onClose={() => setOccasionModalOpen(false)} title="Add Occasion" submitLabel="Save Occasion" onSubmit={addOccasion}>
        <TextField label="Person or organisation" value={occasionForm.name} onChange={value => setOccasionForm(current => ({ ...current, name: value }))} required wide />
        <SelectField label="Occasion" value={occasionForm.occasion} onChange={value => setOccasionForm(current => ({ ...current, occasion: value }))} options={['Birthday', 'Corporate Anniversary', 'Foundation Day', 'Other']} />
        <SelectField label="Relationship type" value={occasionForm.type} onChange={value => setOccasionForm(current => ({ ...current, type: value }))} options={['Individual', 'Corporate']} />
        <TextField label="Date" type="date" value={occasionForm.date} onChange={value => setOccasionForm(current => ({ ...current, date: value }))} required />
        <SelectField label="Priority" value={occasionForm.priority} onChange={value => setOccasionForm(current => ({ ...current, priority: value }))} options={['High', 'Medium', 'Low']} />
      </Modal>

      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} title={editingTemplateId ? 'Edit Greeting Template' : 'Create Greeting Template'} submitLabel="Save Template" onSubmit={saveTemplate}>
        <TextField label="Template name" value={templateForm.name} onChange={value => setTemplateForm(current => ({ ...current, name: value }))} required wide />
        <TextAreaField label="Greeting message" value={templateForm.preview} onChange={value => setTemplateForm(current => ({ ...current, preview: value }))} required wide />
      </Modal>

      <Modal open={!!greetingOccasion} onClose={() => setGreetingOccasion(null)} title={`Greeting for ${greetingOccasion?.name ?? ''}`} submitLabel="Record Greeting Sent" onSubmit={recordGreeting}>
        <SelectField label="Template" value={greetingForm.templateId} onChange={value => {
          const template = greetingTemplates.find(item => item.id === value);
          setGreetingForm(current => ({ ...current, templateId: value, message: template?.preview.replace(/\[Name\]/g, greetingOccasion?.name ?? '').replace(/\[Organisation\]/g, greetingOccasion?.name ?? '') ?? current.message }));
        }} options={greetingTemplates.map(template => template.id)} />
        <TextAreaField label="Message" value={greetingForm.message} onChange={value => setGreetingForm(current => ({ ...current, message: value }))} required wide />
      </Modal>
    </div>
  );
}
