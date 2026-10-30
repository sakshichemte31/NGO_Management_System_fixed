import type { ManagerOption, Project } from '../types/project';
import { buildProject } from './mockBuilders';

export const MANAGERS: ManagerOption[] = [
  { id: 'u-01', name: 'Priya Sharma' }, { id: 'u-02', name: 'Rahul Mehta' }, { id: 'u-03', name: 'Anita Patel' },
];

export const SECTORS = ['Education', 'Health', 'Environment', 'Livelihood', 'Technology', 'Social Welfare'];

const p1 = buildProject({
  id: 'p-001', proposalId: 'PR-2026-003', name: 'Shiksha Setu – Rural Mentorship Programme', sector: 'Education',
  why: 'First-generation learners in rural Maharashtra drop out after Class 8 for lack of academic guidance and role models.',
  problem: 'Only 41% of students in the target blocks complete Class 10. Schools lack subject mentors, career guidance and remedial support.',
  sdg: [4, 10], currentStatus: 'Pilot', activeSince: '2026-04-01',
  geo: { stage1: 'Mulshi block, Pune', stage2: 'Pune district (4 blocks)', stage3: 'Western Maharashtra' },
  status: 'Active', managerId: 'u-01', managerName: 'Priya Sharma',
  plan: {
    start: '2026-04-01', end: '2027-03-31', stage: 3, stageProgress: 45, months: 12,
    direct: ['Class 8–10 students receive weekly subject mentoring, career counselling and remedial classes.', [
      ['Students enrolled in mentoring', 'students', 1000, 760], ['Average attendance in mentoring sessions', '%', 85, 81], ['Students passing Class 10 boards', '%', 90, 0]]],
    indirect: ['Parents and teachers of mentored students gain awareness of scholarships and career paths.', [
      ['Parent meetings held', 'meetings', 48, 30], ['Teachers trained in remedial methods', 'teachers', 120, 84]]],
    societal: ['Higher school completion strengthens local human capital and reduces early marriage and child labour.', [
      ['Schools adopting the mentoring model', 'schools', 25, 14], ['Dropout rate in target villages', '%', 8, 14]]],
    ben: ['Students (Class 8–10)', 1000, 'Parents & teachers', 4200,
      'Households screened through school records and a door-to-door survey; priority to first-generation learners, girls and SC/ST families.',
      'UDISE+ school records, baseline learning assessment, village survey', 'Priority seats reserved for girls (min. 55%).'],
    milestones: [
      ['Baseline assessment completed', 1, '2026-05-15', 'Done', 'Priya Sharma'], ['40 mentors recruited & trained', 2, '2026-07-10', 'Done', 'Sneha Kulkarni'],
      ['Mentoring launched in 25 schools', 3, '2026-08-01', 'Done', 'Priya Sharma'], ['Mid-term impact review', 3, '2026-11-15', 'In Progress', 'Ravi Deshmukh'],
      ['Restructure curriculum from mid-term findings', 4, '2027-01-10', 'Pending', 'Priya Sharma'], ['Replication toolkit published', 5, '2027-03-20', 'Pending', 'Ravi Deshmukh']],
    team: { core: 'Director, project core team, area-wise core team', advisory: 'Educationalists, journalists, bureaucrats, field experts', working: 'School teachers, ASHA workers, local grocery store owners, volunteers',
      members: [['Dr. Meera Kulkarni', 'Director – Programmes', 'Core'], ['Priya Sharma', 'Project Manager', 'Core'], ['Ravi Deshmukh', 'Area Coordinator – Mulshi', 'Core'],
        ['Prof. S. Bhide', 'Educationalist', 'Advisory', 'SPPU Pune'], ['Anjali Gokhale', 'Journalist', 'Advisory', 'Local Daily'],
        ['Sneha Kulkarni', 'Head Mentor', 'Working'], ['Mahesh Pawar', 'School Principal', 'Working', 'ZP School Mulshi']] },
    stakeholders: [['Zilla Parishad Education Dept.', 'Key', 'Govt. of Maharashtra'], ['Village School Management Committees', 'Key', 'Mulshi'], ['Gram Panchayats', 'Other', 'Mulshi']],
    partners: [['SPPU Department of Education', 'Research Body', 'Learning assessment design'], ['Block Education Office', 'Government Body', 'School access & data'], ['Tata Consultancy Services', 'Organisation', 'Volunteer mentors']],
    ngos: [['Pratham', 'https://www.pratham.org', 'Learning-level assessment tools'], ['Teach For India', 'https://www.teachforindia.org', 'Fellowship model – potential knowledge partner']],
    volunteers: [['MBA students', 15], ['MBBS students', 10]],
    authority: [['Project Manager, Project coordinator', 1, 500000]], office: [['Data Operator', 2, 300000]], field: [['Mentor/Teacher', 10, 500000]],
    frequent: [['Rent', 12, 25000]], infrequent: [['Wifi recharge', 2, 3000]], small: [['Table & chair', 5, 1300]], big: [['Printer', 1, 35000]],
    funding: { p1: [['CSR grant – Infosys Foundation', 4000000, 'Committed']], p2: [['Corporate employee giving – TCS', 1500000, 'Applied']], p3: [['Individual donors & crowdfunding', 947500, 'Identified']],
      call: 'Sponsor a mentor: ₹50,000 funds one village mentor for a full year.',
      donors: [['CSR', ['Infosys Foundation', 'TCS CSR']], ['HNI / Individuals', ['Alumni network', 'Rotary Club Pune']], ['Crowdfunding', ['Ketto campaign']]],
      material: ['Books & stationery kits', 'Tablets for e-content'], event: ['Annual Scholar Day', 'Career fair'], marketing: ['Radio spots', 'School newsletter ad space']},
    responsibility: ['operations', 'hr', 'mel', 'fundraising', 'finance', 'admin_legal', 'marketing'],
  },
});

const p2 = buildProject({
  id: 'p-002', proposalId: 'PR-2026-001', name: 'Jal Suraksha – Village Water Security', sector: 'Environment',
  why: 'Recurrent drought in Marathwada leaves women walking 3–4 km daily for drinking water.',
  problem: '68% of households in 18 villages depend on tankers for 5 months a year; groundwater has fallen 6 m in a decade.',
  sdg: [6, 13, 5], currentStatus: 'Seed', activeSince: '2026-01-15',
  geo: { stage1: '6 villages, Beed', stage2: 'Beed district', stage3: 'Marathwada region' },
  status: 'Active', managerId: 'u-03', managerName: 'Anita Patel',
  plan: {
    start: '2026-01-15', end: '2027-01-14', stage: 3, stageProgress: 70, months: 12,
    direct: ['Households get year-round access to safe drinking water via recharge structures and community RO units.', [
      ['Households with safe water access', 'households', 2400, 1650], ['Recharge structures built', 'structures', 60, 44]]],
    indirect: ['Women and children gain time for schooling and income; fewer waterborne illnesses.', [
      ['Water user committees formed', 'committees', 18, 18], ['Reduction in waterborne illness cases', '%', 40, 28]]],
    societal: ['Improved groundwater table and climate resilience in the watershed.', [['Groundwater level rise', 'metres', 2, 1.1], ['Villages declared tanker-free', 'villages', 18, 9]]],
    ben: ['Households', 2400, 'Women & children', 11000, 'Gram Sabha resolution plus household water-stress survey; priority to tanker-dependent hamlets.', 'Gram Panchayat records, GSDA groundwater data', 'Women-led water user committees.'],
    milestones: [['Hydrogeological survey', 1, '2026-02-28', 'Done', 'Anita Patel'], ['Water committees formed', 2, '2026-04-30', 'Done', 'Kavita More'], ['44 of 60 structures complete', 3, '2026-09-30', 'Done', 'Santosh Jadhav'], ['Remaining structures before monsoon audit', 3, '2026-12-15', 'In Progress', 'Santosh Jadhav'], ['Handover to Gram Panchayats', 4, '2027-01-10', 'Pending', 'Anita Patel']],
    team: { core: 'Director, WASH lead, area-wise engineers', advisory: 'Hydrogeologists, retired irrigation officers', working: 'Gram sevaks, local masons, water user committees',
      members: [['Dr. Meera Kulkarni', 'Director – Programmes', 'Core'], ['Anita Patel', 'Project Manager', 'Core'], ['Santosh Jadhav', 'Site Engineer', 'Core'], ['Dr. R. Joshi', 'Hydrogeologist', 'Advisory', 'GSDA'], ['Kavita More', 'Community Mobiliser', 'Working']] },
    stakeholders: [['Gram Panchayats (18)', 'Key', 'Beed'], ['Zilla Parishad – Water Supply', 'Key', 'Govt.'], ['Local mason association', 'Other', 'Beed']],
    partners: [['GSDA Maharashtra', 'Government Body', 'Groundwater data'], ['IIT Bombay – CTARA', 'Research Body', 'Technical design'], ['Mahindra CSR', 'Organisation', 'Co-funding']],
    ngos: [['WOTR', 'https://wotr.org', 'Watershed practices'], ['Paani Foundation', 'https://www.paanifoundation.in', 'Village competition model']],
    volunteers: [['Civil engineering students', 20], ['Local youth', 30]],
    authority: [['Project Manager', 1, 600000], ['Technical Lead', 1, 720000]], office: [['Accounts & Data Officer', 2, 360000]], field: [['Community Mobiliser', 8, 300000], ['Site Supervisor', 4, 420000]],
    frequent: [['Office & site rent', 12, 18000], ['Fuel & transport', 12, 22000]], infrequent: [['Water quality testing', 4, 45000], ['Gram Sabha meetings', 6, 12000]],
    small: [['Water testing kits', 6, 8500], ['Laptops & tablets', 4, 42000]], big: [['Borewell recharge drilling rig (rental deposit)', 1, 450000], ['Field vehicle', 1, 780000]],
    funding: { p1: [['CSR – Mahindra Foundation', 3500000, 'Committed']], p2: [['Maharashtra Jal Sandharan grant', 2000000, 'Applied']], p3: [['Individual & NRI donors', 900000, 'Identified']],
      call: 'Fund a recharge well for ₹35,000 – benefits 12 families for 10+ years.',
      donors: [['CSR', ['Mahindra Foundation', 'L&T CSR']], ['Government', ['Jal Sandharan Dept.']], ['NRI donors', ['Maharashtra Mandal network']]],
      material: ['Cement & PVC pipes in-kind'], event: ['Jal Yatra awareness walk'], marketing: ['Documentary film sponsorship']},
    responsibility: ['operations', 'finance', 'mel', 'admin_legal', 'fundraising', 'hr', 'innovation'],
  },
});

const p3 = buildProject({
  id: 'p-003', proposalId: 'PR-2026-011', name: 'Digital Saathi – Rural Digital Literacy', sector: 'Technology',
  why: 'Rural adults cannot access e-governance, UPI and telehealth due to low digital skills.',
  problem: 'Only 19% of adults in target gram panchayats can use a smartphone for services; 70% rely on middlemen for forms and payments.',
  sdg: [4, 9, 10], currentStatus: 'Ideation', activeSince: '2027-01-05',
  geo: { stage1: '8 villages, Satara', stage2: 'Satara district', stage3: 'Western Maharashtra' },
  status: 'Upcoming', managerId: 'u-07', managerName: 'Neha Joshi',
  plan: {
    start: '2027-01-05', end: '2027-12-31', stage: 1, stageProgress: 40, months: 12,
    direct: ['Adults and senior citizens trained in smartphone use, UPI, DigiLocker and e-governance portals.', [['Adults trained', 'learners', 1800, 0], ['Learners completing 3 digital tasks independently', '%', 75, 0]]],
    indirect: ['Families gain access to schemes, banking and online learning.', [['Households accessing e-services', 'households', 900, 0]]],
    societal: ['Reduced dependence on middlemen; improved inclusion in the digital economy.', [['Villages certified digitally literate', 'villages', 8, 0]]],
    ben: ['Adults (18+)', 1800, 'Households', 7200, 'Open enrolment at Gram Panchayat digital centres; women & senior citizens prioritised.', 'Enrolment forms, pre/post digital skills test', 'Training in Marathi; low-literacy friendly content.'],
    milestones: [['Stakeholder proposal presentation', 1, '2026-11-20', 'In Progress', 'Neha Joshi'], ['Digital centres identified (8)', 2, '2027-01-31', 'Pending', 'Neha Joshi'], ['Trainer hiring', 2, '2027-02-15', 'Pending', 'Aditi Phadke']],
    team: { core: 'Director, tech lead, village coordinators', advisory: 'Digital inclusion experts, CSC officials', working: 'Gram sevaks, school IT teachers, youth volunteers',
      members: [['Neha Joshi', 'Project Manager', 'Core'], ['Aditi Phadke', 'Training Lead', 'Core'], ['Kiran Bhosale', 'CSC District Manager', 'Advisory', 'CSC e-Governance']] },
    stakeholders: [['Gram Panchayats (8)', 'Key', 'Satara'], ['CSC e-Governance Services', 'Key', 'MeitY']],
    partners: [['Google.org', 'Organisation', 'Content & devices'], ['NIELIT', 'Government Body', 'Certification']],
    ngos: [['Digital Empowerment Foundation', 'https://www.defindia.org', 'Wireless for Communities model']],
    volunteers: [['Engineering students', 25], ['Retired bank staff', 10]],
    authority: [['Project Manager', 1, 600000]], office: [['Data Operator', 1, 300000]], field: [['Digital Trainer', 6, 360000]],
    frequent: [['Centre rent', 12, 15000]], infrequent: [['Internet connectivity', 4, 12000]],
    small: [['Tablets for training', 20, 9500]], big: [['Projector set', 2, 48000]],
    funding: { p1: [['Google.org grant', 2500000, 'Committed']], p2: [['CSR – Wipro Foundation', 1000000, 'Applied']], p3: [['Individual donors', 300000, 'Identified']],
      call: 'Donate a tablet (₹9,500) to a village digital centre.', donors: [['CSR', ['Wipro', 'Cognizant']], ['Tech philanthropy', ['Google.org']]],
      material: ['Refurbished laptops'], event: ['Digital Mela'], marketing: ['Telecom partner SMS campaign']},
    responsibility: ['hr', 'data_tech', 'operations', 'fundraising', 'admin_legal', 'marketing', 'mel'],
  },
});


export const MOCK_PROJECTS: Project[] = [p1, p2, p3];
