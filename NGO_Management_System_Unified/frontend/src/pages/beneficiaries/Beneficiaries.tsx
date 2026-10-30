import { useState, type FormEvent } from "react"
import { Plus, Search, MapPin, Eye, Edit2 } from "lucide-react"
import usePersistentState from "../../hooks/usePersistentState"

type Beneficiary = {
  id: string
  name: string
  age: number
  gender: string
  location: string
  category: string
  project: string
  enrolled: string
  status: "Active" | "Inactive"
  services: string[]
}

const initialBeneficiaries: Beneficiary[] = [
  {
    id: "BNF-001",
    name: "Ramesh Chauhan",
    age: 45,
    gender: "Male",
    location: "Dharavi, Mumbai",
    category: "Health",
    project: "Healthcare Outreach",
    enrolled: "15 Mar 2025",
    status: "Active",
    services: ["Medical Checkup", "Medicine Supply"],
  },
  {
    id: "BNF-002",
    name: "Geeta Kumari",
    age: 32,
    gender: "Female",
    location: "Nashik",
    category: "Education",
    project: "Digital Literacy Drive",
    enrolled: "1 Jun 2025",
    status: "Active",
    services: ["Computer Training", "Tablet Provided"],
  },
  {
    id: "BNF-003",
    name: "Suresh Patil",
    age: 55,
    gender: "Male",
    location: "Pune Rural",
    category: "Water",
    project: "Clean Water Initiative",
    enrolled: "10 Apr 2025",
    status: "Active",
    services: ["Borewell Access", "Water Filter"],
  },
  {
    id: "BNF-004",
    name: "Ananya Singh",
    age: 14,
    gender: "Female",
    location: "Varanasi",
    category: "Education",
    project: "Girls Education Scholarship",
    enrolled: "1 Jul 2025",
    status: "Active",
    services: ["Scholarship", "Books & Stationery"],
  },
  {
    id: "BNF-005",
    name: "Kanta Bai",
    age: 68,
    gender: "Female",
    location: "Delhi",
    category: "Elderly",
    project: "Old Age Care Home",
    enrolled: "15 Feb 2025",
    status: "Inactive",
    services: ["Day Care", "Meals", "Healthcare"],
  },
  {
    id: "BNF-006",
    name: "Raj Kumar",
    age: 38,
    gender: "Male",
    location: "Jaipur",
    category: "Livelihood",
    project: "Women Empowerment Hub",
    enrolled: "20 May 2025",
    status: "Active",
    services: ["Skill Training", "Microfinance"],
  },
]

const categories = [
  "All",
  "Health",
  "Education",
  "Water",
  "Elderly",
  "Livelihood",
  "Nutrition",
]

const catColors: Record<string, string> = {
  Health: "badge badge-red",
  Education: "badge badge-blue",
  Water: "badge badge-teal",
  Elderly: "badge badge-purple",
  Livelihood: "badge badge-green",
  Nutrition: "badge badge-yellow",
}

export default function BeneficiariesPage() {
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("All")
  const [showForm, setShowForm] = useState(false)
  const [records, setRecords] = usePersistentState<Beneficiary[]>(
    "ngo-beneficiaries",
    initialBeneficiaries,
  )
  const [editing, setEditing] = useState<Beneficiary | null>(null)
  const [selected, setSelected] = useState<Beneficiary | null>(null)

  const filtered = records.filter(
    (b) =>
      (catFilter === "All" || b.category === catFilter) &&
      `${b.name} ${b.id} ${b.location} ${b.project}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  const saveBeneficiary = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const updated: Beneficiary = {
      id: editing?.id ?? `BNF-${String(Date.now()).slice(-6)}`,
      name: String(data.get("name")).trim(),
      age: Number(data.get("age")),
      gender: String(data.get("gender")),
      location: [data.get("village"), data.get("district"), data.get("state")]
        .map(String)
        .filter(Boolean)
        .join(", "),
      category: String(data.get("category")),
      project: String(data.get("project")).trim(),
      enrolled:
        editing?.enrolled ??
        new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      status: editing?.status ?? "Active",
      services: String(data.get("services"))
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    }
    setRecords((current) =>
      editing
        ? current.map((record) => (record.id === editing.id ? updated : record))
        : [updated, ...current],
    )
    closeForm()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Beneficiaries</h1>
          <p className="page-subtitle">
            Track and manage all program beneficiaries across projects
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null)
            setSelected(null)
            setShowForm((s) => !s)
          }}
        >
          <Plus size={16} /> Add Beneficiary
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Beneficiaries", value: "24,670", color: "#1AACB8" },
          { label: "New This Month", value: "312", color: "#10B981" },
          { label: "Active Programs", value: "38", color: "#6366F1" },
          { label: "Geographic Reach", value: "12 States", color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div
              className="text-2xl font-extrabold"
              style={{ color: s.color, fontFamily: "Nunito, sans-serif" }}
            >
              {s.value}
            </div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { cat: "Health", count: 8420, icon: "🏥" },
          { cat: "Education", count: 6280, icon: "📚" },
          { cat: "Water", count: 4800, icon: "💧" },
          { cat: "Nutrition", count: 2950, icon: "🥗" },
          { cat: "Livelihood", count: 1820, icon: "💼" },
          { cat: "Elderly", count: 400, icon: "👴" },
        ].map((c) => (
          <div
            key={c.cat}
            className="stat-card flex flex-col items-center text-center gap-1 cursor-pointer hover:border-teal-300 border border-transparent transition-all"
            onClick={() => setCatFilter(c.cat)}
          >
            <span className="text-2xl">{c.icon}</span>
            <div
              className="font-bold text-slate-800"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {c.count.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">{c.cat}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {editing ? "Edit Beneficiary" : "Register New Beneficiary"}
            </span>
            <button
              type="button"
              onClick={closeForm}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close beneficiary form"
            >
              ✕
            </button>
          </div>
          <form
            onSubmit={saveBeneficiary}
            className="card-body grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="form-label" htmlFor="beneficiary-name">
                Full Name
              </label>
              <input
                id="beneficiary-name"
                name="name"
                required
                maxLength={120}
                className="form-input"
                defaultValue={editing?.name}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="beneficiary-age">
                Age
              </label>
              <input
                id="beneficiary-age"
                name="age"
                type="number"
                min="0"
                max="120"
                required
                className="form-input"
                defaultValue={editing?.age}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="beneficiary-gender">
                Gender
              </label>
              <select
                id="beneficiary-gender"
                name="gender"
                required
                className="form-input"
                defaultValue={editing?.gender ?? ""}
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="beneficiary-category">
                Category
              </label>
              <select
                id="beneficiary-category"
                name="category"
                required
                className="form-input"
                defaultValue={editing?.category ?? ""}
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.slice(1).map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            {[
              {
                name: "village",
                label: "Location / Village",
                value: editing?.location.split(", ")[0],
              },
              {
                name: "district",
                label: "District",
                value: editing?.location.split(", ")[1],
              },
              {
                name: "state",
                label: "State",
                value: editing?.location.split(", ")[2],
              },
              {
                name: "project",
                label: "Assigned Project",
                value: editing?.project,
              },
            ].map((field) => (
              <div key={field.name}>
                <label
                  className="form-label"
                  htmlFor={`beneficiary-${field.name}`}
                >
                  {field.label}
                </label>
                <input
                  id={`beneficiary-${field.name}`}
                  name={field.name}
                  required
                  className="form-input"
                  defaultValue={field.value}
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="form-label" htmlFor="beneficiary-services">
                Services to be Provided
              </label>
              <textarea
                id="beneficiary-services"
                name="services"
                required
                className="form-input h-20 resize-none"
                placeholder="List services separated by commas"
                defaultValue={editing?.services.join(", ")}
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editing ? "Save Changes" : "Register Beneficiary"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Beneficiary Profile · {selected.id}
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close beneficiary profile"
            >
              ✕
            </button>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <p>
              <strong>Name:</strong> {selected.name}
            </p>
            <p>
              <strong>Age / Gender:</strong> {selected.age} / {selected.gender}
            </p>
            <p>
              <strong>Location:</strong> {selected.location}
            </p>
            <p>
              <strong>Category:</strong> {selected.category}
            </p>
            <p>
              <strong>Project:</strong> {selected.project}
            </p>
            <p>
              <strong>Services:</strong> {selected.services.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Filters + table */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="form-input pl-9"
            placeholder="Search beneficiaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                catFilter === c
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age/Gender</th>
                <th>Location</th>
                <th>Category</th>
                <th>Project</th>
                <th>Enrolled</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="text-xs text-slate-400">{b.id}</td>
                  <td className="font-semibold text-slate-800">{b.name}</td>
                  <td className="text-xs">
                    {b.age}y · {b.gender}
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin size={11} className="text-slate-400" />{" "}
                      {b.location}
                    </div>
                  </td>
                  <td>
                    <span
                      className={catColors[b.category] ?? "badge badge-gray"}
                    >
                      {b.category}
                    </span>
                  </td>
                  <td className="text-xs text-slate-600 max-w-[160px] truncate">
                    {b.project}
                  </td>
                  <td className="text-xs text-slate-500">{b.enrolled}</td>
                  <td>
                    <span
                      className={
                        b.status === "Active"
                          ? "badge badge-green"
                          : "badge badge-gray"
                      }
                    >
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`View ${b.name}`}
                        onClick={() => setSelected(b)}
                        className="p-1.5 rounded hover:bg-teal-50 text-slate-400 hover:text-teal-600"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${b.name}`}
                        onClick={() => {
                          setEditing(b)
                          setShowForm(true)
                          setSelected(null)
                        }}
                        className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {filtered.length} records
        </div>
      </div>
    </div>
  )
}
