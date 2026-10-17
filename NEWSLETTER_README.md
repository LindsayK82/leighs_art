# Newsletter Studio — staged implementation

The **Newsletter Studio** dashboard card has been integrated into `artist-dashboard.html`, `artist-dashboard.js`, and `artist-dashboard.css` and implemented in `artist-newsletter.js`.

## Available now after SQL setup
1. In Supabase SQL Editor, run `NEWSLETTER_SETUP.sql` on Leigh’s existing project. Review the table and storage policies first.
2. Deploy the website files. Sign in as a listed `site_admins` user.
3. Open **Newsletter Studio**. Create a subject and letter, choose artwork from existing `artworks`, optionally upload a standalone image and a PDF, preview, then **Save draft**.
4. Reopen and edit or delete drafts. Drafts are kept in Supabase and are not sent.

Image/PDF uploads are stored as **public URL assets**. Upload only files meant to be publicly accessible, and do not use attachments for subscriber information, invoices, or other sensitive content. Deleting a draft does not automatically delete already uploaded assets.

## Sending is NOT wired up yet
The test-send and subscriber-send buttons are deliberately disabled. A secure server-side email service (e.g. Resend or Brevo) must be configured; do **not** put private API keys in JavaScript. Before sending, implement confirmed opt-in, unsubscribe tokens and links, bounce handling, rate limits, an authenticated admin-only send function, send logs and duplicate-send prevention. The `newsletter_subscribers` table is a **private placeholder**, not a ready-to-use signup flow.

A public signup form is not included in this stage because collecting addresses before the consent and confirmation flow is finished would create unnecessary risk.

## Notes
- Existing dashboard header still calls itself a preview and its orders remain fictional. The newsletter drafts are real Supabase data **after setup**.
- A direct image upload takes precedence over a chosen gallery painting in the email preview. Selecting a different gallery painting does not remove an uploaded image unless a new draft is started.
- The preview is a browser rendition, not a guaranteed rendering in Gmail, Outlook, or other email apps. A production sender should generate table-based responsive HTML with plain-text fallback and safe link handling.
