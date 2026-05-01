import { Badge } from "@sonordia/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sonordia/ui/tooltip";
import { cn } from "@sonordia/ui/utils";
import type { BridgeStatus } from "../types";

interface AnalysisStatusProps {
  status: BridgeStatus;
}

const statusConfig: Record<string, { dotClass: string; label: string }> = {
  starting: { dotClass: "bg-amber-500", label: "Bridge starting..." },
  restarting: { dotClass: "bg-amber-500", label: "Bridge restarting..." },
  ready: { dotClass: "bg-emerald-600", label: "Bridge ready" },
  exited: { dotClass: "bg-destructive", label: "Bridge exited" },
  error: { dotClass: "bg-destructive", label: "Bridge error" },
};

export function AnalysisStatus({ status }: AnalysisStatusProps) {
  const config = statusConfig[status.status] ?? {
    dotClass: "bg-muted-foreground",
    label: status.status,
  };

  const badge = (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn("inline-block size-2 rounded-full", config.dotClass)} />
      <span>{config.label}</span>
    </Badge>
  );

  if (!status.error) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{status.error}</TooltipContent>
    </Tooltip>
  );
}
