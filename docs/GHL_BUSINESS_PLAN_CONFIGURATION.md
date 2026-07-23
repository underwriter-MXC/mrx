# MRX GoHighLevel business-plan configuration

Last verified July 15, 2026.

## Selected architecture

- GoHighLevel Voice AI is the only AI voice platform. Thinkrr is not used.
- Supabase is authoritative for owner identity, consent, private files, facts, and the canonical transcript.
- GoHighLevel is the operating CRM for appointments, workflows, email, SMS, GHL Voice AI, pipelines, and the contact conversation.
- Original file binaries stay in private Supabase Storage.
- Website chat, email and SMS events, GHL Voice AI transcripts, and redacted document summaries/status are copied into the restricted GoHighLevel contact conversation.
- Redacted OCR is used for OpenAI fact extraction and approved CRM summaries. Raw OCR remains encrypted in Supabase storage and is not copied to GHL.

## Live configuration status

- The MRX location and appointment calendar are reachable.
- Sixty-four required MRX contact fields are present. Forty-nine were added on July 15, 2026, and fifteen existing fields were preserved.
- Ten DCF fields are present and empty. Website code does not write to them.
- Pipeline reads work.
- Pipeline creation is blocked because the current private token lacks the `pipelines.create` scope introduced for the v3 create-pipeline endpoint.
- The configured MRX appointment calendar is live and returned 90 openings in the seven-day connection check.
- The configured `2. Appointment Confirmation + Reminders` workflow exists but remains in draft status, so it must be reviewed and published in GHL before reminder delivery is treated as active.
- The `MRX - Free Guide Delivery - Angela` workflow contract is documented in `docs/ghl-free-guide-delivery-workflow.md`, but no live workflow ID is configured yet. Until `GHL_FREE_GUIDE_WORKFLOW_ID` is set, the website uses consent-gated GHL Conversations API delivery and does not claim that the workflow is live.
- No GHL Voice AI workflow exists in the seven workflows currently returned for the MRX location. Voice AI remains disabled as intended.

After reissuing the private token with `pipelines.create`, run:

```bash
pnpm configure:ghl:apply
```

The command is idempotent. It creates only missing pipelines, stages, and fields and preserves existing assets.

## Required pipelines

### Prospects

1. Record Added
2. DCF Scored
3. Append Attempted
4. Reachable
5. Outreach Initiated
6. Contacted
7. Not Qualified
8. Dead

Website chat contact creation maps to Contacted. List acquisition, append, outreach, and DCF stage changes remain external operations.

### Appointments

1. Appointment Booked
2. Appointment Confirmed
3. Appointment Completed
4. Offer Pending
5. Rescheduled
6. No Show
7. Not a Fit

Angela booking maps to Appointment Booked. Signed GHL appointment webhooks map later appointment states.

### Sellers

1. Offer Sent
2. Offer Viewed
3. Offer Signed
4. Due Diligence Active
5. Documents Complete
6. Title Review
7. Closing Scheduled
8. Closed - PLATFORM
9. Dead

The website does not manufacture a seller event. Staff or an approved downstream integration moves a contact to Sellers after a formal offer is issued.

## Required GHL webhook events

- InboundMessage
- OutboundMessage
- VoiceAiCallEnd
- AppointmentCreate
- AppointmentUpdate
- AppointmentDelete
- OpportunityStageUpdate

Point signed webhooks at `/api/webhooks/ghl`. The VoiceAiCallEnd subscription needs `voice-ai-dashboard.readonly`. Website and OCR conversation writes need `conversations/message.write`. Completed human calls are fetched from GHL by message ID, retained in Supabase, and inserted into the GHL conversation. The webhook retries briefly when a transcript is not ready; the daily maintenance task retains a durable retry record.

## GHL Voice AI release gate

Keep `GHL_AI_VOICE_ENABLED=false` until all of the following are complete:

- the GHL Voice AI workflow ID is configured;
- the designated phone number is verified;
- consent and revocation tests pass;
- DND and STOP behavior pass;
- the recording policy and state-specific disclosures are approved;
- the production legal release receipts are configured.

The GHL workflow reads `MRX AI Voice Update Text`, places the disclosed call, and returns its full transcript through VoiceAiCallEnd.
