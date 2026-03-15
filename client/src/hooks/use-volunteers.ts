import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertVolunteer, type Volunteer, type RankingRecord } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useVolunteers() {
  return useQuery<Volunteer[]>({
    queryKey: [api.volunteers.list.path],
    queryFn: async () => {
      const res = await fetch(api.volunteers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch volunteers");
      const data = await res.json();
      // Bypassing strict Zod parse here in case date strings cause issues with z.custom
      return data as Volunteer[];
    },
  });
}

export function useVolunteerRankings(year?: number) {
  return useQuery<RankingRecord[]>({
    queryKey: [api.volunteers.ranking.path, year],
    queryFn: async () => {
      const url = year 
        ? `${api.volunteers.ranking.path}?year=${year}` 
        : api.volunteers.ranking.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch rankings");
      return (await res.json()) as RankingRecord[];
    },
  });
}

export function useCreateVolunteer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertVolunteer) => {
      const res = await fetch(api.volunteers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create volunteer");
      return (await res.json()) as Volunteer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.volunteers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.volunteers.ranking.path] });
      queryClient.invalidateQueries({ queryKey: [api.statistics.get.path] });
      toast({ title: "Success", description: "Volunteer created successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateVolunteer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertVolunteer>) => {
      const url = buildUrl(api.volunteers.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update volunteer");
      return (await res.json()) as Volunteer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.volunteers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.volunteers.ranking.path] });
      queryClient.invalidateQueries({ queryKey: [api.statistics.get.path] });
      toast({ title: "Success", description: "Volunteer updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteVolunteer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.volunteers.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete volunteer");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.volunteers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.volunteers.ranking.path] });
      queryClient.invalidateQueries({ queryKey: [api.statistics.get.path] });
      toast({ title: "Success", description: "Volunteer deleted successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
