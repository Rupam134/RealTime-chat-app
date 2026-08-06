import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useProfile(email) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    supabase.from("users").select("*").eq("email", email).single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [email]);

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("email", email)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
  };

  return { profile, loading, updateProfile };
}