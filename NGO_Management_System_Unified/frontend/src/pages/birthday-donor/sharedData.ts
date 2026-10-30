export const donorProfiles = [
  { id: 1, name: 'Asha Nair', type: 'Individual', city: 'Bengaluru', status: 'Active', relation: 'Regular', cause: 'Education', amount: '₹2.4L', lastContact: '2 days ago' },
  { id: 2, name: 'Sparsh Foods Pvt Ltd', type: 'Corporate', city: 'Pune', status: 'Engaged', relation: 'Corporate Partner', cause: 'Nutrition', amount: '₹12.8L', lastContact: '5 days ago' },
  { id: 3, name: 'Rural Impact Collective', type: 'Corporate', city: 'Delhi', status: 'New', relation: 'Network', cause: 'Women Empowerment', amount: '₹8.1L', lastContact: '1 week ago' },
  { id: 4, name: 'Nitin Mehta', type: 'Individual', city: 'Jaipur', status: 'Retention', relation: 'Recurring', cause: 'Health', amount: '₹3.7L', lastContact: '3 days ago' },
  { id: 5, name: 'Kirana Foundation', type: 'Corporate', city: 'Ahmedabad', status: 'Active', relation: 'Grant Partner', cause: 'Climate', amount: '₹15.2L', lastContact: '9 days ago' },
  { id: 6, name: 'Vihaan Group', type: 'Corporate', city: 'Hyderabad', status: 'Active', relation: 'Sponsorship', cause: 'Livelihood', amount: '₹19.5L', lastContact: '4 days ago' },
];

export const birthdayProfiles = [
  { id: 1, name: 'Rajesh Kumar', relation: 'Individual', interest: 'Education, Women support', status: 'Warm', nextAction: 'Call and gift', city: 'Patna' },
  { id: 2, name: 'Lakshmi & Co.', relation: 'Corporate', interest: 'Healthcare', status: 'Engaged', nextAction: 'CSR follow-up', city: 'Chennai' },
  { id: 3, name: 'Shailja Verma', relation: 'Volunteer', interest: 'Community outreach', status: 'Conversion', nextAction: 'Send thank-you note', city: 'Lucknow' },
  { id: 4, name: 'Uday Foundation', relation: 'Partner', interest: 'School nutrition', status: 'Active', nextAction: 'Occasion reminder', city: 'Nagpur' },
];

export const contributionData = [
  { month: 'Jan', amount: 120000 },
  { month: 'Feb', amount: 145000 },
  { month: 'Mar', amount: 131000 },
  { month: 'Apr', amount: 160000 },
  { month: 'May', amount: 176000 },
  { month: 'Jun', amount: 182000 },
  { month: 'Jul', amount: 205000 },
  { month: 'Aug', amount: 214000 },
  { month: 'Sep', amount: 198000 },
];

export const revenueByCategory = [
  { name: 'Public', value: 42, color: '#1AACB8' },
  { name: 'Corporate', value: 31, color: '#3B82F6' },
  { name: 'Self-funding', value: 19, color: '#10B981' },
  { name: 'Grants', value: 8, color: '#F59E0B' },
];

export const donorTasks = [
  { title: 'Call donor Asha Nair', type: 'Call', assignee: 'Priya', status: 'Pending' },
  { title: 'Visit Lakshmi & Co. team', type: 'Visit', assignee: 'Vivek', status: 'In progress' },
  { title: 'Send thank-you note to Veena', type: 'Gift', assignee: 'Raj', status: 'Completed' },
];

export const birthdayTasks = [
  { title: 'Prepare birthday gift packet', type: 'Gift', assignee: 'Ritu', status: 'Pending' },
  { title: 'Call donor for occasion reminder', type: 'Call', assignee: 'Nisha', status: 'Scheduled' },
  { title: 'Document outreach feedback', type: 'Visit', assignee: 'Arun', status: 'Completed' },
];

export const campaignData = [
  { name: 'School Meals', progress: 78, amount: '₹18.5L', status: 'Active' },
  { name: 'Women Skill Up', progress: 61, amount: '₹14.2L', status: 'Active' },
  { name: 'Health Outreach', progress: 44, amount: '₹9.3L', status: 'Upcoming' },
  { name: 'Forest Guardians', progress: 92, amount: '₹21.1L', status: 'Completed' },
];

export const causeData = [
  { name: 'Education Access', donors: 240, budget: '₹42L' },
  { name: 'Women Empowerment', donors: 164, budget: '₹38L' },
  { name: 'Healthcare Outreach', donors: 132, budget: '₹29L' },
  { name: 'Climate Resilience', donors: 118, budget: '₹24L' },
];

export const deptWorkspaces = [
  'Project Management', 'Administration', 'Data & Tech', 'Finance', 'HR', 'Risk Management', 'Research & Innovation', 'Marketing', 'Networking'
];

export const departmentMetrics = [
  { dept: 'Project Management', tasks: 42, completion: '84%' },
  { dept: 'Finance', tasks: 28, completion: '91%' },
  { dept: 'Marketing', tasks: 37, completion: '76%' },
  { dept: 'Research & Innovation', tasks: 18, completion: '68%' },
];

export const monthlyTrend = [
  { month: 'Jan', donors: 120, contributions: 180000 },
  { month: 'Feb', donors: 134, contributions: 213500 },
  { month: 'Mar', donors: 146, contributions: 192000 },
  { month: 'Apr', donors: 155, contributions: 248000 },
  { month: 'May', donors: 164, contributions: 261000 },
  { month: 'Jun', donors: 180, contributions: 282000 },
];

export const cityDistribution = [
  { place: 'Bengaluru', count: 42 },
  { place: 'Mumbai', count: 38 },
  { place: 'Delhi', count: 29 },
  { place: 'Hyderabad', count: 24 },
  { place: 'Ahmedabad', count: 21 },
];

export const donorSegments = [
  { name: 'New', value: 18, color: '#14b8a6' },
  { name: 'Existing', value: 52, color: '#3b82f6' },
  { name: 'Lapsed', value: 21, color: '#f59e0b' },
  { name: 'High value', value: 9, color: '#8b5cf6' },
];

export const communicationTimeline = [
  { date: '09 Oct', action: 'Called donor to confirm annual pledge', type: 'Call' },
  { date: '08 Oct', action: 'Project appreciation note shared', type: 'Email' },
  { date: '06 Oct', action: 'Meeting held with CSR sponsor', type: 'Meeting' },
];

export const donorPipeline = [
  { lane: 'Identify', items: ['Asha Nair', 'Kiran Sharma'] },
  { lane: 'Profile', items: ['Vihaan Group', 'Rural Impact Collective'] },
  { lane: 'Connect', items: ['Sparsh Foods'] },
  { lane: 'Inspire Donation', items: ['Nitin Mehta'] },
  { lane: 'Engage', items: ['Kirana Foundation'] },
  { lane: 'Maintain Relationship', items: [] },
];

export const activityLog = [
  { label: 'System alert sent', done: true },
  { label: 'Previous relationship reviewed', done: true },
  { label: 'Cause interests validated', done: true },
  { label: 'Staff assignment confirmed', done: false },
  { label: 'Follow-up scheduled', done: false },
];

export const rolePermissions = [
  { role: 'Admin', routes: 'All routes', actions: 'Full control', data: 'All records' },
  { role: 'Staff', routes: 'Dashboard, Donors, Reports', actions: 'Create & update', data: 'Assigned teams' },
  { role: 'Volunteer', routes: 'Birthday Project', actions: 'Task cards only', data: 'Read-only notes' },
  { role: 'Board', routes: 'Reports, dashboards', actions: 'View reports', data: 'Aggregated data' },
  { role: 'Donor', routes: 'No module access', actions: 'Not applicable', data: 'No access' },
];
