import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient?: string;
}

export default function StatCard({ title, value, change, changeType = "neutral", icon: Icon, gradient }: StatCardProps) {
  const iconColor = gradient === "gradient-income" 
    ? "text-[hsl(142_71%_45%)]" 
    : gradient === "gradient-expense" 
    ? "text-[hsl(0_72%_51%)]" 
    : "text-primary";

  const iconBg = gradient === "gradient-income" 
    ? "bg-[hsl(142_71%_45%/0.1)]" 
    : gradient === "gradient-expense" 
    ? "bg-[hsl(0_72%_51%/0.1)]" 
    : "bg-primary/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover p-5 relative overflow-hidden group cursor-pointer"
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${gradient || "gradient-primary"} opacity-60`} />
      
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">{title}</p>
      <p className="font-display font-bold text-2xl text-foreground tracking-tight">{value}</p>
      {change && (
        <p className={`text-xs mt-2 font-medium ${
          changeType === "positive" ? "text-[hsl(142_71%_45%)]" : changeType === "negative" ? "text-[hsl(0_72%_51%)]" : "text-muted-foreground"
        }`}>
          {change}
        </p>
      )}
    </motion.div>
  );
}
