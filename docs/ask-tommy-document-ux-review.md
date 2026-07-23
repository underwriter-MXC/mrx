# Ask Tommy — Document-Read Summary, Queued Status & Location Card UI Review

Reference screenshot: `Screenshot 2026-07-22 at 11.50.49 PM.png` (Tommy chat, user asked "what basi[s]n are my rights in?" → Tommy said no document is attached yet).

Reviewed by: mrx_webdesign
Scope: `src/components/react/AskTommy.tsx`, `src/pages/api/chat/attachments/*`, `src/lib/platform/documents.ts`, `src/lib/platform/geography.ts`, `src/pages/api/chat/message.ts`, `src/pages/api/chat/session.ts`.

## What the screenshot tells us

The user is mid-conversation about a Texas mineral interest. Tommy offered to pull the legal description from a document image and explained that **no document is attached yet**. The visible controls are: text composer, "Upload a document" button (disabled if `documentProcessingEnabled` is false), and "Talk to a live underwriter". There is no document card, no queue pill, no progress spinner.

The three UI questions Daryl flagged:

1. Is the **document-read summary** visible in-chat as soon as extraction completes?
2. Is the **queued / processing status** honest while the worker is still running?
3. Is the **location/map card** rendered (or linked) only when location is precise enough?

## Current behavior (code-traced)

### 1. Upload → worker → in-chat summary
- `uploadFile()` (`AskTommy.tsx:1750`) signs an upload URL, posts to Supabase storage, calls `/api/chat/attachments/complete`, then sets a `notice` and calls `pollDocumentRead(signed.attachmentId, file.name)`.
- `pollDocumentRead()` (`AskTommy.tsx:445-474`) polls `/api/chat/attachments/{id}` every 2.5s (first 3 attempts) then every 5s, up to 24 attempts (~2.5 minutes total). On `ready`, it calls `refreshConversationSnapshot()` and sets a notice; on `rejected`/`failed` it sets an error notice; on timeout it sets a "still processing" notice.
- The worker callback (`/api/chat/attachments/worker-callback.ts:180-191`) writes the structured summary message directly into the conversation with `eventType: 'notice'` and metadata `{ kind: 'document_read_summary', documentType, pageCount, fields, piiCategories, confidence: 'candidate_owner_verification_needed', attachmentId, source: 'document_worker_callback' }`. This is **persisted, not streamed**.
- `refreshConversationSnapshot()` (`AskTommy.tsx:421-443`) re-fetches `/api/chat/session` and rebuilds `messages`. The session API returns messages **without the `metadata` column** in its current select (`session.ts:104`: `'id,role,content,persona,created_at'`) — so the summary's `kind` and `attachmentId` are dropped, and **only the plain content text reaches the React UI**. That is fine for the visible text, but means the UI cannot key the summary to its attachment, cannot show "Re-run" or "View source" affordances, and cannot filter/hide summaries from the visible bubble list without parsing the content string.

### 2. Queued / processing status
- After upload completes, only a `<p className="tommy-notice">` is set: `${file.name} was received and queued for its security scan. I'll add a document-read summary here as soon as extraction finishes.` (`AskTommy.tsx:1803`). It does **not** show a spinner, progress bar, retry, queue position, or ETA.
- `uploading` is a boolean — when true, the footer button shows `"Uploading…"` and the file input is disabled. Once the network leg finishes, the boolean flips back to false even though the worker is still scanning/extracting. There is no persistent "Tommy is still reading your document" indicator that survives a reload.
- Status states on the backend (`queued`, `dispatched`, `processing`, `ready`, `rejected`, `failed`) are not surfaced in the UI. Only the final `ready` and final error states produce a notice; `queued` looks identical to "still working" with no granular distinction.
- On reload (`refreshConversationSnapshot` initial path), no upload-progress state is hydrated. If the user closes the chat while the worker is running, then opens Ask Tommy again, **they see only the existing message history with no indication that an upload is in flight** (unless the worker already completed and persisted the summary message).
- The notice element is rendered at the **bottom of the message list** (`AskTommy.tsx:2106`), not anchored to the file attachment or its message bubble. So if the user scrolls up while processing, they cannot see whether their file is done.

### 3. Location/map card
- `LocationCard` is attached to an assistant message via `metadata.locationCards[0]` (`AskTommy.tsx:42`, `:434`, `:551`).
- The card is emitted by `/api/chat/message.ts:278-281` only when `shouldShowKnownLocationCard(question)` is true **AND** `documentLocationCardFromInterest(rememberedLocation)` returns a non-null card. The helper (`geography.ts:180-211`) returns `null` unless the stored interest has both `latitude` and `longitude` AND `location_precision ∈ {address, coordinates, section}`. So the card never fires on county-only data (no pin invented from "Martin County, Texas" alone — confirmed by `ask-tommy-document-grounding.spec.ts:79-101`).
- The card renders at `AskTommy.tsx:2026-2040` as an `<a className="tommy-location-card">` with `Open map for {label}` heading, `{precision} location · {basin?}` subtitle, and an optional `<em>` note.
- The link target is built in `geography.ts:209`: a Google Maps `q=lat,lng` URL. There is **no fallback link** when no precise location exists — Tommy simply omits the card, which is correct, but the message text does not always tell the user *why* no card appeared.

## UI acceptance constraints

Use these as the definition of done for the in-chat document UX.

### A. Visible document-read summary
- A1. When the worker callback lands with `status: 'ready'`, the structured summary must appear **inline as an assistant message in the chat**, not in a modal, not in a toast, not on a separate page. ✓ Already happens via `saveMessage()` in `worker-callback.ts:180`.
- A2. The summary must include, at minimum, and in this order: filename, document type, pages read, parties/payor, location, lease/well/property references, legal description clues, revenue figures, ownership/royalty decimals, and an explicit "What this does not establish" disclaimer. ✓ Driven by `buildDocumentReadSummary()` (`documents.ts:64-122`).
- A3. The summary bubble must render the "Tommy · MRX Offer and Value Guide" persona label and avatar, with a small "Document-read summary" eyebrow (new class `tommy-document-card`) so it is distinguishable from a regular reply.
- A4. The summary must use a different background tint or top border (e.g. `#eaf3ec` or a 3px `#3f8a5a` left bar) so users can scan past it on reload.
- A5. The summary message must persist across reload (already does via `messages` table), and the chat must not duplicate it on `pollDocumentRead` `ready` (guarded by `refreshConversationSnapshot()` simply refetching — but ensure no echo notice fires if the snapshot already shows the summary).
- A6. The summary must collapse under a `<details>` element if content exceeds ~6 lines, defaulting to expanded for the first 24h after upload, then collapsed.
- A7. If `pageCount === 0` or no fields were extracted, show "Tommy read the file but did not find a property description. Upload a clearer page showing the lease, legal description, or payor." instead of the "Location mentioned: not clearly found" boilerplate (current `documents.ts:102` boilerplate reads as "empty" to a layperson).
- A8. On `rejected` (malware / invalid / OCR failed), show a **red-tinted** card with the rejection reason and a single "Try another file" button that re-opens the file picker. Currently only a plain notice (`AskTommy.tsx:462-464`).

### B. Honest queued status
- B1. While `attachment.status` is `queued` or `dispatched` or `processing`, render a persistent in-chat status row attached to the uploaded file. Format:
  > 📄 `filename.pdf` · Tommy is reading it (security scan + extraction). This usually takes 30–90 seconds.
  New class: `tommy-document-status` with subtle pulse animation.
- B2. The status row must show **three discrete states**, each with a distinct icon/color:
  - "Queued for security scan" (neutral grey)
  - "Scanning for malware" (amber)
  - "Reading and redacting" (blue, with `pages: n` incrementing if available)
- B3. The status row must be **anchored to the conversation**, not floating at the bottom. When the user scrolls up while it is still pending, they must still see it (sticky to the top of the message list with `position: sticky; top: 0` inside `.tommy-messages`).
- B4. The footer "Upload a document" button must show a small badge (e.g. "1 file in progress") when any attachment is `queued | dispatched | processing`, and must be disabled while one is queued (no double-upload of the same legal description by accident).
- B5. If the chat is closed and reopened mid-processing, the in-chat status row must re-appear by hydrating from the latest `attachments` row returned by `/api/chat/session` (`session.ts:87-94`). Currently this hydration does not happen — only persisted *messages* re-appear, so an in-flight upload is invisible after a reload. Required: surface attachment status in the initial chat bootstrap and render the corresponding row.
- B6. The poll loop must stop as soon as the status row is dismissed by the user (close button on the row), and must not re-fire if the user keeps the chat open.
- B7. After `ready`, the status row transforms into the summary card (B → A) rather than disappearing.
- B8. After 90 seconds of `processing` without `ready`, the row escalates to "Taking longer than usual — you can keep chatting and Tommy will use it once it lands." Do not show a timeout error before 5 minutes.
- B9. The wording must never claim Tommy "has read" the document before the summary message is actually persisted. Current `${file.name} was received and queued for its security scan` (line 1803) is acceptable; current `${file.name} has been read. Review the summary I added above` (line 457) is acceptable **only** when the snapshot already contains a `document_read_summary` message — add an explicit guard so the notice does not fire on a stale `ready` race.

### C. Location/map card
- C1. Render the location card only when `location_precision ∈ {address, coordinates, section}` AND both `latitude` and `longitude` are finite numbers. Never invent a pin from county or state alone. ✓ Already enforced by `documentLocationCardFromInterest()` (`geography.ts:180-211`).
- C2. Label format: `<City>, <County> County, <State>` with the missing components gracefully omitted (current behavior; keep).
- C3. Subtitle format: `<precision> location · <basin name>` where basin is included **only** when `basin_status === 'resolved'`. Never display a basin name with `basin_status === 'candidate` or `needs_confirmation`.
- C4. The `<em>` note is required when `precision === 'section'` (PLSS centerpoint caveat) and recommended when `precision === 'address'` ("Verify the pin matches the legal description, not just the mailing address").
- C5. The card must open the Google Maps URL in a new tab (`target="_blank" rel="noreferrer"` — already correct at `AskTommy.tsx:2030-2031`) and must have `aria-label="Open map for {label} in a new tab"`.
- C6. When location is **not** precise enough for a card but the user asked "where / which basin", the assistant message must explicitly say "Tommy has your county/state but not yet the legal description or coordinates, so no map pin is shown." This prevents the silent omission from being read as "Tommy didn't bother".
- C7. After a document-read summary is rendered (section A), if the new extraction yields lat/lng (e.g. legal description geocoded), automatically emit a **second** assistant message with the new location card, labeled "Map updated from your document".
- C8. If the session's remembered interest changes (e.g. the user adds a second mineral interest), the card must reflect the most recently resolved interest, not a stale one. Add a `mineralInterestId` check before rendering.
- C9. The card's background (`#f4f8fa`) and border (`#b9c9d3`) must pass WCAG AA contrast against `#173e58` text — verified at `AskTommy.css:201-223`; keep current values.
- C10. On mobile (<520px panel width), the card must wrap to full bubble width and remain tappable (44×44px minimum tap target on the link).

## Cross-cutting constraints

- X1. The "Upload a document" button is disabled when `documentProcessingEnabled === false`. When disabled, its tooltip must read "Secure document processing is temporarily unavailable. Sign in to your MRX account to retry." (current text is shorter — keep current wording for now but ensure the disabled state is visually distinct, e.g. dashed border).
- X2. The `tommy-notice` element must remain for legacy one-off notices (account prompt, save errors) but the new `tommy-document-status` and `tommy-document-card` elements must NOT use the `tommy-notice` class to avoid the same styling flattening them.
- X3. Track GA4 events: `document_status_view` (with `status` ∈ `queued | scanning | reading | ready | rejected | failed`), `document_summary_view`, `document_location_card_view` (already exists at `AskTommy.tsx:845`), `document_summary_collapse`, `document_summary_expand`.
- X4. Accessibility: every new card / row must be keyboard-reachable, with `aria-live="polite"` on the status row so screen readers announce progress without spamming.
- X5. i18n: any new user-visible copy must be added to the i18n string table (search the existing `tommy-` copy in `src/i18n/` if present) so Spanish/French builds are not broken.

## Suggested implementation order

1. Backend already persists everything we need. Start with frontend hydration of attachment status in the initial session bootstrap (constraint B5).
2. Add `tommy-document-status` and `tommy-document-card` React components inside `AskTommy.tsx`, anchored to the attachmentId.
3. Wire `pollDocumentRead` to update the status row's label/icon based on returned `data.attachment.status` (constraint B2).
4. Persist attachment metadata on the summary message in `session.ts` (constraint A3 needs `kind` / `attachmentId` in the message select).
5. Add `tommy-document-card` styling in `AskTommy.css`.
6. Add GA4 events (constraint X3).
7. Add Playwright spec covering: upload → see queued → see scanning → see reading → see summary → click map link → reload → summary still visible → no duplicate.

## Acceptance test fixtures

- Use `tests/unit/ask-tommy-document-grounding.spec.ts` as the model for new tests.
- The Laguna Resources fixture at `/Users/darylhill/Downloads/Revenue Statement_LAGUNA RESOURCES_1174_2026-06.pdf` (referenced in `ask-tommy-document-grounding.spec.ts:18`) is the canonical happy-path document.
- Add a Playwright spec under `tests/e2e/ask-tommy-document-flow.spec.ts` to exercise the queued → ready transitions in the running UI.