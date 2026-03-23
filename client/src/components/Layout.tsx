import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  CheckSquare, 
  Trophy,
  Menu,
  BarChart3,
  CloudUpload,
  Contact,
  Network,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/volunteers", label: "Volunteers", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/attendance", label: "Attendance", icon: CheckSquare },
  {href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/organigram", label: "Organigram", icon: Network },
  { href: "/badges", label: "Badges", icon: Contact },
  { href: "/badge-back", label: "Badge Back", icon: RotateCcw },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const currentItem = NAV_ITEMS.find(item => 
      location === item.href || (item.href !== "/" && location.startsWith(item.href))
    );
    document.title = currentItem 
      ? `${currentItem.label} | Smile Club Mahajanga` 
      : "Smile Club Mahajanga Tracker";
  }, [location]);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/backup", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Database synced to GitHub." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to sync to GitHub.", variant: "destructive" });
    }
  });

  const SyncButton = () => (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => syncMutation.mutate()} 
      disabled={syncMutation.isPending}
      className="w-full flex items-center gap-2 rounded-xl mt-4 border-primary/20 hover:border-primary/50 text-primary"
    >
      <CloudUpload className={`w-4 h-4 ${syncMutation.isPending ? 'animate-pulse' : ''}`} />
      {syncMutation.isPending ? "Syncing..." : "Sync to GitHub"}
    </Button>
  );

  const NavLinks = () => (
    <div className="space-y-2 py-4">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        const Icon = item.icon;
        
        return (
          <Link key={item.href} href={item.href} 
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-secondary/10 hover:text-secondary-foreground"
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-card border-r border-border/50 shadow-sm z-10 p-6 sticky top-0 h-screen">
        <div className="mb-8">
          <img src="/smile-club-logo.png" alt="Smile Club Mahajanga" className="h-[85px] w-auto object-contain" />
        </div>
        
        <nav className="flex-1">
          <NavLinks />
          <SyncButton />
        </nav>

        <div className="mt-auto pt-6 border-t border-border/50">
          <div className="bg-secondary/5 rounded-2xl p-4 border border-secondary/10">
            <p className="text-sm font-medium text-foreground">Changing lives</p>
            <p className="text-xs text-muted-foreground mt-1">One smile at a time.</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border/50 z-50 flex items-center justify-between px-4">
        <img src="/smile-club-logo.png" alt="Smile Club Mahajanga" className="h-[53px] w-auto object-contain" />
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-card">
            <div className="mb-8 pt-4">
              <img src="/smile-club-logo.png" alt="Smile Club Mahajanga" className="h-[64px] w-auto object-contain" />
            </div>
            <NavLinks />
            <SyncButton />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0 overflow-auto">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
