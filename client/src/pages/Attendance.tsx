import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useEvents } from "@/hooks/use-events";
import { useVolunteers } from "@/hooks/use-volunteers";
import { useEventAttendances, useRecordAttendance } from "@/hooks/use-attendances";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { CheckSquare, Save, Users, AlertCircle, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";

export default function Attendance() {
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: volunteers, isLoading: loadingVols } = useVolunteers();
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const { data: existingAttendances, isLoading: loadingAttendances } = useEventAttendances(selectedEventId);
  const recordMut = useRecordAttendance();

  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({});
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
  const sortedVolunteers = volunteers ? [...volunteers].sort((a, b) => a.fullName.localeCompare(b.fullName)) : [];
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Record Attendance</h1>
            <p className="text-muted-foreground mt-1">Select an event and mark attendance status for each volunteer.</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
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
                <div className="p-4 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />
                    <Button variant="outline" size="sm" onClick={() => updateAll('on_time')} className="rounded-lg h-9 text-xs">✓ On Time</Button>
                    <Button variant="outline" size="sm" onClick={() => updateAll('late')} className="rounded-lg h-9 text-xs">⏱ Late</Button>
                    <Button variant="outline" size="sm" onClick={() => updateAll('excused')} className="rounded-lg h-9 text-xs">ℹ Excused</Button>
                    <Button variant="outline" size="sm" onClick={() => updateAll('absent')} className="rounded-lg h-9 text-xs">✗ Absent</Button>
                  </div>
                </div>

                <div className="divide-y divide-border/20 max-h-[500px] overflow-y-auto">
                  {sortedVolunteers.map((vol) => {
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
                  })}
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

        {/* Printable Roster */}
        <div className="print-only">
          <div ref={printRef} className="p-10 bg-white text-black font-sans w-full">
            <style>{`
              @page {
                size: auto;
                margin: 20mm;
              }
              @media print {
                tr {
                  page-break-inside: avoid;
                }
                thead {
                  display: table-header-group;
                }
                tfoot {
                  display: table-footer-group;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
              }
            `}</style>
            <div className="flex justify-between items-start mb-8 border-b-2 border-primary pb-6">
              <div>
                <img src="/smile-club-logo.png" alt="Logo" className="h-16 mb-2" />
                <h1 className="text-2xl font-bold uppercase tracking-tight">Attendance Roster</h1>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{selectedEvent?.name || "Event Roster"}</p>
                <p className="text-gray-600">{selectedEvent?.date ? format(new Date(selectedEvent.date), 'MMMM d, yyyy') : format(new Date(), 'MMMM d, yyyy')}</p>
                <p className="text-gray-500 text-sm mt-1">{selectedEvent?.type || "General"}</p>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-left font-bold uppercase text-xs tracking-wider">Volunteer Name</th>
                  <th className="border border-gray-200 p-3 text-left font-bold uppercase text-xs tracking-wider">Position</th>
                  <th className="border border-gray-200 p-3 text-center font-bold uppercase text-xs tracking-wider w-32">Status</th>
                  <th className="border border-gray-200 p-3 text-left font-bold uppercase text-xs tracking-wider w-40">Signature</th>
                </tr>
              </thead>
              <tbody>
                {sortedVolunteers.map((vol) => (
                  <tr key={vol.id}>
                    <td className="border border-gray-200 p-3 font-medium">{vol.fullName}</td>
                    <td className="border border-gray-200 p-3 text-gray-600 text-sm">{vol.position}</td>
                    <td className="border border-gray-200 p-3 text-center font-bold text-xs uppercase italic">
                      {attendanceState[vol.id] !== 'absent' ? (attendanceState[vol.id]?.replace('_', ' ')) : ''}
                    </td>
                    <td className="border border-gray-200 p-3"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-end text-xs text-gray-400">
              <p>Generated by Smile Club Mahajanga Tracker</p>
              <p className="italic">"For the patients"</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
