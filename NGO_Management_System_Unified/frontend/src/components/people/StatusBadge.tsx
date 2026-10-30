const MAP: Record<string, string> = {
  // green
  Active: 'green', Present: 'green', Completed: 'green', Done: 'green', Filled: 'green', Issued: 'green', Available: 'green',
  // teal
  Selected: 'teal', Approved: 'teal', Ongoing: 'teal', Generated: 'teal',
  // blue
  'Under Review': 'blue', 'In Progress': 'blue', Open: 'blue', Upcoming: 'blue', Scheduled: 'blue',
  // purple
  Shortlisted: 'purple', Awarded: 'purple',
  // yellow
  Pending: 'yellow', 'On Leave': 'yellow', Late: 'yellow', 'On Hold': 'yellow', Medium: 'yellow', Shortlisting: 'yellow', 'Not Started': 'yellow',
  // red
  Rejected: 'red', Absent: 'red', High: 'red', Overdue: 'red',
  // gray
  Inactive: 'gray', New: 'gray', 'To Do': 'gray', Low: 'gray', Unavailable: 'gray', Withdrawn: 'gray',
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${MAP[status] ?? 'gray'}`}>{status}</span>;
}
