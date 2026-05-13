'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/features/auth/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe first so we never miss an event that fires during getSession()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Then resolve the initial session.
    // If the stored refresh token is invalid / expired, Supabase throws
    // AuthApiError("Invalid Refresh Token: Refresh Token Not Found").
    // We must call signOut() to purge the bad token from storage; that
    // triggers SIGNED_OUT via the listener above, which sets session → null
    // and loading → false, so AuthGuard redirects to /signin cleanly.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.warn('[useSession] getSession error — clearing session:', error.message);
        supabase.auth.signOut(); // fires onAuthStateChange → SIGNED_OUT
      } else {
        setSession(data.session);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}