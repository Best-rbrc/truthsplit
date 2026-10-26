import { Badge } from "@/components/ui/badge";
import { Position } from "@/types/analysis";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PositionBadgeProps {
  position: Position;
  className?: string;
}

export const PositionBadge = ({ position, className }: PositionBadgeProps) => {
  const config = {
    support: {
      icon: CheckCircle,
      label: "Support",
      className: "bg-support-bg text-support border-support/20"
    },
    oppose: {
      icon: XCircle,
      label: "Oppose",
      className: "bg-oppose-bg text-oppose border-oppose/20"
    },
    conditional: {
      icon: AlertCircle,
      label: "Conditional",
      className: "bg-conditional-bg text-conditional border-conditional/20"
    }
  };

  const { icon: Icon, label, className: badgeClassName } = config[position];

  return (
    <Badge variant="outline" className={cn("gap-1.5", badgeClassName, className)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
};
