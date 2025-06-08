'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../src/lib/supabase/client';
import type { Database } from '../../../src/lib/supabase/database.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParticipantTable } from '@/components/participant-table';

type RegistrantRow = Database['public']['Tables']['registrants']['Row'];

export default function ViewGroupsPage() {
  const [allRegistrants, setAllRegistrants] = useState<RegistrantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("all");

  useEffect(() => {
    async function fetchAllRegistrants() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('registrants')
          .select('*')
          .gte('age', 12)
          .order('assigned_group', { ascending: true, nullsFirst: false })
          .order('full_name', { ascending: true });

        if (fetchError) throw fetchError;
        setAllRegistrants(data || []);
      } catch (err: any) {
        console.error("Error fetching registrants:", err);
        setError(err.message || "Failed to fetch registrants.");
        setAllRegistrants([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAllRegistrants();
  }, []);

  const filteredRegistrants = useMemo(() => {
    if (selectedTab === 'all') {
      return allRegistrants;
    }
    if (selectedTab === 'unassigned') {
        return allRegistrants.filter(reg => reg.assigned_group === null);
    }
    const groupNum = parseInt(selectedTab, 10);
    return allRegistrants.filter(reg => reg.assigned_group === groupNum);
  }, [allRegistrants, selectedTab]);

  return (
    <div className="py-6">
        <div className="mb-4">
           <h1 className="text-2xl font-bold">View Groups</h1>
           <p className="text-muted-foreground">View participants organised by their assigned group.</p>
       </div>
      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedTab} value={selectedTab}>
        <TabsList className="grid w-full grid-cols-7 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="1">Group 1</TabsTrigger>
          <TabsTrigger value="2">Group 2</TabsTrigger>
          <TabsTrigger value="3">Group 3</TabsTrigger>
          <TabsTrigger value="4">Group 4</TabsTrigger>
          <TabsTrigger value="5">Group 5</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Participants ({filteredRegistrants.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}
                {!loading && !error && <ParticipantTable registrants={filteredRegistrants} />}
            </CardContent>
          </Card>
        </TabsContent>

         {[1, 2, 3, 4, 5].map(groupNum => {
            const groupRegistrants = allRegistrants.filter(reg => reg.assigned_group === groupNum);
             return (
                <TabsContent key={groupNum} value={String(groupNum)}>
                    <Card>
                        <CardHeader>
                        <CardTitle>Group {groupNum} ({groupRegistrants.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading && <p>Loading...</p>}
                            {error && <p className="text-red-500">Error: {error}</p>}
                            {!loading && !error && <ParticipantTable registrants={groupRegistrants} />}
                        </CardContent>
                    </Card>
                </TabsContent>
             )
          })}

        <TabsContent value="unassigned">
             <Card>
                <CardHeader>
                    <CardTitle>Unassigned Participants ({filteredRegistrants.length})</CardTitle>
                    <CardDescription>Participants who have not yet been assigned to a group.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && <p>Loading...</p>}
                    {error && <p className="text-red-500">Error: {error}</p>}
                    {!loading && !error && <ParticipantTable registrants={filteredRegistrants} />}
                </CardContent>
             </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
} 