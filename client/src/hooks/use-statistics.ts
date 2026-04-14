import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type StatisticsData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useStatistics() {
  const { toast } = useToast();

  return useQuery<StatisticsData>({
    queryKey: [api.statistics.get.path],
    queryFn: async () => {
      const res = await fetch(api.statistics.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch statistics");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000,    // 30 seconds polling
    retry: 2,
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load statistics. Please try again.",
          variant: "destructive",
        });
      },
    },
  });
}
