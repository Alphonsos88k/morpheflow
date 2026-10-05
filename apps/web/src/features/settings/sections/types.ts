import type { Provider, PublicSettings } from "@morpheflow/spec";

/** Props every settings section gets: the draft and a way to change one part of it. */
export interface SectionProps {
  draft: PublicSettings;
  setDraft: (draft: PublicSettings) => void;
}

export interface AiSectionProps extends SectionProps {
  /** New API keys typed this session (empty = keep saved key). */
  keys: Record<Provider, string>;
  setKeys: (keys: Record<Provider, string>) => void;
}
