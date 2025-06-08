'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserCheck, Info } from 'lucide-react';

// Define structure for stats
interface DashboardStats {
  total: number;
  group1: number;
  group2: number;
  group3: number;
  group4: number;
  group5: number;
  unassigned: number;
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        // Fetch all counts in parallel
        const [totalRes, g1Res, g2Res, g3Res, g4Res, g5Res, unassignedRes] = await Promise.all([
          supabase.from('registrants').select('id', { count: 'exact', head: true }).gte('age', 12),
          supabase.from('registrants').select('id', { count: 'exact', head: true }).eq('assigned_group', 1),
          supabase.from('registrants').select('id', { count: 'exact', head: true }).eq('assigned_group', 2),
          supabase.from('registrants').select('id', { count: 'exact', head: true }).eq('assigned_group', 3),
          supabase.from('registrants').select('id', { count: 'exact', head: true }).eq('assigned_group', 4),
          supabase.from('registrants').select('id', { count: 'exact', head: true }).eq('assigned_group', 5),
          supabase.from('registrants').select('id', { count: 'exact', head: true }).is('assigned_group', null).gte('age', 12) // Count unassigned only among eligible
        ]);

        // Check for errors in any request
        const errors = [totalRes, g1Res, g2Res, g3Res, g4Res, g5Res, unassignedRes].map(res => res.error).filter(Boolean);
        if (errors.length > 0) {
          console.error("Errors fetching stats:", errors);
          throw new Error(`Failed to fetch some statistics: ${errors[0]?.message}`); // Throw first error
        }

        // Combine counts into stats object
        setStats({
          total: totalRes.count ?? 0,
          group1: g1Res.count ?? 0,
          group2: g2Res.count ?? 0,
          group3: g3Res.count ?? 0,
          group4: g4Res.count ?? 0,
          group5: g5Res.count ?? 0,
          unassigned: unassignedRes.count ?? 0,
        });

      } catch (err: any) {
        console.error("Fetch Stats Error:", err);
        setError(err.message || "Failed to load dashboard statistics.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="py-6">
       <div className="mb-4">
           <h1 className="text-2xl font-bold">Dashboard Overview</h1>
           <p className="text-muted-foreground">Summary statistics for the Family Camp registration.</p>
       </div>
       {loading && <p>Loading statistics...</p>}
       {error && <p className="text-red-600">Error loading stats: {error}</p>}
       {!loading && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrants (12+)</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
             {[1, 2, 3, 4, 5].map(groupNum => (
                <Card key={groupNum}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Group {groupNum}</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats[`group${groupNum}` as keyof DashboardStats]}</div>
                </CardContent>
                </Card>
             ))}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unassigned (12+)</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unassigned}</div>
              </CardContent>
            </Card>
          </div>
       )}
    </div>
  );
} 