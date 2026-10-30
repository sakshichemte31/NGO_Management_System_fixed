import type { Project } from '../../../types/project';

/** Props shared by every Project Details tab. */
export interface TabProps {
  project: Project;
  /** Re-fetch the project header/plan after a mutation. */
  reload: () => Promise<void>;
  /** Set by header quick-actions so a tab can open its "add" modal on mount. */
  quick?: string | null;
  onQuickHandled?: () => void;
}
