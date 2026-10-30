const MAP: Record<string, string> = {
  // project status
  Active: 'badge-teal', Upcoming: 'badge-blue', Completed: 'badge-green', 'On Hold': 'badge-yellow', Archived: 'badge-gray',
  // task / milestone
  'To Do': 'badge-gray', 'In Progress': 'badge-blue', Review: 'badge-purple', Done: 'badge-green', Pending: 'badge-gray', Delayed: 'badge-red',
  // priority / severity
  Low: 'badge-gray', Medium: 'badge-blue', High: 'badge-yellow', Critical: 'badge-red',
  // docs
  Uploaded: 'badge-blue', Verified: 'badge-green',
  // risks
  Open: 'badge-red', Mitigating: 'badge-yellow', Resolved: 'badge-green', Closed: 'badge-gray',
  // funding
  Identified: 'badge-gray', Applied: 'badge-blue', Committed: 'badge-purple', Received: 'badge-green',
  // planning
  Complete: 'badge-green', 'Not Started': 'badge-gray',
  // stages
  Ideation: 'badge-gray', Pilot: 'badge-blue', Seed: 'badge-teal', Scale: 'badge-purple',
};

export default function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  return <span className={`badge ${MAP[status] ?? 'badge-gray'} ${className}`}>{status}</span>;
}
