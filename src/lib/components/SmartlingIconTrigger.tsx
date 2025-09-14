"use client";

import SubmitToSmartlingPopup from "@/lib/components/SubmitToSmartlingPopup";
import { IconButton } from "@/lib/components/IconButton";
import { Send } from "lucide-react";

type Props = {
  sku: any; // or a minimal type: { id: number } & Record<string, unknown>
};

export default function SmartlingIconTrigger({ sku }: Props) {
  return (
    <SubmitToSmartlingPopup
      sku={sku}
      renderTrigger={(open) => (
        <IconButton onClick={open} title="Submit to Smartling">
          <Send className="h-4 w-4" />
        </IconButton>
      )}
    />
  );
}
