"use client";

import { ReactNode } from "react";
import { AssistantProvider, AssistantButton } from "@/components/ai-assistant";

/**
 * AIProvider wraps the app with AI assistant functionality
 * This component provides the AI assistant context and floating button
 */
export function AIProvider({ children }: { children: ReactNode }) {
  return (
    <AssistantProvider>
      {children}
      <AssistantButton />
    </AssistantProvider>
  );
}