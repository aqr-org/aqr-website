# BeaconCRM ↔ Supabase company create/edit flow

This document explains how the codebase links BeaconCRM data to Supabase when users create or edit company records.

## 1) Entry point: user logs in and Beacon data is fetched

1. The protected page loads (`app/protected/page.tsx`) and gets the authenticated email from Supabase Auth.
2. It calls `beaconDataOf(email)` from `lib/utils.ts`.
3. `beaconDataOf` queries BeaconCRM directly (not through internal API routes) to build `UserBeaconData`:
   - Memberships where person is `member`
   - Memberships where person is `additional_members`
   - Fallback: orgs where person is `primary_contact`
4. It collects:
   - `allMemberships` (membership type labels)
   - `hasCurrentMembership`
   - `organizations[]` (Beacon org IDs + names)

## 2) Mapping Beacon organizations to Supabase companies

1. Still in `app/protected/page.tsx`, all Beacon organization names are extracted.
2. Supabase `companies` are fetched by matching `companies.name IN (Beacon org names)`.
3. For each Beacon org, the UI builds a row:
   - If company exists in Supabase: include `data`, `company_areas`, `company_contact_info`, logo URL.
   - If not: include `data: null` so create flow can be shown.
4. This means **name matching is the primary join** for user-facing company editing in this page.

## 3) Create vs edit decision in UI

In `components/member-settings/protected-tabs.tsx`:

1. If user has Business Directory membership, show “Edit your organisation info”.
2. For selected org:
   - If no Supabase row exists (`data === null`): render `CompanyCreateForm`.
   - If row exists: render `CompanyUpdateForm`.

## 4) Company creation flow (important Beacon/Supabase linkage)

`CompanyCreateForm` (`components/member-settings/CompanyCreateForm.tsx`) pre-fills company name from the selected Beacon organization, then delegates persistence to `CompanyInfoUpdateForm`.

In `CompanyInfoUpdateForm` create mode (`components/member-settings/CompanyInfoUpdateForm.tsx`):

1. Form submits to Supabase `companies.insert(...)`.
2. On create, it sets Beacon-related columns as:
   - `beacon_membership_id: null`
   - `beacon_membership_status: 'Active'` if `beaconData.hasCurrentMembership` is true, else `null`
   - `beacon_id`: Beacon organization ID (preferred from `beaconData.organizations[0].id`)
3. If org ID is missing, fallback API call:
   - `GET /api/beacon/extract-organization-id?membershipId=...`
   - Route fetches Beacon membership and extracts org entity reference (`entity_type_id === 268431`).
4. After company row is created, the UI can then save:
   - `company_areas` via `CompanyAreaUpdateForm`
   - `company_contact_info` via `CompanyContactUpdateForm`
   (both require created `companyId`)

## 5) Company edit flow (member area)

`CompanyUpdateForm` composes:
- `CompanyInfoUpdateForm` (update mode)
- `CompanyAreaUpdateForm`
- `CompanyContactUpdateForm`

### What is updated in edit mode

- Core profile fields in `companies` (name only editable by superadmin).
- Areas are replaced wholesale (`delete` existing by `company_id`, then `insert` selected).
- Contact info is upsert-like by branch:
  - update existing row if `contactData.id`
  - else insert new row

### Beacon influence during edit

- Membership tier (`Basic/Standard/Enhanced`) derived from `userBeaconData.allMemberships`.
- Area limit enforced from tier in `CompanyAreaUpdateForm`:
  - Basic: 6
  - Standard: 12
  - Enhanced: unlimited
- Regular users cannot change company name.

## 6) Superadmin edit flow and Beacon lookup

`components/superadmin/EditCompanyTab.tsx`:

1. Loads any company from Supabase.
2. Calls `POST /api/beacon/company-membership` with:
   - `companyName`
   - optional `beaconMembershipId`
3. API fetches Beacon memberships and tries to determine Business Directory type.
4. Result is converted to minimal `UserBeaconData`-like object for display + area-limit logic in forms.

## 7) Ongoing status sync Beacon → Supabase

Scheduled Netlify function: `netlify/functions/sync-beacon-status.ts`.

1. Daily job fetches recently changed Beacon memberships (last 7 days).
2. Splits memberships:
   - Business Directory → company updates
   - Individual/Group → member updates
3. Company matching priority:
   - `companies.beacon_membership_id` first
   - fallback to `companies.beacon_id` (Beacon organization ID)
4. Updates `companies.beacon_membership_status` when changed.

## 8) Data model relationship summary

Current practical relationship between BeaconCRM and Supabase companies is:

1. **Identity key for org-level matching:** `companies.beacon_id` (Beacon org ID).
2. **Status mirror:** `companies.beacon_membership_status`.
3. **Legacy/optional membership key:** `companies.beacon_membership_id` (used by sync when present, but create flow currently writes `null`).
4. **UI-level linking during member session:** by Beacon org name to Supabase `companies.name`.

## 9) Notable implementation behavior / caveats

1. New company creation currently does **not** persist `beacon_membership_id` (explicitly set `null`), so long-term sync relies heavily on `beacon_id`.
2. Protected page matching uses **organization name equality** for existing row discovery; naming drift can cause “not created yet” behavior even if same org exists under a different name.
3. Beacon membership context is used for permissions/limits in UI, while Supabase remains source of truth for saved profile/contact/areas data.