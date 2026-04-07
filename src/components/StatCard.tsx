import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "standard" | "editorial" | "hero-dark";
  accentColor?: string;
}

export default function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  variant = "standard",
  accentColor 
}: StatCardProps) {
  
  if (variant === "hero-dark") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="bg-foreground text-background p-7 rounded-[2.5rem] flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all h-full"
      >
        <div>
          <p className="text-[10px] font-label uppercase tracking-widest text-muted-foreground mb-1">Net Cashflow</p>
          <p className="font-headline font-extrabold text-4xl tracking-tight leading-none mb-2">{value}</p>
          <p className="text-xs font-label text-muted-foreground opacity-80">{change}</p>
        </div>
        <div className="mt-8">
           <button className="bg-background text-foreground px-5 py-2 rounded-xl font-bold text-xs hover:bg-muted transition-colors active:scale-95 duration-200">
             Optimize
           </button>
        </div>
        {/* Subtle background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
      </motion.div>
    );
  }

  if (variant === "editorial") {
    const iconColor = changeType === "positive" ? "text-[hsl(161_100%_21%)]" : "text-destructive";
    const barColor = changeType === "positive" ? "bg-[hsl(161_100%_21%)]" : "bg-destructive";
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-background border border-muted/40 p-7 rounded-[2.5rem] flex flex-col items-start gap-4 relative overflow-hidden transition-all shadow-sm group h-full"
      >
        <div className="w-full flex items-center justify-between">
            <div className={`w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform ${iconColor}`}>
                <Icon className="w-7 h-7" />
            </div>
            <p className="text-[10px] text-muted-foreground font-label uppercase tracking-widest">{title}</p>
        </div>
        <div className="mt-2">
            <p className="font-headline font-extrabold text-3xl text-foreground tracking-tight mb-1">{value}</p>
            {change && (
                <p className="text-[11px] font-label font-bold text-muted-foreground/60">{change}</p>
            )}
        </div>
        {/* Mockup bottom progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/20">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "60%" }} 
              className={`h-full ${barColor}`} 
            />
        </div>
      </motion.div>
    );
  }

  // Standard case (legacy or simple cards)
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-muted p-5 rounded-3xl flex items-center gap-4 relative overflow-hidden transition-transform border border-muted/50 shadow-sm"
    >
      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground font-label uppercase tracking-widest">{title}</p>
        <p className="font-headline font-bold text-xl text-foreground tracking-tight my-0.5">{value}</p>
      </div>
    </motion.div>
  );
}
