import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Plus, MapPin, Calendar, Users, Search, Camera, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  EVENT_TYPES, addRegistration, createEvent, deleteEvent, deletePhoto, getEventStats, inr, listEvents, listPhotos, listRegistrations,
  removeRegistration, searchPeople, setAttendance, updateEvent, uploadPhoto,
  type AttendanceStatus, type EventInput, type EventPhoto, type EventRecord, type EventStats, type PersonOption, type Registration,
} from "../../services/eventApi"

const typeStyle: Record<string, string> = {
  Fundraiser: "badge badge-teal", Training: "badge badge-blue", Outreach: "badge badge-green",
  Meeting: "badge badge-gray", Community: "badge badge-purple",
}
const statusStyle: Record<string, string> = {
  Scheduled: "badge badge-yellow", Completed: "badge badge-green", Cancelled: "badge badge-red",
}
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
const toLocalInputs = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
}
const fill = (e: EventRecord) => (e.capacity && e.registered != null ? Math.min(100, Math.round((e.registered / e.capacity) * 100)) : 0)
// Photos can be added once an event has been held.
const isHeld = (e: EventRecord) => e.status === "Completed" || (e.status === "Scheduled" && new Date(e.startsAt).getTime() <= Date.now())

export default function EventsPage() {
  const { user } = useAuth()
  // Staff-side roles manage events, registrations and budgets. Volunteers get a read-only view (no finances,
  // no registrations) plus the ability to post photos of events that have been held.
  const canWrite = !!user && ["Admin", "Project Manager", "Staff"].includes(user.role)
  const canPhoto = canWrite || user?.role === "Volunteer"
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [records, setRecords] = useState<EventRecord[]>([])
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<EventRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [personType, setPersonType] = useState<Registration["personType"]>("user")
  const [personQuery, setPersonQuery] = useState("")
  const [options, setOptions] = useState<PersonOption[]>([])
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoCaption, setPhotoCaption] = useState("")
  const [uploading, setUploading] = useState(false)

  const selected = records.find((r) => r.id === selectedId) ?? null

  const reload = useCallback(async () => {
    try {
      const [list, summary] = await Promise.all([
        listEvents({ search: search.trim() || undefined, status: statusFilter || undefined, eventType: typeFilter || undefined }),
        getEventStats(),
      ])
      setRecords(list.items)
      setStats(summary)
      setError("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load events.")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    const t = setTimeout(() => void reload(), search ? 250 : 0)
    return () => clearTimeout(t)
  }, [reload, search])

  const loadRegistrations = useCallback(async (id: string) => {
    try { setRegistrations((await listRegistrations(id)).items) }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load registrations.") }
  }, [])

  useEffect(() => { if (selectedId && canWrite) void loadRegistrations(selectedId); else setRegistrations([]) }, [selectedId, loadRegistrations, canWrite])

  const loadPhotos = useCallback(async (id: string) => {
    try { setPhotos((await listPhotos(id)).items) }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load photos.") }
  }, [])

  useEffect(() => { setPhotoFile(null); setPhotoCaption(""); if (selectedId && canPhoto) void loadPhotos(selectedId); else setPhotos([]) }, [selectedId, loadPhotos, canPhoto])

  const submitPhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId || !photoFile) return
    setUploading(true); setError(""); setNotice("")
    try {
      await uploadPhoto(selectedId, photoFile, photoCaption.trim())
      setPhotoFile(null); setPhotoCaption(""); (event.currentTarget as HTMLFormElement).reset()
      setNotice("Photo uploaded.")
      await loadPhotos(selectedId)
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to upload the photo.") }
    finally { setUploading(false) }
  }

  const removePhoto = async (id: string) => {
    if (!selectedId || !window.confirm("Remove this photo?")) return
    setError(""); setNotice("")
    try { await deletePhoto(id); setNotice("Photo removed."); await loadPhotos(selectedId) }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to remove the photo.") }
  }

  useEffect(() => {
    if (!selectedId || !canWrite) return
    const t = setTimeout(() => {
      searchPeople(personType, personQuery).then((r) => setOptions(r.items)).catch(() => setOptions([]))
    }, 200)
    return () => clearTimeout(t)
  }, [personType, personQuery, selectedId, canWrite])

  const act = async (fn: () => Promise<unknown>, success: string) => {
    setError(""); setNotice("")
    try { await fn(); setNotice(success); await reload(); if (selectedId && canWrite) await loadRegistrations(selectedId) }
    catch (e) { setError(e instanceof Error ? e.message : "Action failed.") }
  }

  const submitEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const startsAt = new Date(`${String(data.get("date"))}T${String(data.get("time"))}`)
    const body: EventInput = {
      title: String(data.get("title")).trim(),
      eventType: String(data.get("type")) as EventInput["eventType"],
      startsAt: startsAt.toISOString(),
      location: String(data.get("location")).trim(),
      organizer: String(data.get("organizer")).trim(),
      capacity: Number(data.get("capacity")),
      budget: Number(data.get("budget") || 0),
      description: String(data.get("description") || "").trim(),
    }
    setSaving(true); setError(""); setNotice("")
    try {
      if (editing) await updateEvent(editing.id, body)
      else await createEvent(body)
      setNotice(editing ? "Event updated." : "Event created.")
      setShowForm(false); setEditing(null)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save the event.")
    } finally { setSaving(false) }
  }

  const openForm = (record: EventRecord | null) => { setEditing(record); setShowForm(true); setNotice("") }
  const initial = editing ? toLocalInputs(editing.startsAt) : { date: "", time: "" }

  const addPerson = (id: string) => selectedId && act(() => addRegistration(selectedId, personType, id), "Registration added.")

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">{canWrite ? "Plan and manage all Hope Foundation events" : "See upcoming events and share photos from events that have taken place"}</p>
        </div>
        {canWrite && <button className="btn-primary" onClick={() => openForm(null)}><Plus size={16} /> Create Event</button>}
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}
      {loading && <p className="text-sm text-slate-500">Loading events...</p>}

      <div className={`grid grid-cols-2 ${canWrite ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>
        {[
          { label: "Total Events", value: (stats?.total ?? 0).toLocaleString(), color: "#1AACB8" },
          { label: "Upcoming", value: (stats?.upcoming ?? 0).toLocaleString(), color: "#6366F1" },
          { label: "Participants Registered", value: (stats?.registered ?? 0).toLocaleString(), color: "#10B981" },
          { label: "Total Event Budget", value: inr(stats?.totalBudget ?? 0), color: "#F59E0B" },
        ].filter((s) => canWrite || !["Participants Registered", "Total Event Budget"].includes(s.label)).map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl font-extrabold" style={{ color: s.color, fontFamily: "Nunito, sans-serif" }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{editing ? "Edit Event" : "Create Event"}</span>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="text-slate-400" aria-label="Close event form">✕</button>
          </div>
          <form key={editing?.id ?? "new"} onSubmit={submitEvent} className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="event-title" className="form-label">Event name</label>
              <input id="event-title" name="title" required maxLength={140} className="form-input" defaultValue={editing?.title} /></div>
            <div><label htmlFor="event-type" className="form-label">Type</label>
              <select id="event-type" name="type" className="form-input" defaultValue={editing?.eventType ?? "Community"}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select></div>
            <div><label htmlFor="event-date" className="form-label">Date</label>
              <input id="event-date" name="date" required type="date" className="form-input" defaultValue={initial.date} /></div>
            <div><label htmlFor="event-time" className="form-label">Time</label>
              <input id="event-time" name="time" required type="time" className="form-input" defaultValue={initial.time} /></div>
            <div><label htmlFor="event-location" className="form-label">Location</label>
              <input id="event-location" name="location" required className="form-input" defaultValue={editing?.location} /></div>
            <div><label htmlFor="event-organizer" className="form-label">Organizer</label>
              <input id="event-organizer" name="organizer" required className="form-input" defaultValue={editing?.organizer} /></div>
            <div><label htmlFor="event-capacity" className="form-label">Capacity</label>
              <input id="event-capacity" name="capacity" required type="number" min={Math.max(1, editing?.registered ?? 1)} className="form-input" defaultValue={editing?.capacity ?? undefined} /></div>
            <div><label htmlFor="event-budget" className="form-label">Budget (₹)</label>
              <input id="event-budget" name="budget" type="number" min="0" className="form-input" defaultValue={editing?.budget ?? 0} /></div>
            <div className="md:col-span-2"><label htmlFor="event-description" className="form-label">Description</label>
              <textarea id="event-description" name="description" className="form-input h-20 resize-none" defaultValue={editing?.description} /></div>
            <div className="md:col-span-2 flex gap-3">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Create Event"}</button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">{selected.title}</span>
            <button type="button" onClick={() => setSelectedId(null)} className="text-slate-400" aria-label="Close event details">✕</button>
          </div>
          <div className="card-body flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <p><strong>Type:</strong> {selected.eventType}</p>
              <p><strong>Status:</strong> {selected.status}</p>
              <p><strong>Date and time:</strong> {fmtDate(selected.startsAt)} at {fmtTime(selected.startsAt)}</p>
              <p><strong>Location:</strong> {selected.location}</p>
              <p><strong>Organizer:</strong> {selected.organizer}</p>
              {canWrite && <p><strong>Registration:</strong> {selected.registered} / {selected.capacity ?? "∞"} ({selected.attended} attended)</p>}
              {canWrite && <p><strong>Budget:</strong> {inr(selected.budget)}</p>}
              {selected.description && <p className="sm:col-span-2"><strong>About:</strong> {selected.description}</p>}
            </div>
            {canWrite && (
              <div className="flex gap-2 flex-wrap">
                {selected.status === "Scheduled" && <>
                  <button type="button" className="btn-secondary" onClick={() => openForm(selected)}>Edit</button>
                  <button type="button" className="btn-secondary" onClick={() => void act(() => updateEvent(selected.id, { status: "Completed" }), "Event marked as completed.")}>Mark as completed</button>
                  <button type="button" className="btn-secondary" onClick={() => void act(() => updateEvent(selected.id, { status: "Cancelled" }), "Event cancelled.")}>Cancel event</button>
                </>}
                {selected.status === "Cancelled" && <button type="button" className="btn-secondary" onClick={() => void act(() => updateEvent(selected.id, { status: "Scheduled" }), "Event rescheduled.")}>Reopen</button>}
                {selected.status !== "Completed" && (
                  <button type="button" className="btn-secondary" onClick={() => {
                    if (window.confirm(`Delete “${selected.title}”? This cannot be undone.`)) void act(async () => { await deleteEvent(selected.id); setSelectedId(null) }, "Event deleted.")
                  }}>Delete</button>
                )}
              </div>
            )}

            {canWrite && (
            <div>
              <h3 className="font-bold text-slate-700 mb-2">Registrations ({registrations.filter((r) => r.attendanceStatus !== "Cancelled").length})</h3>
              {canWrite && selected.status === "Scheduled" && (
                <div className="flex gap-2 flex-wrap mb-3">
                  <select className="form-input w-40" aria-label="Person type" value={personType} onChange={(e) => { setPersonType(e.target.value as Registration["personType"]); setPersonQuery("") }}>
                    <option value="user">Team member</option><option value="beneficiary">Beneficiary</option><option value="donor">Donor</option>
                  </select>
                  <input className="form-input flex-1 min-w-48" placeholder="Search by name or email..." aria-label="Search people" value={personQuery} onChange={(e) => setPersonQuery(e.target.value)} />
                  <select className="form-input w-64" aria-label="Select person" value="" onChange={(e) => e.target.value && void addPerson(e.target.value)}>
                    <option value="">{options.length ? "Select to register…" : "No matches"}</option>
                    {options.map((o) => <option key={o.id} value={o.id}>{o.name}{o.email ? ` · ${o.email}` : ""}</option>)}
                  </select>
                </div>
              )}
              {registrations.length === 0 ? <p className="text-slate-500">No registrations yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead><tr><th>Name</th><th>Type</th><th>Status</th>{canWrite && <th>Actions</th>}</tr></thead>
                    <tbody>
                      {registrations.map((r) => (
                        <tr key={r.id}>
                          <td className="font-semibold text-slate-800">{r.name}<div className="text-xs text-slate-400 font-normal">{r.email}</div></td>
                          <td className="capitalize">{r.personType}</td>
                          <td>
                            {canWrite ? (
                              <select className="form-input py-1" aria-label={`Attendance for ${r.name}`} value={r.attendanceStatus}
                                onChange={(e) => void act(() => setAttendance(r.id, e.target.value as AttendanceStatus), "Attendance updated.")}>
                                {["Registered", "Attended", "Absent", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
                              </select>
                            ) : r.attendanceStatus}
                          </td>
                          {canWrite && <td><button type="button" className="btn-secondary text-xs py-1" onClick={() => void act(() => removeRegistration(r.id), "Registration removed.")}>Remove</button></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            )}

            {canPhoto && (
              <div>
                <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Camera size={16} /> Event Photos ({photos.length})</h3>
                {isHeld(selected) && selected.status !== "Cancelled" ? (
                  <form onSubmit={(e) => void submitPhoto(e)} className="flex gap-2 flex-wrap mb-3 items-end">
                    <div>
                      <label htmlFor="photo-file" className="form-label">Photo (JPEG, PNG, WebP or GIF, up to 5 MB)</label>
                      <input id="photo-file" type="file" required accept="image/jpeg,image/png,image/webp,image/gif" className="form-input"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                    </div>
                    <div className="flex-1 min-w-48">
                      <label htmlFor="photo-caption" className="form-label">Caption (optional)</label>
                      <input id="photo-caption" maxLength={300} className="form-input" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-primary" disabled={uploading || !photoFile}>{uploading ? "Uploading…" : "Upload Photo"}</button>
                  </form>
                ) : selected.status === "Cancelled" ? (
                  <p className="text-slate-500 mb-3">This event was cancelled, so photos can't be added.</p>
                ) : (
                  <p className="text-slate-500 mb-3">Photos can be added once the event has taken place.</p>
                )}
                {photos.length === 0 ? <p className="text-slate-500">No photos yet.</p> : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map((ph) => (
                      <figure key={ph.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                        <a href={ph.url} target="_blank" rel="noreferrer">
                          <img src={ph.url} alt={ph.caption || `Photo from ${selected.title}`} loading="lazy" className="w-full h-36 object-cover" />
                        </a>
                        <figcaption className="p-2 text-xs text-slate-500">
                          {ph.caption && <div className="text-slate-700 font-medium mb-0.5">{ph.caption}</div>}
                          <div className="flex items-center justify-between gap-2">
                            <span>{ph.uploadedByName ?? "Unknown"} · {fmtDate(ph.createdAt)}</span>
                            {ph.canDelete && <button type="button" aria-label="Remove photo" className="text-slate-400 hover:text-red-500" onClick={() => void removePhoto(ph.id)}><Trash2 size={13} /></button>}
                          </div>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="form-input pl-9" placeholder="Search events..." aria-label="Search events" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-input w-40" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option><option>Scheduled</option><option>Completed</option><option>Cancelled</option>
        </select>
        <select className="form-input w-40" aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <div className="tab-bar">
          <button className={`tab-item ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}>Grid</button>
          <button className={`tab-item ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>List</button>
        </div>
      </div>

      {!loading && records.length === 0 && !error && <p className="text-sm text-slate-500">No events found.</p>}

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {records.map((e) => (
            <div key={e.id} className="card hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-2" style={{ background: e.status === "Completed" ? "#10B981" : e.status === "Cancelled" ? "#EF4444" : "#1AACB8" }} />
              <div className="card-body flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={typeStyle[e.eventType]}>{e.eventType}</span>
                  <span className={statusStyle[e.status]}>{e.status}</span>
                </div>
                <div className="font-bold text-slate-800" style={{ fontFamily: "Nunito, sans-serif" }}>{e.title}</div>
                <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><Calendar size={12} /> {fmtDate(e.startsAt)} at {fmtTime(e.startsAt)}</div>
                  <div className="flex items-center gap-1.5"><MapPin size={12} /> {e.location}</div>
                  {canWrite && <div className="flex items-center gap-1.5"><Users size={12} /> {e.registered}/{e.capacity ?? "∞"} registered</div>}
                </div>
                {canWrite && <div className="w-full h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${fill(e)}%`, background: "#1AACB8" }} /></div>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Organizer: {e.organizer || "—"}</span>
                  {canWrite && <span className="text-xs font-semibold text-slate-600">Budget: {inr(e.budget)}</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1 text-xs py-1.5" onClick={() => setSelectedId(e.id)}>{canWrite ? "View Details" : isHeld(e) && e.status !== "Cancelled" ? "Details & Photos" : "View Details"}</button>
                  {canWrite && <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => setSelectedId(e.id)}>Manage</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead><tr><th>Event</th><th>Type</th><th>Date & Time</th><th>Location</th>{canWrite && <th>Capacity</th>}<th>Status</th>{canWrite && <th>Budget</th>}</tr></thead>
              <tbody>
                {records.map((e) => (
                  <tr key={e.id} className="cursor-pointer" onClick={() => setSelectedId(e.id)}>
                    <td className="font-semibold text-slate-800">{e.title}</td>
                    <td><span className={typeStyle[e.eventType]}>{e.eventType}</span></td>
                    <td className="text-xs">{fmtDate(e.startsAt)} · {fmtTime(e.startsAt)}</td>
                    <td className="text-xs">{e.location}</td>
                    {canWrite && <td>{e.registered}/{e.capacity ?? "∞"}</td>}
                    <td><span className={statusStyle[e.status]}>{e.status}</span></td>
                    {canWrite && <td>{inr(e.budget)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
