'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { SupabaseClient, Session, User, AuthChangeEvent, AuthSession } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client'; // Use relative path
import type { Database } from '../lib/supabase/database.types'; // Use relative path

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  supabase: SupabaseClient<Database>;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Start true until the listener provides initial state

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: AuthSession | null) => {
        if (!isMounted) return;

        console.log('Auth state changed:', event, currentSession);
        const newSession = currentSession;
        const newUser = newSession?.user ?? null;
        
        let changed = false;
        setUser(currentUserState => {
            changed = currentUserState?.id !== newUser?.id;
            console.log(`Comparing User IDs: Old=${currentUserState?.id}, New=${newUser?.id}, Changed=${changed}`);
            return newUser; // Update user state
        });

        setSession(newSession);

        // Only refetch profile and show loading if user ID *actually* changes,
        // or if it's the initial load setting the user for the first time.
        if (changed) {
          console.log('User ID changed or initial user set.');
          if (newUser) {
            // setLoading(true); // Set loading before async fetch
            setProfile(null); // Clear old profile while fetching new one
            try {
              // Set loading true ONLY if we are actually fetching
              if (isMounted) setLoading(true);
              const fetchedProfile = await fetchProfile(newUser.id);
              if (isMounted) setProfile(fetchedProfile);
            } catch (error) {
              console.error('Error fetching profile on auth change:', error);
              if (isMounted) setProfile(null); // Ensure profile is null on error
            } finally {
              // Always set loading false after attempt, even on initial load/logout
              if (isMounted) setLoading(false);
            }
          } else {
            // User logged out or initial state is logged out
            setProfile(null);
            setLoading(false); // Ensure loading is false
          }
        } else {
            // User ID is the same (e.g., tab focus, token refresh)
            // Make sure loading is false if it hasn't been set yet (e.g. initial load determined user is null)
            if (loading && isMounted) {
                console.log('User ID same, ensuring loading is false.');
                setLoading(false);
            }
            console.log('Auth state change detected, but user ID remains the same. No profile refetch needed.');
        }
      }
    );

    // Cleanup function
    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []); // Dependency array is empty, runs once on mount

  // Helper function to fetch profile
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
        const { data, error, status } = await supabase
            .from('profiles')
            .select(`*`)
            .eq('id', userId)
            .single();

        if (error && status !== 406) {
            console.error('Error fetching profile data:', error);
            throw error; // Re-throw non-406 errors
        }
        if (data) {
             console.log('Profile fetched successfully for:', userId);
            return data;
        }
        console.warn('No profile found for user:', userId);
        return null;
    } catch (error) {
        console.error('Caught error in fetchProfile:', error);
        return null; // Return null on error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
    }
    // Auth listener will handle setting session/user/profile to null
  };

  const isAdmin = profile?.role === 'admin';

  const value = {
    supabase,
    session,
    user,
    profile,
    loading,
    isAdmin,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
