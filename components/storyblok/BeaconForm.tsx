'use client';

import { storyblokEditable } from '@storyblok/react/rsc';
import { useEffect, useState } from 'react';

interface BeaconFormProps {
  blok: {
    beacon_form_code?: string;
  };
}

export default function BeaconForm({ blok }: BeaconFormProps) {
  const [dataAccount, setDataAccount] = useState<string | null>(null);
  const [dataForm, setDataForm] = useState<string | null>(null);

  useEffect(() => {
    if (!blok.beacon_form_code) return;

    // Parse the HTML string to extract data-account and data-form
    const parser = new DOMParser();
    const doc = parser.parseFromString(blok.beacon_form_code, 'text/html');
    const formDiv = doc.querySelector('.beacon-form');
    
    if (formDiv) {
      const account = formDiv.getAttribute('data-account');
      const form = formDiv.getAttribute('data-form');
      
      if (account && form) {
        setDataAccount(account);
        setDataForm(form);
      }
    }
  }, [blok.beacon_form_code]);

  useEffect(() => {
    // Load BeaconCRM SDK script
    if (!document.getElementById('beacon-js-sdk')) {
      const script = document.createElement('script');
      script.id = 'beacon-js-sdk';
      script.src = 'https://static.beaconproducts.co.uk/js-sdk/production/beaconcrm.min.js';
      document.head.appendChild(script);
    }
  }, []);

  if (!dataAccount || !dataForm) {
    return null;
  }

  return (
    <div {...storyblokEditable(blok)} className="w-full">
      <div 
        className="beacon-form" 
        data-account={dataAccount}
        data-form={dataForm}
      />
    </div>
  );
}

