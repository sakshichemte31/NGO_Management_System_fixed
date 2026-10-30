# Project Management – API Contract

Source of truth: `src/services/projectApi.ts` (signatures) and `src/types/project.ts` (shapes).
Each service function maps 1:1 to an endpoint below. To go live, replace the body of each function with a `fetch` call – no UI changes needed.

**Conventions**
- Base path `/api`, JSON bodies, `Authorization: Bearer <jwt>`. Role (`Admin | Project Manager | Viewer`) comes from the token; the UI hides edit controls for `Viewer` but **the server must enforce it**.
- Dates: `YYYY-MM-DD` (date) or ISO-8601 (timestamp). Money: integer rupees (INR). Percentages: integers 0–100.
- Errors: `{ "status": 4xx, "message": "..." }` – the UI shows `message` in a toast / inline. Used codes: `404` not found, `409` business-rule conflict, `422` validation.
- Type names below refer to `src/types/project.ts`.

## 1. Projects

| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `getProjects(filters)` | `GET /projects?tab=all\|active\|upcoming\|completed\|archive&search=&status=&sector=&sdg=&stage=&lead=` | query only (`lead` = manager name; recommend also supporting `managerId`) | `ProjectListResult` `{ items: Project[], total, stats:{total,active,upcoming,completed,archived,onHold} }`. `tab=all` excludes Archived; `stats` ignore filters. |
| `getProject(id)` | `GET /projects/:id` | – | `Project` (includes nested `plan: ProjectPlan`) |
| `getManagers()` | `GET /managers` | – | `ManagerOption[]` `{id,name}` |
| `getEligibleProposals()` | `GET /proposals?status=approved&activated=false` | – | `ApprovedProposal[]` incl. `planningStatus`, `planningCompletion`, `missingSections`, `summary` (only when planning complete) |
| `createProjectFromProposal(proposalId, input)` | `POST /projects/from-proposal/:proposalId` | `ActivationInput` `{ startDate, managerId, checklist: string[] }` | `Project` (201). `409` if Final Project Plan incomplete; `422` if date/manager missing. Server must: clone plan, compute `endDate = start + duration`, set `status = Upcoming` if start in future else `Active`, `currentStage = 1`, seed 9 department checklists + document checklist, write activity log. |
| `updateProject(id, patch)` | `PATCH /projects/:id` | `{ name?, sector?, why?, problemStatement?, sdgGoals?, currentStatus?, geographics?, status?, currentStage?, progress?, managerId?, startDate?, endDate? }` | `Project`. Changing `currentStage` re-derives stage statuses; setting `status=Archived` sets `archivedAt`. |
| `archiveProject(id)` | `POST /projects/:id/archive` | – | `Project` (status `Archived`). Restore = `PATCH` with `status`. |

## 2. Timeline
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `addMilestone` | `POST /projects/:id/milestones` | `NewMilestone` `{title,stage,dueDate,status,owner}` | `Milestone` |
| `updateMilestone` | `PATCH /projects/:id/milestones/:milestoneId` | `Partial<Milestone>` | `Milestone` |
| `updateStageProgress` | `PATCH /projects/:id/stages/:stage` | `{ progress }` | `Project` |

## 3. Team
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `assignTeamMember` | `POST /projects/:id/team` | `{name,role,group:'Core'\|'Advisory'\|'Working',organisation?,email?}` | `TeamMember` |
| `unassignTeamMember` | `DELETE /projects/:id/team/:memberId` | – | `204` |
| `addPartner` | `POST /projects/:id/partners` | `{name,type,role}` | `Partner` |
| `removePartner` | `DELETE /projects/:id/partners/:partnerId` | – | `204` |

Stakeholders, same-field NGOs, volunteers and staff tiers are read via `GET /projects/:id` (`plan.team`). They are planning data (editable only in Detailed Planning).

## 4. Tasks
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `getTasks` | `GET /projects/:id/tasks` | – | `Task[]` |
| `createTask` | `POST /projects/:id/tasks` | `NewTask` `{title,description?,owner,department,stage,priority,dueDate,status}` | `Task` |
| `updateTask` | `PATCH /projects/:id/tasks/:taskId` | `Partial<NewTask>` | `Task` |
| `deleteTask` | `DELETE /projects/:id/tasks/:taskId` | – | `204` |

`department` ∈ `admin_legal, hr, marketing, finance, fundraising, operations, mel, innovation, data_tech`. `status` ∈ `To Do, In Progress, Review, Done`.

## 5. Budget & expenses
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `getBudget` | `GET /projects/:id/budget` | – | `BudgetDetail` `{ summary:{salariesA,operationsB,assetsC,total,spent,remaining,spentBySection}, staff:StaffTier[], totalStaff, operations:OperationItem[], assets:Asset[], funding:FundingPlan }`. `total = A+B+C`; `spent`/`spentBySection` = sums of expenses. |
| `getExpenses` | `GET /projects/:id/expenses` | – | `Expense[]` newest first |
| `addExpense` | `POST /projects/:id/expenses` | `NewExpense` `{date,section:'Salaries'\|'Operations'\|'Assets',head,description,amount>0,paidTo}` | `Expense` (`addedBy` from token) |
| `deleteExpense` | `DELETE /projects/:id/expenses/:expenseId` | – | `204` |

## 6. Departments (Excel Sheet2)
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `getDepartmentChecklist` | `GET /projects/:id/departments` | – | `DepartmentChecklist[]` (9, with groups/items and derived `completion`) |
| `updateChecklistItem` | `PATCH /projects/:id/departments/:department/items/:itemId` | `{ done: boolean }` | `DepartmentChecklist` |
| `updateDepartment` | `PATCH /projects/:id/departments/:department` | `{ responsible?: string, priority?: 1..7 \| null }` | `DepartmentChecklist[]`. Priority (Excel "Department 1–7") is unique per project: assigning a taken rank gives the previous holder the caller's old rank. |

## 7. Documents & resources
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `getDocuments` | `GET /projects/:id/documents` | – | `DocumentItem[]` |
| `uploadDocument` | `POST /projects/:id/documents/:docId/upload` | `multipart/form-data` `file` (mock sends `fileName` only) | `DocumentItem` (status `Uploaded`) |
| `setDocumentStatus` | `PATCH /projects/:id/documents/:docId` | `{ status:'Pending'\|'Uploaded'\|'Verified' }` | `DocumentItem`. `409` if no file yet and status ≠ Pending. Recommend: only Admin/PM may verify. |
| `getResources` | `GET /projects/:id/resources` | – | `ResourceItem[]` (derived from planned assets) |

## 8. Impact
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `getImpact` | `GET /projects/:id/impact` | – | `ImpactSummary` `{kpis, beneficiaries:{directTarget,directReached,indirectTarget,indirectReached}, selectionProcess, dataSource, specialRemark, entries}` |
| `addImpactEntry` | `POST /projects/:id/impact/entries` | `NewImpactEntry` `{kpiId,date,value≥0,source,note}` | `ImpactEntry`. Server updates `KPI.actual`: count KPIs **add** the value; KPIs with unit `%`, `rate`, `metres`, `₹` **take the latest reading**. |

## 9. Monitoring
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `getActivityLog` | `GET /projects/:id/activity` | – | `ActivityLog[]` newest first. Server writes an entry on every mutation above. |
| `getRisks` | `GET /projects/:id/risks` | – | `RiskIssue[]` |
| `addRisk` | `POST /projects/:id/risks` | `NewRisk` `{title,type:'Risk'\|'Issue',severity,owner,status,mitigation}` | `RiskIssue` |
| `updateRisk` | `PATCH /projects/:id/risks/:riskId` | `Partial<NewRisk>` | `RiskIssue` |

## 10. Reports
| Service fn | Method & path | Request | Response |
|---|---|---|---|
| `getReport(type, filters)` | `GET /reports/:type?projectId=&from=&to=` (`type` = `progress\|budget\|impact\|department\|stakeholder`) | – | `ReportData` `{type,title,generatedAt,kpis:[{label,value}],chart:{kind,xKey,series:[{key,label}],data:[{...}]},table:{columns,rows}}`. `from/to` apply to task due dates (progress), expense dates (budget) and impact-entry dates (impact); ignored for department/stakeholder. `404` if no project matches. |
| Export | `GET /reports/:type/export?format=csv&…` | same query | CSV file stream generated from the report table. The UI's Print / PDF action uses the browser print dialog; native PDF and XLSX server exports are not implemented yet. |

## 11. Suggested DB entities
`users`(id, name, email, role) · `proposals`(id, title, sector, status, planning_status, planning_completion, approved_on) · `projects`(id, code, proposal_id FK, name, sector, why, problem_statement, current_status, active_since, geo_stage1..3, status, current_stage, progress, manager_id FK, start_date, end_date, duration_months, archived_at) · `project_sdgs`(project_id, sdg_no) · `project_stages`(project_id, stage 0–5, status, start, end, progress) · `milestones` · `impact_kpis`(project_id, category Direct/Indirect/Societal, name, unit, target, actual) · `impact_entries` · `beneficiary_plans`(project_id, direct/indirect category & number, selection_process, data_source, special_remark) · `team_members`(project_id, name, role, group, org, email) · `stakeholders` · `partners` · `same_field_ngos` · `volunteer_categories` · `staff_positions`(project_id, tier Authority/Office/Field, position, qty, package, total) · `operation_items`(type Frequent/Infrequent, name, frequency, cost_per_qty, total) · `assets`(type Small/Big, name, qty, cost_per_qty, total) · `funding_sources`(priority 1–3, name, amount, status) · `funding_meta`(call_of_action, donor_streams JSON, sponsorship JSON) · `expenses` · `departments`(9 static) · `department_checklist_templates`(department, group, label – seeded from Sheet2) · `project_checklist_items`(project_id, template_item_id, done, updated_at) · `project_departments`(project_id, department, responsible, priority 1–7 unique per project) · `tasks` · `documents`(project_id, name, category, status, file_key, uploaded_by/at) · `risks_issues` · `activity_log` · `files`(object-storage metadata).

Derived (compute server-side, don't store): staff totals, salaries (A), operations (B), assets (C), total, `spent`, `remaining`, checklist `completion`, project `progress` (current policy in UI: `(stage + stageProgress)/6`, 100 when completed).

## Role-based access: proposals, planning, events

| Area | Project Manager | Admin | Staff | Volunteer |
|---|---|---|---|---|
| Create / edit / submit / withdraw proposals | yes (own) | no | no | no |
| Review, approve, reject proposals | no | yes | no | no |
| Detailed planning (incl. `volunteersRequired`) | edit + finalise | view | view | no |
| Events: create / edit / registrations / budget | yes | yes | yes | no |
| Events: view (budget & registrations hidden) | yes | yes | yes | yes |
| Event photos: view / upload (event must have taken place) | yes | yes | yes | yes |
| Event photos: delete | any | any | own | own |

New endpoints: `GET|POST /api/events/<id>/photos` (multipart field `photo`, optional `caption`),
`GET /api/event-photos/<id>/file`, `DELETE /api/event-photos/<id>`.
Existing databases: run `database/migrations/003_event_photos.sql`.
