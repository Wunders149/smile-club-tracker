import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useEvents } from "@/hooks/use-events";
import { useVolunteers } from "@/hooks/use-volunteers";
import { useEventAttendances, useRecordAttendance } from "@/hooks/use-attendances";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { CheckSquare, Save, Users, AlertCircle, Printer, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";

export default function Attendance() {
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: volunteers, isLoading: loadingVols } = useVolunteers();

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const { data: existingAttendances, isLoading: loadingAttendances } = useEventAttendances(selectedEventId);
  const recordMut = useRecordAttendance();

  // Set default selected event to nearest event to current date
  useEffect(() => {
    if (events && events.length > 0 && selectedEventId === null) {
      const now = new Date();
      const nearestEvent = events.reduce((prev, curr) => {
        const prevDiff = Math.abs(new Date(prev.date).getTime() - now.getTime());
        const currDiff = Math.abs(new Date(curr.date).getTime() - now.getTime());
        return currDiff < prevDiff ? curr : prev;
      });
      setSelectedEventId(nearestEvent.id);
    }
  }, [events, selectedEventId]);

  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Attendance_Roster_${format(new Date(), 'yyyy-MM-dd')}`,
  });
  
  useEffect(() => {
    if (volunteers && existingAttendances) {
      const newState: Record<number, string> = {};
      volunteers.forEach(v => newState[v.id] = 'absent');
      existingAttendances.forEach(a => {
        newState[a.volunteerId] = a.status || 'absent';
      });
      setAttendanceState(newState);
    }
  }, [volunteers, existingAttendances]);

  const updateStatus = (id: number, status: string) => {
    setAttendanceState(prev => ({ ...prev, [id]: status }));
  };

  const updateAll = (status: string) => {
    if (!volunteers) return;
    const newState: Record<number, string> = {};
    volunteers.forEach(v => newState[v.id] = status);
    setAttendanceState(newState);
  };

  const handleSave = async () => {
    if (!selectedEventId || !volunteers) return;
    const records = volunteers.map(v => ({
      volunteerId: v.id,
      status: attendanceState[v.id] || 'absent'
    }));
    await recordMut.mutateAsync({ eventId: selectedEventId, records });
  };

  const sortedEvents = events ? [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
  
  const filteredVolunteers = volunteers 
    ? [...volunteers]
        .filter(v => v.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.fullName.localeCompare(b.fullName)) 
    : [];

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  const statusColors: Record<string, string> = {
    on_time: 'bg-green-100 text-green-800 border-green-200',
    late: 'bg-blue-100 text-blue-800 border-blue-200',
    excused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    absent: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Record Attendance</h1>
              <p className="text-muted-foreground mt-1">Select an event and mark attendance status for each volunteer.</p>
            </div>
          </div>

          <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
              <CardTitle className="text-lg">1. Select Event</CardTitle>
              <CardDescription>Choose the event you want to record attendance for.</CardDescription>
              <div className="mt-4 max-w-md">
                <Select 
                  value={selectedEventId?.toString() || ""} 
                  onValueChange={(v) => setSelectedEventId(Number(v))}
                  disabled={loadingEvents}
                >
                  <SelectTrigger className="rounded-xl h-12 text-base">
                    <SelectValue placeholder="Select an event..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {sortedEvents.map(e => (
                      <SelectItem key={e.id} value={e.id.toString()}>
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">{e.name}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d, yyyy')} • {e.type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {!selectedEventId ? (
                <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select an event above to load the volunteer list.</p>
                </div>
              ) : loadingVols || loadingAttendances ? (
                <div className="py-12 text-center text-muted-foreground">Loading roster...</div>
              ) : !volunteers?.length ? (
                <div className="py-12 text-center text-muted-foreground">No volunteers found.</div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                  <div className="p-4 sm:p-6 border-b border-border/50 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" /> Roster 
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {Object.values(attendanceState).filter(s => s !== 'absent').length} Attending
                          </span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleSave} 
                          disabled={recordMut.isPending}
                          className="rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 h-9 px-4"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" /> {recordMut.isPending ? "Saving..." : "Save"}
                        </Button>
                        <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />
                        <Button variant="outline" size="sm" onClick={() => handlePrint()} className="rounded-lg h-9 text-xs border-primary/30 text-primary">
                          <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Roster
                        </Button>
                      </div>
                    </div>

                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search volunteer by name..." 
                        className="pl-9 rounded-xl border-border/50 bg-card focus:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      <span className="text-xs font-bold text-muted-foreground mr-2 uppercase tracking-tight">Bulk Actions:</span>
                      <Button variant="outline" size="sm" onClick={() => updateAll('on_time')} className="rounded-lg h-8 text-[10px] uppercase font-bold tracking-wider">✓ On Time</Button>
                      <Button variant="outline" size="sm" onClick={() => updateAll('late')} className="rounded-lg h-8 text-[10px] uppercase font-bold tracking-wider">⏱ Late</Button>
                      <Button variant="outline" size="sm" onClick={() => updateAll('excused')} className="rounded-lg h-8 text-[10px] uppercase font-bold tracking-wider">ℹ Excused</Button>
                      <Button variant="outline" size="sm" onClick={() => updateAll('absent')} className="rounded-lg h-8 text-[10px] uppercase font-bold tracking-wider">✗ Absent</Button>
                    </div>
                  </div>

                  <div className="divide-y divide-border/20 max-h-[500px] overflow-y-auto">
                    {filteredVolunteers.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground italic">No volunteers match your search.</div>
                    ) : (
                      filteredVolunteers.map((vol) => {
                        const status = attendanceState[vol.id] || 'absent';
                        return (
                          <div key={vol.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold overflow-hidden">
                                {vol.photo ? <img src={vol.photo} alt={vol.fullName} className="w-full h-full object-cover" /> : vol.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{vol.fullName}</p>
                                <p className="text-xs text-muted-foreground">{vol.position}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {['on_time', 'late', 'excused', 'absent'].map(s => (
                                <button key={s} onClick={() => updateStatus(vol.id, s)} className={`px-2 py-1 rounded text-xs font-semibold transition-all ${status === s ? statusColors[s] : 'bg-muted text-muted-foreground'}`}>
                                  {s === 'on_time' ? '✓' : s === 'late' ? '⏱' : s === 'excused' ? 'ℹ' : '✗'}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-6 bg-muted/20 border-t border-border/50 flex items-center justify-between rounded-b-2xl">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      5 pts for on-time, 3 for late, 1 for excused, 0 for absent
                    </div>
                    <Button 
                      onClick={handleSave} 
                      disabled={recordMut.isPending}
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 px-8 h-12"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {recordMut.isPending ? "Saving..." : "Save Records"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Printable Roster - Professional Attendance Sheet */}
        <div className="print-only hidden">
          <div 
            ref={printRef} 
            className="p-6 sm:p-10 bg-white text-black font-sans w-full"
            style={{
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact'
            }}
          >
            <style>{`
              @page {
                size: A4;
                margin: 20mm;
              }
              @media print {
                * {
                  print-color-adjust: exact !important;
                  -webkit-print-color-adjust: exact !important;
                }
                body {
                  background: white !important;
                  margin: 0;
                  padding: 0;
                }
                .attendance-print-header {
                  position: fixed;
                  top: 0;
                  left: 20mm;
                  right: 20mm;
                  background: white;
                  z-index: 999;
                }
                .attendance-print-content {
                  padding-top: 130px;
                }
                .roster-page {
                  page-break-after: always;
                  break-after: page;
                }
                .roster-page:last-child {
                  page-break-after: avoid;
                  break-after: avoid;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                  page-break-inside: auto;
                }
                tr {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
                thead {
                  display: table-header-group;
                  border-bottom: 2px solid black;
                }
                tbody tr:nth-child(odd) {
                  background-color: #f9f9f9;
                }
                .signature-line {
                  min-height: 35px;
                  border-bottom: 1px solid #333;
                  margin: 0;
                  padding: 0;
                }
              }
            `}</style>

            <div className="attendance-print-content">
            {/* Header (fixed, repeats on every printed page) */}
            <div className="attendance-print-header flex justify-between items-end mb-4 border-b-2 border-black pb-3">
              <div className="flex items-end gap-4">
                <img src="/smile-club-logo.png" alt="Smile Club Mahajanga" className="w-16 h-16 object-contain flex-shrink-0" />
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none">Attendance Roster</h1>
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mt-1">Smile Club Mahajanga</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{selectedEvent?.name || "Event Roster"}</p>
                <p className="text-xs text-gray-700 font-semibold">
                  {selectedEvent?.date ? format(new Date(selectedEvent.date), 'MMMM d, yyyy • h:mm a') : format(new Date(), 'MMMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{selectedEvent?.type || "General"}</p>
                <p className="text-[10px] text-gray-500 mt-2">
                  Total Volunteers: <span className="font-bold">{volunteers?.length || 0}</span>
                </p>
              </div>
            </div>

            {/* Instructions/Legend */}
            <div className="mb-4 text-xs border border-gray-300 p-2 bg-gray-50">
              <p className="font-bold mb-1">Attendance Status Legend:</p>
              <p>✓ = On Time (5 pts) | ⏱ = Late (3 pts) | ℹ = Excused (1 pt) | ✗ = Absent (0 pts)</p>
            </div>

            {/* Multi-page Roster Table */}
            {volunteers && (
              <>
                {Array.from({ length: Math.ceil(volunteers.length / 25) }).map((_, pageIdx) => {
                  const pageVolunteers = volunteers
                    .sort((a, b) => a.fullName.localeCompare(b.fullName))
                    .slice(pageIdx * 25, (pageIdx + 1) * 25);
                  
                  return (
                    <div key={pageIdx} className="roster-page">
                      <table>
                        {pageIdx === 0 && (
                          <thead>
                            <tr className="bg-gray-200 border-b-2 border-black">
                              <th className="border border-gray-400 p-2 text-left font-bold uppercase text-xs tracking-wider w-40">Name</th>
                              <th className="border border-gray-400 p-2 text-left font-bold uppercase text-xs tracking-wider">Position</th>
                              <th className="border border-gray-400 p-2 text-center font-bold uppercase text-xs tracking-wider w-16">Status</th>
                              <th className="border border-gray-400 p-2 text-center font-bold uppercase text-xs tracking-wider flex-1">Signature</th>
                            </tr>
                          </thead>
                        )}
                        {pageIdx > 0 && (
                          <thead>
                            <tr className="bg-gray-200 border-b-2 border-black">
                              <th className="border border-gray-400 p-2 text-left font-bold uppercase text-xs tracking-wider w-40">Name</th>
                              <th className="border border-gray-400 p-2 text-left font-bold uppercase text-xs tracking-wider">Position</th>
                              <th className="border border-gray-400 p-2 text-center font-bold uppercase text-xs tracking-wider w-16">Status</th>
                              <th className="border border-gray-400 p-2 text-center font-bold uppercase text-xs tracking-wider flex-1">Signature</th>
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {pageVolunteers.map((vol, idx) => {
                            const status = attendanceState[vol.id] || 'absent';
                            const statusDisplay = {
                              'on_time': '✓',
                              'late': '⏱',
                              'excused': 'ℹ',
                              'absent': '✗'
                            }[status] || '';

                            return (
                              <tr key={vol.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-400 p-2 font-semibold text-sm">{vol.fullName}</td>
                                <td className="border border-gray-400 p-2 text-xs text-gray-700">{vol.position}</td>
                                <td className="border border-gray-400 p-2 text-center font-bold text-base">
                                  {statusDisplay}
                                </td>
                                <td className="border border-gray-400 p-0">
                                  <div className="signature-line" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Page footer */}
                      {pageIdx === Math.ceil(volunteers.length / 25) - 1 && (
                        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600 flex justify-between">
                          <div>
                            <p className="font-semibold">Total Pages: {Math.ceil(volunteers.length / 25)}</p>
                            <p className="text-gray-500 text-[10px] mt-1">Generated {format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-black">"For The Patients!"</p>
                            <p className="text-[10px] text-gray-500">Smile Club Mahajanga Tracker</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
