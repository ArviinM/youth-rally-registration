'use client';

import React from 'react';
import type { Database } from '../src/lib/supabase/database.types'; // Corrected relative path
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type RegistrantRow = Database['public']['Tables']['registrants']['Row'];

interface ParticipantTableProps {
  registrants: RegistrantRow[];
  caption?: string; // Optional caption
}

export function ParticipantTable({ registrants, caption }: ParticipantTableProps) {
  return (
    <Table>
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-center">Age</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="text-center">Group</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrants.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No participants found for this view.
            </TableCell>
          </TableRow>
        ) : (
          registrants.map((reg) => (
            <TableRow key={reg.id}>
              <TableCell className="font-medium">{reg.full_name}</TableCell>
              <TableCell className="text-center">{reg.age}</TableCell>
              <TableCell>{reg.gender || '-'}</TableCell>
              <TableCell>{reg.church_location}</TableCell>
              <TableCell className="text-center">
                {reg.assigned_group ? (
                  <Badge variant="secondary">{reg.assigned_group}</Badge>
                ) : (
                  <Badge variant="outline">None</Badge>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
} 