'use client'; // Mark as client component if we add interactivity later

import React from 'react';
import { RegistrationForm } from '@/components/registration-form'; // Import the form component
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  return (
    // Added padding/margin for better spacing within the dashboard layout
    <div className="py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Register for Youth Rally</CardTitle>
          <CardDescription>
            Please fill out the form below to register for the Youth Rally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm /> {/* Use the form component here */}
        </CardContent>
      </Card>
    </div>
  );
} 