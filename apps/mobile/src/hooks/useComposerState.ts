import { useMemo, useState } from "react";
import { CHAT_LIMITS } from "../constants/chat";

export function useComposerState(initialValue = "") {
  const [value, setValue] = useState(initialValue);

  const state = useMemo(() => {
    const length = value.length;
    const remaining = CHAT_LIMITS.messageMaxLength - length;
    const trimmed = value.trim();

    return {
      value,
      length,
      remaining,
      trimmed,
      empty: trimmed.length === 0,
      nearLimit: remaining <= 200,
      overLimit: remaining < 0,
    };
  }, [value]);

  function clear() {
    setValue("");
  }

  return {
    ...state,
    setValue,
    clear,
  };
}
