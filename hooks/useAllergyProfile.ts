"use client";

import { useState, useEffect } from "react";
import { AllergyProfile, loadAllergyProfile, saveAllergyProfile } from "@/lib/storage";

export function useAllergyProfile() {
  const [profile, setProfile] = useState<AllergyProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfile(loadAllergyProfile());
    setLoaded(true);
  }, []);

  function update(p: AllergyProfile) {
    saveAllergyProfile(p);
    setProfile(p);
  }

  return { profile, loaded, update };
}
