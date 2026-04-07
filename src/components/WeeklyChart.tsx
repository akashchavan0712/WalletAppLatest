import { motion } from "framer-motion";

const velocityData = [
  { name: "Essentials", percent: 65, change: -4, color: "bg-foreground" },
  { name: "Discretionary", percent: 42, change: 18, color: "bg-foreground" },
  { name: "Investment", percent: 88, change: 2, color: "bg-foreground" },
];

export default function WeeklyChart() {
  return (
    <div className="bg-background border border-muted/40 p-8 rounded-[2.5rem] shadow-sm flex flex-col h-fit">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-headline font-extrabold text-xl tracking-tight text-foreground">Weekly Velocity</h3>
          <p className="text-xs font-label text-muted-foreground mt-1">Efficiency vs Previous Week</p>
        </div>
      </div>

      <div className="space-y-8">
        {velocityData.map((item, i) => (
          <div key={item.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{item.name}</span>
              <span className={`text-xs font-label font-bold ${item.change > 0 ? "text-destructive" : "text-[hsl(161_100%_21%)]"}`}>
                {item.change > 0 ? "+" : ""}{item.change}%
              </span>
            </div>
            <div className="w-full h-5 bg-muted/20 rounded-full overflow-hidden flex gap-1">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${item.percent}%` }}
                 transition={{ duration: 1, delay: i * 0.1 }}
                 className={`h-full ${item.color} rounded-full shadow-sm`}
               />
               <div className="flex-1 bg-muted/40 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
