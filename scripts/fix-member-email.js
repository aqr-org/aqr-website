#!/usr/bin/env node

/**
 * Repairs a member whose email address was changed in BeaconCRM.
 *
 * Supabase Auth keeps the login credential, so an email change in Beacon is not
 * visible to the login flow until auth.users.email is updated as well. This
 * script reconciles both sides, tolerating the two states a half-finished change
 * can leave behind:
 *
 *   a) the auth user is still on the old address -> it gets renamed
 *   b) the auth user is already on the new address -> only members.email lags
 *
 * Dry run by default. Nothing is written without --apply.
 *
 * Usage:
 *   node scripts/fix-member-email.js --old=old@example.com --new=new@example.com
 *   node scripts/fix-member-email.js --old=old@example.com --new=new@example.com --apply
 *
 * Requires in .env.local (or the environment):
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SECRET_KEY,
 *   BEACON_API_URL, BEACON_AUTH_TOKEN
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envFile = fs.readFileSync(envLocalPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

const MEMBER_COLUMNS = 'id, email, beacon_id, firstname, lastname, beacon_membership, beacon_membership_status';

// Mirrors BUSINESS_DIRECTORY_TYPES in netlify/functions/sync-beacon-status.ts.
// Business Directory memberships update companies, never members.
const BUSINESS_DIRECTORY_TYPES = [
  'Business Directory',
  'Business Directory Basic',
  'Business Directory Standard',
  'Business Directory Enhanced',
];

function parseArgs() {
  const args = { apply: false, refreshStatus: false };
  process.argv.slice(2).forEach(arg => {
    if (arg === '--apply') {
      args.apply = true;
      return;
    }
    if (arg === '--refresh-status') {
      args.refreshStatus = true;
      return;
    }
    const match = arg.match(/^--([a-z]+)=(.*)$/);
    if (match) {
      args[match[1]] = match[2].trim();
    }
  });
  return args;
}

function fail(message) {
  console.error(`\nABORTED: ${message}\n`);
  process.exit(1);
}

function normalize(email) {
  return String(email || '').trim().toLowerCase();
}

function createClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!supabaseUrl) {
    fail('Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseKey) {
    fail('Missing SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Mirrors fetchBeaconPersonByEmail in lib/utils.ts.
 * Returns the person entity, or null when the address is unknown to Beacon.
 */
async function findBeaconPersonByEmail(email) {
  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL || process.env.NEXT_PUBLIC_BEACON_API_URL;

  if (!beaconAuthToken || !beaconApiUrl) {
    fail('Missing BEACON_AUTH_TOKEN or BEACON_API_URL');
  }

  const response = await fetch(`${beaconApiUrl}/entities/person/filter`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${beaconAuthToken}`,
      'Beacon-Application': 'developer_api',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter_conditions: [{ field: 'emails.email', operator: '==', value: email }],
    }),
  });

  if (!response.ok) {
    fail(`Beacon person filter failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const results = json?.results ?? [];
  const match = results.find(r =>
    (r?.entity?.emails ?? []).some(e => normalize(e.email) === email)
  );

  return match?.entity ?? null;
}

function personIdsOf(person) {
  return (Array.isArray(person.id) ? person.id : [person.id]).map(String);
}

/**
 * Memberships that reference this person, mirroring the `member contains <id>`
 * filter used in lib/utils.ts and netlify/functions/sync-beacon-status.ts.
 */
async function fetchBeaconMembershipsForPerson(personId) {
  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL || process.env.NEXT_PUBLIC_BEACON_API_URL;

  if (!beaconAuthToken || !beaconApiUrl) {
    fail('Missing BEACON_AUTH_TOKEN or BEACON_API_URL');
  }

  const response = await fetch(`${beaconApiUrl}/entities/membership/filter`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${beaconAuthToken}`,
      'Beacon-Application': 'developer_api',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter_conditions: [{ field: 'member', operator: 'contains', value: Number(personId) }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    fail(`Beacon membership filter failed: ${response.status} ${response.statusText} ${body.slice(0, 400)}`);
  }

  const json = await response.json();
  return (json?.results ?? []).map(r => ({
    id: String(r?.entity?.id ?? ''),
    status: r?.entity?.status ?? [],
    type: r?.entity?.type ?? [],
    updated_at: r?.entity?.updated_at || r?.entity?.updatedAt || '',
  }));
}

async function findAuthUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      fail(`Failed to list auth users: ${error.message}`);
    }

    const users = data?.users ?? [];
    const match = users.find(u => normalize(u.email) === email);
    if (match) {
      return match;
    }
    if (users.length < perPage) {
      return null;
    }
    page += 1;
  }
}

async function findMemberRow(supabase, personIds, email) {
  for (const personId of personIds) {
    const { data, error } = await supabase
      .from('members')
      .select(MEMBER_COLUMNS)
      .eq('beacon_id', personId)
      .maybeSingle();
    if (error) {
      console.log(`  (beacon_id lookup failed for ${personId}: ${error.message})`);
      continue;
    }
    if (data) {
      console.log(`members row matched by beacon_id ${personId}: ${data.id}`);
      return data;
    }
  }

  const { data, error } = await supabase
    .from('members')
    .select(MEMBER_COLUMNS)
    .eq('email', email)
    .maybeSingle();
  if (error) {
    fail(`Failed to query members by email: ${error.message}`);
  }
  if (data) {
    console.log(`members row matched by email ${email}: ${data.id}`);
  }
  return data || null;
}

async function main() {
  const args = parseArgs();
  const oldEmail = normalize(args.old);
  const newEmail = normalize(args.new);

  if (!oldEmail || !newEmail) {
    fail('Usage: node scripts/fix-member-email.js --old=old@example.com --new=new@example.com [--apply]');
  }
  if (oldEmail === newEmail) {
    fail('--old and --new are identical; nothing to do.');
  }

  const supabase = createClient();

  console.log(`\nold: ${oldEmail}`);
  console.log(`new: ${newEmail}`);
  console.log(`mode: ${args.apply ? 'APPLY' : 'dry run'}\n`);

  // 1) Beacon: the new address must belong to a person.
  const newPerson = await findBeaconPersonByEmail(newEmail);
  if (!newPerson) {
    fail(`Beacon has no person with email ${newEmail}. Update Beacon first, then re-run.`);
  }
  const newPersonIds = personIdsOf(newPerson);
  console.log(`Beacon person for new address: ${newPersonIds.join(', ')}`);

  // 2) Beacon: the old address should no longer resolve.
  const oldPerson = await findBeaconPersonByEmail(oldEmail);
  if (oldPerson) {
    console.log(`WARNING: ${oldEmail} still resolves in Beacon to person ${personIdsOf(oldPerson).join(', ')}`);
    fail('Beacon still holds the old address. Remove it from the person first so both systems agree on one owner.');
  }
  console.log('Beacon no longer resolves the old address (expected).');

  // 3) Supabase Auth. Either the user still sits on the old address, or a
  //    previous attempt already moved it and only the profile row lags.
  const oldAuthUser = await findAuthUserByEmail(supabase, oldEmail);
  const newAuthUser = await findAuthUserByEmail(supabase, newEmail);

  if (oldAuthUser && newAuthUser && oldAuthUser.id !== newAuthUser.id) {
    fail(`Two different auth users exist: ${oldAuthUser.id} (${oldEmail}) and ${newAuthUser.id} (${newEmail}). Resolve by hand.`);
  }

  const authUser = oldAuthUser || newAuthUser;
  if (!authUser) {
    fail(`No Supabase Auth user found for ${oldEmail} or ${newEmail}.`);
  }

  const authNeedsRename = Boolean(oldAuthUser);
  console.log(`\nSupabase auth user: ${authUser.id}`);
  console.log(`  email: ${authUser.email}`);
  console.log(`  confirmed: ${authUser.email_confirmed_at || 'null'}`);
  console.log(`  last sign-in: ${authUser.last_sign_in_at || 'never'}`);
  if (authNeedsRename) {
    console.log(`  action: rename ${oldEmail} -> ${newEmail}`);
  } else {
    console.log('  action: none, already on the new address');
  }

  // 4) members row: the profile join key and the nightly sync match key.
  const memberRow = await findMemberRow(supabase, newPersonIds, newEmail);
  let memberNeedsEmailUpdate = false;
  let memberNeedsBeaconId = false;

  if (!memberRow) {
    console.log('\nNo members row found for this person. Only the auth email is involved.');
  } else {
    console.log(`\nmembers row: ${memberRow.id}`);
    console.log(`  email: ${memberRow.email}`);
    console.log(`  beacon_id: ${memberRow.beacon_id || 'null'}`);
    console.log(`  name: ${memberRow.firstname} ${memberRow.lastname}`);
    console.log(`  beacon_membership_status: ${memberRow.beacon_membership_status || 'null'}`);
    memberNeedsEmailUpdate = normalize(memberRow.email) !== newEmail;
    memberNeedsBeaconId = !memberRow.beacon_id && newPersonIds.length > 0;
  }

  // 5) Optional: recompute beacon_membership_status from Beacon, using the same
  //    rules as the nightly job (skip Business Directory memberships, most
  //    recently updated membership wins, status[0] is the value).
  let statusChange = null;
  if (args.refreshStatus && memberRow) {
    const memberships = await fetchBeaconMembershipsForPerson(newPersonIds[0]);
    const eligible = memberships.filter(m => !m.type.some(t => BUSINESS_DIRECTORY_TYPES.includes(t)));

    console.log('\nBeacon memberships referencing this person:');
    if (memberships.length === 0) {
      console.log('  none');
    }
    memberships.forEach(m => {
      const excluded = m.type.some(t => BUSINESS_DIRECTORY_TYPES.includes(t));
      console.log(`  ${m.id} | status: ${m.status.join(', ') || 'none'} | type: ${m.type.join(', ') || 'none'}${excluded ? '  (Business Directory, ignored for members)' : ''}`);
    });

    if (eligible.length === 0) {
      console.log('  -> no Individual/Group membership to derive a member status from; left untouched.');
    } else {
      const mostRecent = eligible.reduce((latest, cur) =>
        new Date(cur.updated_at) > new Date(latest.updated_at) ? cur : latest
      );
      const newStatus = mostRecent.status[0] || null;
      const currentStatus = memberRow.beacon_membership_status || null;

      console.log(`  -> derived from ${mostRecent.id} (updated ${mostRecent.updated_at || 'unknown'}): ${newStatus || 'null'}`);
      console.log(`  -> stored in Supabase: ${currentStatus || 'null'}`);

      if (newStatus !== currentStatus) {
        statusChange = { newStatus, membershipId: mostRecent.id, currentStatus };
      } else {
        console.log('  -> already matches; no status write needed.');
      }
    }
  }

  if (!authNeedsRename && !memberNeedsEmailUpdate && !memberNeedsBeaconId && !statusChange) {
    console.log('\nAlready consistent: auth email, members.email and Beacon all agree. Nothing to change.\n');
    return;
  }

  if (!args.apply) {
    console.log('\nDry run complete. Planned changes:');
    if (authNeedsRename) {
      console.log(`  auth.users ${authUser.id}: ${oldEmail} -> ${newEmail} (confirmed)`);
    }
    if (memberNeedsEmailUpdate) {
      console.log(`  members ${memberRow.id}: ${memberRow.email} -> ${newEmail}`);
    }
    if (memberNeedsBeaconId) {
      console.log(`  members ${memberRow.id}: beacon_id null -> ${newPersonIds[0]}`);
    }
    if (statusChange) {
      console.log(`  members ${memberRow.id}: beacon_membership_status ${statusChange.currentStatus || 'null'} -> ${statusChange.newStatus || 'null'}`);
    }
    console.log('\nRe-run with --apply to perform them.\n');
    return;
  }

  // 5) Auth email first, so the login works even if step 6 needs a retry.
  if (authNeedsRename) {
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      email: newEmail,
      email_confirm: true,
    });
    if (authUpdateError) {
      fail(`Failed to update auth user email: ${authUpdateError.message}`);
    }
    console.log(`\nUpdated auth user ${authUser.id} to ${newEmail}.`);
  } else {
    console.log('\nAuth user already on the new address; skipped.');
  }

  // 6) members.email, which is the profile join key and the sync match key.
  if (memberNeedsEmailUpdate || memberNeedsBeaconId) {
    const update = {};
    if (memberNeedsEmailUpdate) update.email = newEmail;
    if (memberNeedsBeaconId) update.beacon_id = newPersonIds[0];

    const { error: memberUpdateError } = await supabase
      .from('members')
      .update(update)
      .eq('id', memberRow.id);
    if (memberUpdateError) {
      fail(`members row update failed: ${memberUpdateError.message}`);
    }
    console.log(`Updated members ${memberRow.id}: ${JSON.stringify(update)}`);
  } else {
    console.log('members row already up to date; skipped.');
  }

  // 7) beacon_membership_status, the same column the nightly job writes.
  if (statusChange) {
    const { error: statusUpdateError } = await supabase
      .from('members')
      .update({ beacon_membership_status: statusChange.newStatus })
      .eq('id', memberRow.id);
    if (statusUpdateError) {
      fail(`members status update failed: ${statusUpdateError.message}`);
    }
    console.log(`Updated members ${memberRow.id} status: ${statusChange.currentStatus || 'null'} -> ${statusChange.newStatus || 'null'}`);
  }

  console.log('\nDone. The member logs in with the new address and their existing password.');
  console.log('Note: lib/utils.ts caches Beacon lookups for 10 minutes, so a first attempt may still fail briefly.\n');
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
