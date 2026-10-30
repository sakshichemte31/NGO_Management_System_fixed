import { useState, type FormEvent } from "react"
import {
  Plus,
  Send,
  Mail,
  MessageSquare,
  Bell,
  Users,
  Search,
} from "lucide-react"
import usePersistentState from "../../hooks/usePersistentState"

type Message = {
  id: number
  from: string
  subject: string
  preview: string
  time: string
  read: boolean
  type: string
}
type Announcement = {
  title: string
  date: string
  audience: string
  priority: string
}
type Broadcast = {
  title: string
  recipients: number
  status: string
  date: string
  channel: string
}

const initialMessages: Message[] = [
  {
    id: 1,
    from: "Priya Sharma",
    subject: "Update on Clean Water Initiative",
    preview:
      "Hi team, I wanted to share the latest progress report from the...",
    time: "10:32 AM",
    read: false,
    type: "Internal",
  },
  {
    id: 2,
    from: "Tata Trust (External)",
    subject: "Q4 CSR Collaboration",
    preview:
      "We are pleased to confirm our continued support for the Q4 CSR...",
    time: "9:15 AM",
    read: false,
    type: "External",
  },
  {
    id: 3,
    from: "Rahul Mehta",
    subject: "System maintenance notice",
    preview: "The data portal will be down for 2 hours on Saturday...",
    time: "Yesterday",
    read: true,
    type: "Internal",
  },
  {
    id: 4,
    from: "Sunita Roy",
    subject: "Volunteer orientation feedback",
    preview:
      "Great session today! 42 out of 50 participants rated it 5 stars...",
    time: "Yesterday",
    read: true,
    type: "Internal",
  },
  {
    id: 5,
    from: "Ramesh Gupta (Donor)",
    subject: "Happy to support again!",
    preview:
      "Dear Hope Foundation, I wanted to reach out to express my continued...",
    time: "5 Oct",
    read: true,
    type: "Donor",
  },
]

const initialAnnouncements: Announcement[] = [
  {
    title: "Diwali Office Hours Notice",
    date: "7 Oct 2025",
    audience: "All Staff",
    priority: "Normal",
  },
  {
    title: "Q4 Fundraising Push – All Hands",
    date: "5 Oct 2025",
    audience: "All Staff",
    priority: "High",
  },
  {
    title: "New Volunteer Batch Orientation",
    date: "3 Oct 2025",
    audience: "Volunteers",
    priority: "Normal",
  },
]

const initialBroadcasts: Broadcast[] = [
  {
    title: "Diwali Greetings to All Donors",
    recipients: 4820,
    status: "Scheduled",
    date: "13 Nov 2025",
    channel: "Email + WhatsApp",
  },
  {
    title: "Q3 Impact Update Newsletter",
    recipients: 2340,
    status: "Sent",
    date: "1 Oct 2025",
    channel: "Email",
  },
  {
    title: "Volunteer Appreciation Message",
    recipients: 1284,
    status: "Sent",
    date: "28 Sep 2025",
    channel: "WhatsApp",
  },
]

const typeStyle: Record<string, string> = {
  Internal: "badge badge-blue",
  External: "badge badge-teal",
  Donor: "badge badge-green",
}

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState("inbox")
  const [composerMode, setComposerMode] =
    useState<"message" | "announcement" | "broadcast" | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [messages, setMessages] = usePersistentState<Message[]>(
    "ngo-communication-messages",
    initialMessages,
  )
  const [announcements, setAnnouncements] = usePersistentState<Announcement[]>(
    "ngo-announcements",
    initialAnnouncements,
  )
  const [broadcasts, setBroadcasts] = usePersistentState<Broadcast[]>(
    "ngo-broadcasts",
    initialBroadcasts,
  )
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null)
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(
    null,
  )
  const [reply, setReply] = useState("")

  const submitComposer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const now = new Date()
    if (composerMode === "message") {
      const recipient = String(data.get("recipient")).trim()
      const body = String(data.get("body")).trim()
      setMessages((current) => [
        {
          id: Date.now(),
          from: "Admin User",
          subject: String(data.get("subject")).trim(),
          preview: `To: ${recipient} · ${body}`,
          time: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          read: true,
          type: String(data.get("channel")),
        },
        ...current,
      ])
      setSelected(null)
      setActiveTab("inbox")
    } else if (composerMode === "announcement") {
      setAnnouncements((current) => [
        {
          title: String(data.get("title")).trim(),
          audience: String(data.get("audience")),
          priority: String(data.get("priority")),
          date: now.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        },
        ...current,
      ])
      setActiveTab("announcements")
    } else if (composerMode === "broadcast") {
      setBroadcasts((current) => [
        {
          title: String(data.get("title")).trim(),
          recipients: Number(data.get("recipients")),
          channel: String(data.get("channel")),
          status: "Scheduled",
          date: String(data.get("date")),
        },
        ...current,
      ])
      setActiveTab("broadcasts")
    }
    setComposerMode(null)
  }

  const sendReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = reply.trim()
    if (!content || selected === null) return
    const original = messages.find((message) => message.id === selected)
    if (!original) return
    setMessages((current) => [
      {
        id: Date.now(),
        from: "Admin User",
        subject: `Re: ${original.subject}`,
        preview: content,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: true,
        type: "Internal",
      },
      ...current,
    ])
    setReply("")
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Communication</h1>
          <p className="page-subtitle">
            Internal messaging, donor communication, and broadcasts
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setComposerMode("message")}
        >
          <Plus size={16} /> Compose
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Unread Messages",
            value: messages
              .filter((message) => !message.read)
              .length.toLocaleString(),
            color: "#EF4444",
          },
          {
            label: "Messages Sent",
            value: messages
              .filter((message) => message.from === "Admin User")
              .length.toLocaleString(),
            color: "#1AACB8",
          },
          {
            label: "Broadcasts Active",
            value: broadcasts
              .filter((broadcast) => broadcast.status === "Scheduled")
              .length.toLocaleString(),
            color: "#6366F1",
          },
          {
            label: "Announcements",
            value: announcements.length.toLocaleString(),
            color: "#F59E0B",
          },
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

      {composerMode && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {composerMode === "message"
                ? "Compose Message"
                : composerMode === "announcement"
                  ? "New Announcement"
                  : "New Broadcast"}
            </span>
            <button
              type="button"
              onClick={() => setComposerMode(null)}
              className="text-slate-400"
              aria-label="Close composer"
            >
              ✕
            </button>
          </div>
          <form
            onSubmit={submitComposer}
            className="card-body grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {composerMode === "message" && (
              <>
                <div>
                  <label htmlFor="message-recipient" className="form-label">
                    To
                  </label>
                  <input
                    id="message-recipient"
                    name="recipient"
                    required
                    className="form-input"
                    placeholder="Recipient or group..."
                  />
                </div>
                <div>
                  <label htmlFor="message-channel" className="form-label">
                    Channel
                  </label>
                  <select
                    id="message-channel"
                    name="channel"
                    className="form-input"
                  >
                    <option>Internal</option>
                    <option>Email</option>
                    <option>WhatsApp</option>
                    <option>SMS</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="message-subject" className="form-label">
                    Subject
                  </label>
                  <input
                    id="message-subject"
                    name="subject"
                    required
                    maxLength={160}
                    className="form-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="message-body" className="form-label">
                    Message
                  </label>
                  <textarea
                    id="message-body"
                    name="body"
                    required
                    maxLength={5000}
                    className="form-input h-28 resize-y"
                  />
                </div>
              </>
            )}
            {composerMode === "announcement" && (
              <>
                <div className="md:col-span-2">
                  <label htmlFor="announcement-title" className="form-label">
                    Announcement
                  </label>
                  <input
                    id="announcement-title"
                    name="title"
                    required
                    maxLength={160}
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="announcement-audience" className="form-label">
                    Audience
                  </label>
                  <select
                    id="announcement-audience"
                    name="audience"
                    className="form-input"
                  >
                    <option>All Staff</option>
                    <option>Volunteers</option>
                    <option>Interns</option>
                    <option>Donors</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="announcement-priority" className="form-label">
                    Priority
                  </label>
                  <select
                    id="announcement-priority"
                    name="priority"
                    className="form-input"
                  >
                    <option>Normal</option>
                    <option>High</option>
                  </select>
                </div>
              </>
            )}
            {composerMode === "broadcast" && (
              <>
                <div className="md:col-span-2">
                  <label htmlFor="broadcast-title" className="form-label">
                    Campaign
                  </label>
                  <input
                    id="broadcast-title"
                    name="title"
                    required
                    maxLength={160}
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="broadcast-recipients" className="form-label">
                    Recipients
                  </label>
                  <input
                    id="broadcast-recipients"
                    name="recipients"
                    required
                    min="1"
                    type="number"
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="broadcast-channel" className="form-label">
                    Channel
                  </label>
                  <select
                    id="broadcast-channel"
                    name="channel"
                    className="form-input"
                  >
                    <option>Email</option>
                    <option>WhatsApp</option>
                    <option>Email + WhatsApp</option>
                    <option>SMS</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="broadcast-date" className="form-label">
                    Scheduled date
                  </label>
                  <input
                    id="broadcast-date"
                    name="date"
                    required
                    type="date"
                    className="form-input"
                  />
                </div>
              </>
            )}
            <div className="md:col-span-2 flex gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setComposerMode(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Send size={14} />{" "}
                {composerMode === "message"
                  ? "Send Message"
                  : composerMode === "announcement"
                    ? "Publish Announcement"
                    : "Schedule Broadcast"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tab-bar w-fit">
        {["inbox", "announcements", "broadcasts", "donor-communication"].map(
          (t) => (
            <button
              key={t}
              className={`tab-item capitalize ${
                activeTab === t ? "active" : ""
              }`}
              onClick={() => setActiveTab(t)}
            >
              {t.replace("-", " ")}
            </button>
          ),
        )}
      </div>

      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Message list */}
          <div className="card lg:col-span-1 overflow-hidden">
            <div className="card-header">
              <span className="card-title">Inbox</span>
              <span className="badge badge-red">
                {messages.filter((message) => !message.read).length} new
              </span>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selected === msg.id ? "bg-teal-50" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      setSelected(msg.id)
                  }}
                  onClick={() => {
                    setSelected(msg.id)
                    setMessages((current) =>
                      current.map((message) =>
                        message.id === msg.id
                          ? { ...message, read: true }
                          : message,
                      ),
                    )
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!msg.read && (
                        <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                      )}
                      <div
                        className={`text-sm ${
                          !msg.read
                            ? "font-bold text-slate-800"
                            : "text-slate-600"
                        }`}
                      >
                        {msg.from}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {msg.time}
                    </span>
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      !msg.read
                        ? "font-semibold text-slate-700"
                        : "text-slate-500"
                    } truncate`}
                  >
                    {msg.subject}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {msg.preview}
                  </div>
                  <span
                    className={`${typeStyle[msg.type]} mt-1.5 inline-block`}
                  >
                    {msg.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Message detail */}
          <div className="card lg:col-span-2">
            {selected ? (
              (() => {
                const msg = messages.find((m) => m.id === selected)!
                return (
                  <div className="h-full flex flex-col">
                    <div className="card-header flex-col items-start gap-1">
                      <div className="font-bold text-slate-800">
                        {msg.subject}
                      </div>
                      <div className="text-xs text-slate-400">
                        From: {msg.from} · {msg.time}
                      </div>
                      <span className={typeStyle[msg.type]}>{msg.type}</span>
                    </div>
                    <div className="card-body flex-1">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {msg.preview}
                      </p>
                    </div>
                    <form
                      onSubmit={sendReply}
                      className="px-5 py-4 border-t border-slate-100 flex gap-3"
                    >
                      <textarea
                        aria-label="Reply message"
                        className="form-input flex-1 h-12 resize-y text-sm"
                        placeholder="Type a reply..."
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        required
                      />
                      <button
                        type="submit"
                        aria-label="Send reply"
                        className="btn-primary text-sm py-2"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )
              })()
            ) : (
              <div className="flex items-center justify-center h-full min-h-[300px] text-slate-300">
                <div className="text-center">
                  <MessageSquare size={40} className="mx-auto mb-2" />
                  <p className="text-sm">Select a message to read</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "announcements" && (
        <div className="flex flex-col gap-3">
          <button
            className="btn-primary self-start"
            onClick={() => setComposerMode("announcement")}
          >
            <Plus size={15} /> New Announcement
          </button>
          {announcements.map((a, i) => (
            <div key={i} className="card">
              <div className="card-body flex items-center gap-4">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ background: "#E6F7F9" }}
                >
                  <Bell size={18} style={{ color: "#1AACB8" }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{a.title}</div>
                  <div className="text-xs text-slate-400">
                    {a.date} · Audience: {a.audience}
                  </div>
                </div>
                <span
                  className={
                    a.priority === "High"
                      ? "badge badge-red"
                      : "badge badge-gray"
                  }
                >
                  {a.priority}
                </span>
                <button
                  className="btn-secondary text-xs py-1"
                  onClick={() => setSelectedAnnouncement(a)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "broadcasts" && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <span className="card-title">Mass Communications & Broadcasts</span>
            <button
              className="btn-primary text-xs py-1.5"
              onClick={() => setComposerMode("broadcast")}
            >
              <Plus size={13} /> New Broadcast
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Recipients</th>
                  <th>Channel</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((b, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-slate-800">{b.title}</td>
                    <td>{b.recipients.toLocaleString()}</td>
                    <td className="text-xs text-slate-600">{b.channel}</td>
                    <td className="text-xs">{b.date}</td>
                    <td>
                      <span
                        className={
                          b.status === "Sent"
                            ? "badge badge-green"
                            : "badge badge-yellow"
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary text-xs py-1"
                        onClick={() => setSelectedBroadcast(b)}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "donor-communication" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              type: "Thank You Notes",
              count: 42,
              icon: "💌",
              desc: "Post-donation acknowledgements sent this month",
            },
            {
              type: "Impact Updates",
              count: 18,
              icon: "📊",
              desc: "Impact reports shared with active donors",
            },
            {
              type: "Pledge Reminders",
              count: 8,
              icon: "🔔",
              desc: "Payment reminders sent for upcoming pledges",
            },
            {
              type: "Re-engagement",
              count: 12,
              icon: "🤝",
              desc: "Lapsed donor re-engagement campaigns",
            },
          ].map((c) => (
            <div
              key={c.type}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body flex items-center gap-4">
                <span className="text-3xl">{c.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{c.type}</div>
                  <div className="text-xs text-slate-500">{c.desc}</div>
                </div>
                <div
                  className="text-2xl font-extrabold"
                  style={{ color: "#1AACB8", fontFamily: "Nunito, sans-serif" }}
                >
                  {c.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(selectedAnnouncement || selectedBroadcast) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => {
            setSelectedAnnouncement(null)
            setSelectedBroadcast(null)
          }}
        >
          <div
            className="card w-full max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="card-header">
              <span className="card-title">
                {selectedAnnouncement
                  ? "Announcement details"
                  : "Broadcast report"}
              </span>
              <button
                type="button"
                className="text-slate-400"
                onClick={() => {
                  setSelectedAnnouncement(null)
                  setSelectedBroadcast(null)
                }}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>
            <div className="card-body space-y-2 text-sm">
              {selectedAnnouncement && (
                <>
                  <p>
                    <strong>Title:</strong> {selectedAnnouncement.title}
                  </p>
                  <p>
                    <strong>Audience:</strong> {selectedAnnouncement.audience}
                  </p>
                  <p>
                    <strong>Priority:</strong> {selectedAnnouncement.priority}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedAnnouncement.date}
                  </p>
                </>
              )}
              {selectedBroadcast && (
                <>
                  <p>
                    <strong>Campaign:</strong> {selectedBroadcast.title}
                  </p>
                  <p>
                    <strong>Recipients:</strong>{" "}
                    {selectedBroadcast.recipients.toLocaleString()}
                  </p>
                  <p>
                    <strong>Channel:</strong> {selectedBroadcast.channel}
                  </p>
                  <p>
                    <strong>Scheduled:</strong> {selectedBroadcast.date}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedBroadcast.status}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
