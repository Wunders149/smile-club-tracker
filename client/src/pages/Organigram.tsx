import { useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { useVolunteers, useUpdateVolunteer } from "@/hooks/use-volunteers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, User, Search, Check } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { type Volunteer } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Organigram() {
  const { data: volunteers, isLoading } = useVolunteers();
  const updateMut = useUpdateVolunteer();
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Smile_Club_Mahajanga_Organigram",
  });

  if (isLoading) return <Layout><div className="text-center py-12 text-muted-foreground">Loading organizational data...</div></Layout>;

  // ── Leadership ──
  const president = volunteers?.find(v => v.position === "President");
  const vicePresident = volunteers?.find(v => v.position === "Vice President");
  const pastPresident = volunteers?.find(v => v.position === "Past President");
  const advisor = volunteers?.find(v => v.position === "Advisor");

  // ── Department heads ──
  const executiveHeads = [
    { title: "Head of Administration", pos: "Administration Officer", dept: "Administration" },
    { title: "Head of Education", pos: "Education Officer", dept: "Education" },
    { title: "Head of Fundraising", pos: "Fundraising Officer", dept: "Fundraising" },
    { title: "Head of Finance", pos: "Financial Officer", dept: "Finance" },
    { title: "Head of Communications", pos: "Communication Officer", dept: "Communications" },
  ];

  // ── Committee members under each dept (ABMs highlighted at top) ──
  const getCommitteeMembers = (dept: string) => {
    return (volunteers?.filter(v =>
      v.department === dept &&
      !v.position.includes("Officer") &&
      v.position !== "President" &&
      v.position !== "Vice President"
    ) || []).sort((a, b) => {
      const aIsAbm = a.position === "Assisting Board Member";
      const bIsAbm = b.position === "Assisting Board Member";
      if (aIsAbm && !bIsAbm) return -1;
      if (!aIsAbm && bIsAbm) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
  };

  const handleToggleVolunteer = async (volunteer: Volunteer) => {
    if (!selectedDept) return;
    const newDept = volunteer.department === selectedDept ? "None" : selectedDept;
    await updateMut.mutateAsync({ id: volunteer.id, department: newDept });
  };

  const filteredVolunteers = volunteers?.filter(v =>
    v.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    v.position !== "President" && v.position !== "Vice President" && !v.position.includes("Officer")
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Organizational Chart</h1>
            <p className="text-muted-foreground mt-1">Structure and leadership of Smile Club Mahajanga.</p>
          </div>
          <Button onClick={() => handlePrint()} className="rounded-xl shadow-lg shadow-primary/20">
            <Printer className="w-4 h-4 mr-2" /> Print Organigram
          </Button>
        </div>

        <Card className="p-6 sm:p-8 bg-card border-border/50 shadow-xl rounded-3xl no-print">
          <OrgChart
            volunteers={volunteers}
            president={president}
            vicePresident={vicePresident}
            pastPresident={pastPresident}
            advisor={advisor}
            executiveHeads={executiveHeads}
            getCommitteeMembers={getCommitteeMembers}
            onCommitteeClick={(dept: string) => setSelectedDept(dept)}
          />
        </Card>

        {/* Committee Management Dialog */}
        <Dialog open={!!selectedDept} onOpenChange={(open) => !open && setSelectedDept(null)}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Manage {selectedDept} Committee</DialogTitle>
              <DialogDescription>Add or remove volunteers from this committee.</DialogDescription>
            </DialogHeader>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search volunteers..."
                className="pl-9 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[400px] mt-4 pr-4">
              <div className="space-y-2">
                {filteredVolunteers.map((vol) => (
                  <button
                    key={vol.id}
                    onClick={() => handleToggleVolunteer(vol)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                      vol.department === selectedDept
                        ? "bg-primary/5 border-primary/20 shadow-sm"
                        : "bg-card border-border/50 hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {vol.photo ? (
                          <img src={vol.photo} alt={vol.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold truncate">{vol.fullName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{vol.position}</p>
                      </div>
                    </div>
                    {vol.department === selectedDept && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Printable Version - Landscape A4 */}
        <div className="print-only hidden">
          <div
            ref={printRef}
            className="p-0 bg-white text-black w-full font-sans"
            style={{
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact'
            }}
          >
            <style>{`
              @page {
                size: landscape A4;
                margin: 15mm;
                margin-top: 40mm;
                margin-bottom: 25mm;
              }
              @media print {
                * {
                  print-color-adjust: exact !important;
                  -webkit-print-color-adjust: exact !important;
                }
                body { background: white !important; margin: 0; padding: 0; }
                .org-print-header {
                  position: fixed;
                  top: 0;
                  left: 15mm;
                  right: 15mm;
                  height: 25mm;
                  background: white;
                  z-index: 10;
                }
                .org-print-footer {
                  position: fixed;
                  bottom: 0;
                  left: 15mm;
                  right: 15mm;
                  height: 12mm;
                }
                .print-organigram-container { width: 100%; }
                .org-node { break-inside: avoid; page-break-inside: avoid; }
                .committee-box { break-inside: avoid; page-break-inside: avoid; }
              }
            `}</style>

            <div className="print-organigram-container px-6 py-4">
              <div className="org-print-header flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
                <div className="flex items-end gap-4">
                  <img src="/smile-club-logo.png" alt="Smile Club Mahajanga" className="w-16 h-16 object-contain flex-shrink-0" />
                  <div>
                    <h1 className="text-lg font-black tracking-tighter uppercase text-black leading-none">Organizational Structure</h1>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mt-1">Smile Club Mahajanga • Medical Outreach Organization</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-black leading-none">{new Date().getFullYear()}</div>
                  <div className="text-[7px] font-bold uppercase tracking-widest text-gray-600 mt-0.5">Official</div>
                </div>
              </div>

              <div className="print-org-content">
                <OrgChart
                  volunteers={volunteers}
                  president={president}
                  vicePresident={vicePresident}
                  pastPresident={pastPresident}
                  advisor={advisor}
                  executiveHeads={executiveHeads}
                  getCommitteeMembers={getCommitteeMembers}
                  isPrint={true}
                />
              </div>

              <div className="org-print-footer flex justify-between items-end text-[7px] font-semibold uppercase tracking-wider text-gray-500">
                <div>
                  <p>Generated {format(new Date(), 'MMMM d, yyyy')}</p>
                  <p className="text-[6px] text-gray-400">Internal Management System</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black">For The Patients!</p>
                  <p className="text-[6px] text-gray-400">Smile Club Mahajanga</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/**
 * Core Organizational Chart Component
 *
 * Hierarchy:
 *   President + Vice President (top center)
 *   Past President (left)  |  Advisor (right)
 *   ─────────────────────────────────────────
 *   5 Department Officers (horizontal row)
 *   ─────────────────────────────────────────
 *   Committee members under each officer (with ABMs highlighted at top)
 */
function OrgChart({
  volunteers,
  president,
  vicePresident,
  pastPresident,
  advisor,
  executiveHeads,
  getCommitteeMembers,
  onCommitteeClick,
  isPrint = false
}: any) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-6 sm:gap-10 w-full",
      isPrint && "gap-5 py-2"
    )}>
      {/* ─────────────────────────────────────────────────────
          LEVEL 1 — President & Vice President (top center)
          Past President (left)  |  Advisor (right)
         ───────────────────────────────────────────────────── */}
      <div className={cn(
        "flex flex-col items-center gap-4 w-full",
        isPrint && "gap-3"
      )}>
        {/* Main Top Tier */}
        <div className={cn("flex items-center gap-6 sm:gap-12", isPrint && "gap-8")}>
          {/* Past President */}
          <div className={cn(
            "p-2 sm:p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 text-center w-36 sm:w-44 bg-muted/20",
            isPrint && "border-gray-300 bg-gray-50"
          )}>
            <div className={cn(
              "text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5",
              isPrint && "text-gray-600"
            )}>Past President</div>
            <div className={cn(
              "text-xs sm:text-sm font-bold",
              isPrint && "text-sm font-bold text-black"
            )}>{pastPresident?.fullName || "—"}</div>
          </div>

          {/* President & Vice President */}
          <div className="flex items-center gap-4 sm:gap-8">
            <OrgNode person={president} title="President" primary />
            <OrgNode person={vicePresident} title="Vice President" primary />
          </div>

          {/* Advisor */}
          <div className={cn(
            "p-2 sm:p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 text-center w-36 sm:w-44 bg-muted/20",
            isPrint && "border-gray-300 bg-gray-50"
          )}>
            <div className={cn(
              "text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5",
              isPrint && "text-gray-600"
            )}>Advisor</div>
            <div className={cn(
              "text-xs sm:text-sm font-bold",
              isPrint && "text-sm font-bold text-black"
            )}>{advisor?.fullName || "—"}</div>
          </div>
        </div>
      </div>

      {/* Connecting line down to officers */}
      <div className={cn(
        "w-0.5 h-8 sm:h-10 bg-primary/30",
        isPrint && "h-6 w-1 bg-gray-400"
      )} />

      {/* ─────────────────────────────────────────────────────
          LEVEL 2 — 5 Department Officers (horizontal row)
         ───────────────────────────────────────────────────── */}
      <div className="w-full relative">
        {/* Horizontal connector line */}
        <div className={cn(
          "absolute top-0 left-[5%] right-[5%] h-0.5 bg-primary/20",
          isPrint && "bg-gray-400 left-[3%] right-[3%]"
        )} />

        <div className="flex justify-between w-full px-[5%] gap-2 sm:gap-3">
          {executiveHeads.map((head: any, idx: number) => {
            const officer = volunteers?.find((v: any) => v.position === head.pos);
            const committee = getCommitteeMembers(head.dept);

            return (
              <div
                key={idx}
                className={cn(
                  "flex flex-col items-center gap-3 sm:gap-4 flex-1 org-node",
                  isPrint && "gap-2"
                )}
              >
                {/* Vertical line from top connector */}
                <div className={cn(
                  "w-0.5 h-6 sm:h-8 bg-primary/20",
                  isPrint && "h-5 w-1 bg-gray-400"
                )} />

                {/* Officer Box */}
                <div className={cn(
                  "p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-primary/20 bg-card text-center shadow-md w-32 sm:w-40 lg:w-48 hover:scale-105 transition-transform duration-300",
                  isPrint && "p-2 rounded-lg border border-black bg-white w-44 shadow-none hover:scale-100"
                )}>
                  <div className={cn(
                    "text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-primary mb-0.5 sm:mb-1",
                    isPrint && "text-[7px] text-black font-black tracking-wider"
                  )}>
                    {head.title}
                  </div>
                  <div className={cn(
                    "text-xs sm:text-sm font-bold truncate",
                    isPrint && "text-sm font-bold"
                  )}>
                    {officer?.fullName || <span className="text-gray-400 font-normal italic text-[11px]">Vacant</span>}
                  </div>
                </div>

                {/* Vertical line to committee */}
                <div className={cn(
                  "w-0.5 h-3 sm:h-4 bg-border/50",
                  isPrint && "h-3 w-1 bg-gray-400"
                )} />

                {/* Committee Box */}
                <div className={cn("w-full px-1 sm:px-2 committee-box", isPrint && "px-1")}>
                  <div
                    onClick={() => !isPrint && onCommitteeClick?.(head.dept)}
                    className={cn(
                      "bg-muted/30 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-border/50 transition-all group/box text-[10px]",
                      !isPrint && "cursor-pointer hover:bg-primary/[0.03] hover:border-primary/30",
                      isPrint && "bg-white border border-black p-2 rounded text-[9px]"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-between text-[7px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-1 border-b border-border/50 pb-0.5",
                      isPrint && "text-[8px] text-black font-bold border-b border-black mb-1 pb-1"
                    )}>
                      <span>Committee</span>
                      {committee.length > 0 && (
                        <span className={cn(
                          "text-[7px] px-1 rounded bg-primary/10 text-primary",
                          isPrint && "bg-gray-200 text-gray-600"
                        )}>
                          {committee.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {committee.length > 0 ? committee.map((m: any) => {
                        const isAbm = m.position === "Assisting Board Member";
                        return (
                          <div
                            key={m.id}
                            className={cn(
                              "text-[9px] sm:text-[10px] leading-tight flex items-start gap-1",
                              isAbm
                                ? "font-bold text-primary"
                                : "font-medium text-foreground/80",
                              isPrint && isAbm
                                ? "font-bold text-black"
                                : isPrint && "font-normal text-black"
                            )}
                          >
                            <span className={cn(
                              "inline-block flex-shrink-0 mt-1 w-1 h-1 rounded-full",
                              isAbm ? "bg-primary" : "bg-primary/40"
                            )} />
                            <span className="line-clamp-2">
                              {m.fullName}
                              {isAbm && (
                                <span className={cn(
                                  "text-[7px] uppercase tracking-tighter opacity-60 ml-1",
                                  isPrint && "opacity-100"
                                )}>
                                  (ABM)
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      }) : (
                        <div className={cn(
                          "text-[8px] text-muted-foreground/40 italic",
                          isPrint && "text-[8px] text-gray-500"
                        )}>
                          No members
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Organizational Node — single person position card
 */
function OrgNode({
  person,
  title,
  primary = false
}: {
  person?: Volunteer;
  title: string;
  primary?: boolean;
}) {
  return (
    <div className="org-node flex flex-col items-center">
      <div className={cn(
        "min-w-[160px] sm:min-w-[200px] p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-center shadow-lg relative transition-all hover:shadow-xl",
        primary
          ? "border-primary bg-gradient-to-br from-primary to-primary/80 text-white shadow-primary/30"
          : "border-primary/20 bg-card text-foreground hover:border-primary/30"
      )}>
        <div className={cn(
          "text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] mb-1 sm:mb-1.5 leading-tight",
          primary ? "text-white/80" : "text-muted-foreground"
        )}>
          {title}
        </div>
        <div className={cn(
          "text-base sm:text-lg font-black tracking-tight leading-none uppercase",
          primary ? "text-white" : "text-foreground"
        )}>
          {person ? person.fullName : "VACANT"}
        </div>
      </div>
    </div>
  );
}
