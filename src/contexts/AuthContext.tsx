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
  jabatan: string;
  pangkat_golongan: string;
  joined_date: string | null;
  address: string | null;
  photo_url: string | null;
  role: 'user' | 'admin_unit' | 'admin_pusat';
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
  hasRole: (role: 'user' | 'admin_unit' | 'admin_pusat') => boolean;
  isAdminPusat: () => boolean;
  isAdminUnit: () => boolean;
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

      // Then create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          nip: data.nip,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          unit_id: data.unit_id,
          jabatan: data.position,
          pangkat_golongan: data.rank,
          joined_date: data.join_date || null,
          address: data.address || null,
          role: 'user',
          status: 'pending_approval'
        });

      if (profileError) {
        // If profile creation fails, delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { error: profileError };
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

  const hasRole = (role: 'user' | 'admin_unit' | 'admin_pusat'): boolean => {
    return profile?.role === role;
  };

  const isAdminPusat = (): boolean => hasRole('admin_pusat');
  const isAdminUnit = (): boolean => hasRole('admin_unit');

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