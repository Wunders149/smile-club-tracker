import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useVolunteers, useCreateVolunteer, useUpdateVolunteer, useDeleteVolunteer } from "@/hooks/use-volunteers";
import { POSITIONS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit2, Trash2, Mail, Phone, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVolunteerSchema, type Volunteer } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type FormValues = z.infer<typeof insertVolunteerSchema>;

export default function Volunteers() {
  const { data: volunteers, isLoading } = useVolunteers();
  const createMut = useCreateVolunteer();
  const updateMut = useUpdateVolunteer();
  const deleteMut = useDeleteVolunteer();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVol, setEditingVol] = useState<Volunteer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(insertVolunteerSchema),
    defaultValues: {
      fullName: "", contact: "", address: "", email: "", photo: "", studyField: "", major: "", position: POSITIONS[8]
    }
  });

  const onEdit = (vol: Volunteer) => {
    form.reset({
      fullName: vol.fullName, contact: vol.contact, address: vol.address,
      email: vol.email, photo: vol.photo || "", studyField: vol.studyField || "",
      major: vol.major || "", position: vol.position
    });
    setEditingVol(vol);
  };

  const onSubmit = async (data: FormValues) => {
    if (editingVol) {
      await updateMut.mutateAsync({ id: editingVol.id, ...data });
      setEditingVol(null);
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
            <h1 className="text-3xl font-display font-bold text-foreground">Volunteers</h1>
            <p className="text-muted-foreground mt-1">Manage the amazing team behind Smile Club.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) form.reset();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6">
                <Plus className="w-4 h-4 mr-2" /> Add Volunteer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Add New Volunteer</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john@example.com" type="email" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="contact" render={({ field }) => (
                      <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="+261 34 00 000 00" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="Mahajanga" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="position" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select position" /></SelectTrigger></FormControl>
                          <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage/>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="photo" render={({ field }) => (
                      <FormItem><FormLabel>Photo URL (optional)</FormLabel><FormControl><Input placeholder="https://..." className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="studyField" render={({ field }) => (
                      <FormItem><FormLabel>Study Field (optional)</FormLabel><FormControl><Input placeholder="Medicine, IT..." className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="major" render={({ field }) => (
                      <FormItem><FormLabel>Major (optional)</FormLabel><FormControl><Input placeholder="Surgery, Software..." className="rounded-xl" {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>
                    )} />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createMut.isPending} className="rounded-xl px-8 w-full sm:w-auto">
                      {createMut.isPending ? "Creating..." : "Save Volunteer"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={!!editingVol} onOpenChange={(open) => { if (!open) setEditingVol(null); }}>
             <DialogContent className="sm:max-w-[600px] bg-card rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Edit Volunteer</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="contact" render={({ field }) => (
                      <FormItem><FormLabel>Contact</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Address</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="position" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage/>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="photo" render={({ field }) => (
                      <FormItem><FormLabel>Photo URL</FormLabel><FormControl><Input className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="studyField" render={({ field }) => (
                      <FormItem><FormLabel>Study Field</FormLabel><FormControl><Input className="rounded-xl" {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="major" render={({ field }) => (
                      <FormItem><FormLabel>Major</FormLabel><FormControl><Input className="rounded-xl" {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>
                    )} />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={updateMut.isPending} className="rounded-xl px-8 w-full sm:w-auto">
                      {updateMut.isPending ? "Saving..." : "Update Details"}
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
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the volunteer and remove their attendance records.
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

        {/* Table */}
        <div className="bg-card rounded-2xl shadow-lg shadow-black/5 border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Volunteer</TableHead>
                  <TableHead className="font-semibold text-foreground">Contact</TableHead>
                  <TableHead className="font-semibold text-foreground">Position</TableHead>
                  <TableHead className="font-semibold text-foreground">Education</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading volunteers...</TableCell></TableRow>
                ) : !volunteers?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12">
                    <Users className="w-12 h-12 text-muted mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No volunteers yet</p>
                  </TableCell></TableRow>
                ) : (
                  volunteers.map((vol) => (
                    <TableRow key={vol.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden border border-primary/20">
                            {vol.photo ? <img src={vol.photo} alt={vol.fullName} className="w-full h-full object-cover" /> : vol.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{vol.fullName}</p>
                            <p className="text-xs text-muted-foreground">{vol.address}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 text-foreground"><Phone className="w-3.5 h-3.5 text-muted-foreground"/> {vol.contact}</div>
                          <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5"><Mail className="w-3.5 h-3.5"/> {vol.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary-foreground">
                          {vol.position}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(vol.studyField || vol.major) ? (
                          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{vol.studyField} {vol.major && `(${vol.major})`}</span>
                          </div>
                        ) : <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit(vol)}>
                              <Edit2 className="w-4 h-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer" onClick={() => setDeletingId(vol.id)}>
                              <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
