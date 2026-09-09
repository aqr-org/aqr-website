'use client';

import { useEffect, useState } from 'react';

export default function PhoneticSpelling({ word }: { word: string }) {
  const [phonetic, setPhonetic] = useState<string | null>(null);

  useEffect(() => {
    if (!word) return;
    let cancelled = false;
    fetch(`/api/phonetic?word=${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setPhonetic(data.phonetic ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [word]);

  if (!phonetic) return null;
  return <>{phonetic}</>;
}
