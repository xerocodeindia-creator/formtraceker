# FormTraceker

Affiliate click and lead attribution MVP built with Next.js and Supabase.

## Included
- Single-admin dashboard protected by a server-side API key
- Create hosted lead forms
- Affiliate and sub-affiliate attribution (aff_id, sub_aff_id)
- Click redirect links with generated click_id
- Lead capture with UTM and Meta click identifiers
- Server-to-server conversion postback endpoint
- Supabase-backed data storage

## Setup
1. Create a Supabase project.
2. Run supabase/schema.sql in the Supabase SQL Editor.
3. Copy .env.example to .env.local and fill in the Supabase URL, service-role key, admin key, postback secret and app URL.
4. Run npm install.
5. Run npm run dev.

## Create a form
Open the dashboard, enter ADMIN_API_KEY in Admin access, then create a form. Set the destination URL to the thank-you page or next step after successful submission.

Public form URL:
https://YOUR-DOMAIN/form/your-slug?aff_id=AFF123&sub_aff_id=SUB01

Tracked affiliate URL:
https://YOUR-DOMAIN/go/your-slug?aff_id=AFF123&sub_aff_id=SUB01

The tracked URL records a click, creates a unique click_id, and redirects to the hosted form while preserving attribution parameters. The form submission stores the same click_id and affiliate identifiers with the lead.

## Conversion postback
Configure the affiliate network to call:
GET https://YOUR-DOMAIN/api/postback?key=YOUR_POSTBACK_SECRET&click_id={click_id}&status=converted&transaction_id={transaction_id}

The network must return the generated click_id for reliable conversion matching. The postback updates the matching captured lead.

## Security and limitations
- Keep SUPABASE_SERVICE_ROLE_KEY, ADMIN_API_KEY and POSTBACK_SECRET server-side only.
- This is an initial single-admin MVP, not yet a multi-tenant SaaS with user accounts, billing or team permissions.
- Admin access uses a shared API key; rotate it if exposed.
- Custom field editor, CSV export, detailed affiliate reports and Meta Pixel/CAPI are next-stage features.
- Obtain consent and comply with applicable privacy and marketing laws before collecting personal data.
