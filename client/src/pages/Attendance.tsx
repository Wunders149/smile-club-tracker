import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useEvents } from "@/hooks/use-events";
import { useVolunteers } from "@/hooks/use-volunteers";
import { useEventAttendances, useRecordAttendance } from "@/hooks/use-attendances";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CheckSquare, Save, Users, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Attendance() {
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: volunteers, isLoading: loadingVols } = useVolunteers();
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const { data: existingAttendances, isLoading: loadingAttendances } = useEventAttendances(selectedEventId);
  const recordMut = useRecordAttendance();

  // Local state for checkboxes
  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>({});
  
  // Sync existing attendances to local state when loaded
  useEffect(() => {
    if (volunteers && existingAttendances) {
      const newState: Record<number, boolean> = {};
      // Default all to false
      volunteers.forEach(v => newState[v.id] = false);
      // Overlay existing true values
      existingAttendances.forEach(a => {
        if (a.attended) newState[a.volunteerId] = true;
      });
      setAttendanceState(newState);
    }
  }, [volunteers, existingAttendances]);

  const toggleVolunteer = (id: number) => {
    setAttendanceState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (state: boolean) => {
    if (!volunteers) return;
    const newState: Record<number, boolean> = {};
    volunteers.forEach(v => newState[v.id] = state);
    setAttendanceState(newState);
  };

  const handleSave = async () => {
    if (!selectedEventId || !volunteers) return;
    
    const records = volunteers.map(v => ({
      volunteerId: v.id,
      attended: attendanceState[v.id] || false
    }));

    await recordMut.mutateAsync({ eventId: selectedEventId, records });
  };

  const sortedEvents = events ? [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
  const selectedEvent = events?.find(e => e.id === selectedEventId);

  const presentCount = Object.values(attendanceState).filter(Boolean).length;
  const totalCount = volunteers?.length || 0;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Record Attendance</h1>
          <p className="text-muted-foreground mt-1">Select an event and mark who was present.</p>
        </div>

        <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl">
          <CardHeader className="bg-muted/20 border-b border-border/50 pb-6 rounded-t-2xl">
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
              <div className="py-12 text-center text-muted-foreground">No volunteers found in the system.</div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                {/* Header Actions */}
                <div className="p-4 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-card/95 backdrop-blur z-10">
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> Roster
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-bold text-foreground">{presentCount}</span> of {totalCount} present
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => toggleAll(true)} className="rounded-lg h-9">Mark All</Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAll(false)} className="rounded-lg h-9">Clear All</Button>
                  </div>
                </div>

                {/* List */}
                <div className="divide-y divide-border/20">
                  {volunteers.map((vol) => (
                    <div 
                      key={vol.id} 
                      className={`
                        p-4 sm:px-6 flex items-center justify-between hover:bg-muted/10 transition-colors cursor-pointer
                        ${attendanceState[vol.id] ? 'bg-primary/5' : ''}
                      `}
                      onClick={() => toggleVolunteer(vol.id)}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox 
                          checked={attendanceState[vol.id] || false}
                          onCheckedChange={() => toggleVolunteer(vol.id)}
                          className="w-5 h-5 rounded data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold overflow-hidden">
                            {vol.photo ? <img src={vol.photo} alt={vol.fullName} className="w-full h-full object-cover" /> : vol.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-bold transition-colors ${attendanceState[vol.id] ? 'text-primary' : 'text-foreground'}`}>
                              {vol.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">{vol.position}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                         {attendanceState[vol.id] ? (
                           <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">Present</span>
                         ) : (
                           <span className="text-xs font-medium text-muted-foreground">Absent</span>
                         )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Save */}
                <div className="p-6 bg-muted/20 border-t border-border/50 flex items-center justify-between rounded-b-2xl">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    Unchecked volunteers will be marked as absent.
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
    </Layout>
  );
}
