import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Attendance } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useEventAttendances(eventId: number | null) {
  return useQuery<Attendance[]>({
    queryKey: [api.attendances.listByEvent.path, eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const url = buildUrl(api.attendances.listByEvent.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendances");
      return (await res.json()) as Attendance[];
    },
    enabled: !!eventId,
  });
}

export function useRecordAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { eventId: number, records: { volunteerId: number, status: string }[] }) => {
      const res = await fetch(api.attendances.record.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to record attendance");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.attendances.listByEvent.path, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: [api.volunteers.ranking.path] });
      queryClient.invalidateQueries({ queryKey: [api.statistics.get.path] });
      toast({ title: "Success", description: "Attendance recorded successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
