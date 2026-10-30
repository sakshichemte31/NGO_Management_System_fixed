import type { DepartmentKey } from '../types/project';

/** Department checklist templates – generated from Proposals Master Sheet.xlsx › Sheet2. */
export interface DepartmentMeta { key: DepartmentKey; name: string; short: string; color: string; bg: string }

export const DEPARTMENTS: DepartmentMeta[] = [
  { key: 'admin_legal', name: 'Admin & Legal', short: 'Admin', color: '#5B21B6', bg: '#EDE9FE' },
  { key: 'hr', name: 'HR', short: 'HR', color: '#0F766E', bg: '#CCFBF1' },
  { key: 'marketing', name: 'Marketing & Networking', short: 'Marketing', color: '#BE185D', bg: '#FCE7F3' },
  { key: 'finance', name: 'Finance', short: 'Finance', color: '#065F46', bg: '#D1FAE5' },
  { key: 'fundraising', name: 'Fundraising', short: 'Fundraising', color: '#92400E', bg: '#FEF3C7' },
  { key: 'operations', name: 'Operations', short: 'Ops', color: '#1E40AF', bg: '#DBEAFE' },
  { key: 'mel', name: 'MEL', short: 'MEL', color: '#9A3412', bg: '#FFEDD5' },
  { key: 'innovation', name: 'Innovation & Crisis', short: 'Innovation', color: '#991B1B', bg: '#FEE2E2' },
  { key: 'data_tech', name: 'Data & Tech', short: 'Data', color: '#334155', bg: '#E2E8F0' },
];
export const deptName = (k: DepartmentKey | null | undefined): string => DEPARTMENTS.find(d => d.key === k)?.name ?? '—';

export const DEPARTMENT_TEMPLATES: Record<DepartmentKey, { title: string; items: string[] }[]> = {
  admin_legal: [
  {
    "title": "Statutory",
    "items": [
      "Trust Registration Certificate",
      "80G & 12A Trust deed",
      "Pancard",
      "BRCL/Bank Acc",
      "Aligned Objectives",
      "TAN no",
      "CSR -1",
      "ITR 3 years",
      "NGO Profile",
      "Three years annual report",
      "NITI Aayog/NGO Darpan"
    ]
  },
  {
    "title": "Project-related documents",
    "items": [
      "Authority letter",
      "Detail project report",
      "Sub-project proposal",
      "Request letter",
      "M & E Framework Report",
      "Project Related Past Activity Report",
      "Risk Management Report",
      "Project Team Documents"
    ]
  },
  {
    "title": "Policy documents required",
    "items": [
      "Financial management (FM) policy",
      "HR policy",
      "Conflict of interest policy",
      "Data protection & privacy policy",
      "Risk/crisis management policy",
      "Safe Guarding policy (POSH)",
      "Equality And Diversity",
      "Document Retention Policy",
      "Procurement policy",
      "Governance & Ethics Standards",
      "Programme and project management policy",
      "Communication and branding policy",
      "Fundraising and donor management policy",
      "Operation and administration policy",
      "Partnership and networking policy",
      "Environmental and sustainability policy",
      "M&E policy",
      "Learning (MEL) policy",
      "Nutrition and food safety policy",
      "Health And Medical ethics policy",
      "Asset management policy"
    ]
  },
  {
    "title": "Special asks",
    "items": [
      "LEI",
      "E-Anudan",
      "FCRA"
    ]
  }
],
  hr: [
  {
    "title": "Execution preparedness",
    "items": [
      "Staff JD & targets",
      "Hiring checklist",
      "Volunteer acquiring & onboarding",
      "Committee formation & meetings plan scheduling",
      "Staff+intern+volunteer training & capacity building plan",
      "Attendance & performance tracking",
      "Payroll & benefits",
      "Employee engagement",
      "Organize internal meeting",
      "Exit management",
      "Intern & corporate bridging (internal placement cell)",
      "HR legal & policy wise committee meetings",
      "Conflict resolution",
      "Company culture management"
    ]
  }
],
  marketing: [
  {
    "title": "Marketing & networking",
    "items": [
      "Short proposals & grant designing",
      "Posters",
      "PPT",
      "Video ads",
      "Social media post content for quarter",
      "Online & offline campaigns inc fundraising(add auction, sponsor, subscribers fees, events, etc.)",
      "Impact awareness strategy plan",
      "Field photo & video checklist",
      "Review & testimonials collection schedule",
      "Social media wise schedule calendar",
      "Blogs writing",
      "Stakeholders digital rewarding plan",
      "New networking",
      "Paid ads management",
      "Awards applying",
      "Story telling strategy",
      "AIDA"
    ]
  }
],
  finance: [
  {
    "title": "Finance",
    "items": [
      "Financial account booking audit",
      "Expense classification & alignment with rules",
      "Auditing committee inspection visit plan",
      "Monthly study report over changes in charity rules & best practices",
      "Staff accounts management system",
      "Tender management system & frameworks",
      "FCRA compliance",
      "Compliances (80g filing -10BD, audit filing, etc) fulfillment",
      "Grant & donor management",
      "Financial strategy & expense control",
      "Cashflow + balance sheet + P&L"
    ]
  }
],
  fundraising: [
  {
    "title": "Fundraising",
    "items": [
      "Short proposals & grant writing",
      "Posters & PPT content writing",
      "DPR reports quotation collection",
      "Tender process",
      "Funding diversification planning",
      "Donor relation",
      "Key stakeholders relation",
      "Funds related networking",
      "Events planning",
      "CSR partnerships",
      "MOU signing",
      "Funds tracking",
      "Donor traceability report sharing",
      "Donor lifecycle management",
      "Target segmenting for new & old",
      "Grant pipeline management"
    ]
  }
],
  operations: [
  {
    "title": "Operations",
    "items": [
      "Operations planning",
      "All stakeholders Work Scheduling",
      "Resource & inventory mobilization",
      "Fast-track decision making framework",
      "Expansion strategy reporting",
      "Permissions",
      "Approvals record keeping",
      "Logistic & coordination",
      "Quality control",
      "Inter-departmental coordination",
      "Management reporting",
      "Beneficiary relation & management"
    ]
  }
],
  mel: [
  {
    "title": "Monitoring, evaluation & learning",
    "items": [
      "M&E sheets with KPIs",
      "Staff & other stakeholders record keeping system (daily, weekly, monthly, quarterly & yearly)",
      "Audit & Inspection committee activities scheduling",
      "Work & Impact efficiency analysing framework",
      "Data story for case studies",
      "Research paper & book/articles",
      "All stakeholders review/feedback management system",
      "Learning & improvement plans & internal magazine/newsletter",
      "Donation traceability & impact report"
    ]
  }
],
  innovation: [
  {
    "title": "Innovation & crisis",
    "items": [
      "Risk registry",
      "Scalability modelling plan",
      "Need assessment report",
      "Study of existing social innovation models report",
      "Project wise best practices suggestion circular",
      "Research - problem statements & concept notes for PHD students & scientists",
      "Organizational level research papers proposal",
      "Department WISE innovation reports"
    ]
  }
],
  data_tech: [
  {
    "title": "Data & tech",
    "items": [
      "Data collection framework each Stakeholder",
      "Data Flow",
      "Digitalisation of operations",
      "Decision making sheets and reports",
      "Integration Of digital Tools and its Training",
      "Data mining & Validation",
      "Data privacy policy exhibition",
      "Managing data with coordination of all departments",
      "Website and digital infrastructure management",
      "Developing applications",
      "Digital social work",
      "Research Center Data management",
      "Cyber security",
      "Automation",
      "Customer relation system management with team",
      "SEO"
    ]
  }
]
};
