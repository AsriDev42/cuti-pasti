import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  nip: string;
  full_name: string;
  email: string;
  phone: string;
  unit_id: string | null;
  position: string;
  rank: string;
  join_date: string | null;
  address: string | null;
  avatar_url: string | null;
  status: 'pending_approval' | 'active' | 'inactive' | 'rejected';
  rejection_reason: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: any }>;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: 'user' | 'admin_unit' | 'admin_pusat') => Promise<boolean>;
  isAdminPusat: () => Promise<boolean>;
  isAdminUnit: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  nip: string;
  full_name: string;
  email: string;
  password: string;
  phone: string;
  unit_id: string | null;
  position: string;
  rank: string;
  join_date?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (data: SignUpData) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: new Error('User creation failed') };

      // Profile is created automatically by trigger
      // Just assign the default user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'user'
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      // Check if identifier is email or NIP
      let email = identifier;
      
      if (!identifier.includes('@')) {
        // It's a NIP, get email from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('nip', identifier)
          .maybeSingle();

        if (profileError || !profileData) {
          return { error: new Error('NIP tidak ditemukan') };
        }

        email = profileData.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const hasRole = async (role: 'user' | 'admin_unit' | 'admin_pusat'): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', role)
      .maybeSingle();
    return !!data;
  };

  const isAdminPusat = async (): Promise<boolean> => await hasRole('admin_pusat');
  const isAdminUnit = async (): Promise<boolean> => await hasRole('admin_unit');

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    hasRole,
    isAdminPusat,
    isAdminUnit,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};