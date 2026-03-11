import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { EVENT_TYPES, type InsertEvent, type Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit2, Trash2, CalendarDays, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

// Re-create schema to handle datetime-local string properly before sending
const formSchema = insertEventSchema.extend({
  date: z.coerce.date(),
  endTime: z.coerce.date().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Events() {
  const { data: events, isLoading } = useEvents();
  const createMut = useCreateEvent();
  const updateMut = useUpdateEvent();
  const deleteMut = useDeleteEvent();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", type: EVENT_TYPES[0], date: new Date(), description: "", venue: "", speaker: "", endTime: null
    }
  });

  const onEdit = (ev: Event) => {
    form.reset({
      name: ev.name, type: ev.type, date: new Date(ev.date), description: ev.description || "",
      venue: ev.venue || "", speaker: ev.speaker || "", endTime: ev.endTime ? new Date(ev.endTime) : null
    });
    setEditingEvent(ev);
  };

  const onSubmit = async (data: FormValues) => {
    if (editingEvent) {
      await updateMut.mutateAsync({ id: editingEvent.id, ...data });
      setEditingEvent(null);
    } else {
      await createMut.mutateAsync(data);
      setIsAddOpen(false);
    }
    form.reset();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1">Plan and track all club activities.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) form.reset({ date: new Date() });
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6">
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Add New Event</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Event Name</FormLabel><FormControl><Input placeholder="Annual Meeting..." className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage/>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date & Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="rounded-xl" 
                            value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage/>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="venue" render={({ field }) => (
                      <FormItem><FormLabel>Venue</FormLabel><FormControl><Input placeholder="Meeting Room A" className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="speaker" render={({ field }) => (
                      <FormItem><FormLabel>Speaker (optional)</FormLabel><FormControl><Input placeholder="Dr. Smith" className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ending Time (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          className="rounded-xl" 
                          value={field.value ? new Date(new Date(field.value).getTime() - new Date(field.value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage/>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea className="rounded-xl resize-none h-24" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createMut.isPending} className="rounded-xl px-8 w-full sm:w-auto">
                      {createMut.isPending ? "Creating..." : "Save Event"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) setEditingEvent(null); }}>
             <DialogContent className="sm:max-w-[500px] bg-card rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Edit Event</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Event Name</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage/>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date & Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            className="rounded-xl" 
                            value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage/>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="venue" render={({ field }) => (
                      <FormItem><FormLabel>Venue</FormLabel><FormControl><Input placeholder="Meeting Room A" className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="speaker" render={({ field }) => (
                      <FormItem><FormLabel>Speaker (optional)</FormLabel><FormControl><Input placeholder="Dr. Smith" className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ending Time (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          className="rounded-xl" 
                          value={field.value ? new Date(new Date(field.value).getTime() - new Date(field.value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage/>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="rounded-xl resize-none h-24" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={updateMut.isPending} className="rounded-xl px-8 w-full sm:w-auto">
                      {updateMut.isPending ? "Saving..." : "Update Event"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete Alert */}
          <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the event and all associated attendance records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                  onClick={async () => {
                    if (deletingId) await deleteMut.mutateAsync(deletingId);
                    setDeletingId(null);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">Loading events...</div>
          ) : !events?.length ? (
            <div className="col-span-full py-16 text-center bg-card rounded-2xl border border-border/50">
              <CalendarDays className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted-foreground font-medium text-lg">No events planned</p>
              <p className="text-sm text-muted-foreground mt-1">Click the Add Event button to create one.</p>
            </div>
          ) : (
            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((ev) => {
              const isPast = new Date(ev.date) < new Date();
              return (
                <div key={ev.id} className={`
                  bg-card rounded-2xl p-6 shadow-lg shadow-black/5 border transition-all duration-300 relative group
                  ${isPast ? 'border-border/40 opacity-80 hover:opacity-100' : 'border-border/80 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1'}
                `}>
                  <div className="absolute top-4 right-4 z-10">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-muted"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl shadow-xl">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit(ev)}>
                          <Edit2 className="w-4 h-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer" onClick={() => setDeletingId(ev.id)}>
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`
                      flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-xl text-center
                      ${isPast ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}
                    `}>
                      <span className="text-xs font-bold uppercase leading-none mb-1">{format(new Date(ev.date), 'MMM')}</span>
                      <span className="text-xl font-display font-bold leading-none">{format(new Date(ev.date), 'dd')}</span>
                    </div>
                    <div className="flex-1 pr-6">
                      <h3 className="font-bold text-lg text-foreground line-clamp-1" title={ev.name}>{ev.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary-foreground mt-1">
                        {ev.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      {format(new Date(ev.date), 'EEEE, h:mm a')}
                    </div>
                    {ev.description && (
                      <p className="line-clamp-2 mt-3 pt-3 border-t border-border/50 text-foreground/80 text-sm">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
