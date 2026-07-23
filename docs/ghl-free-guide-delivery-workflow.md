# MRX free-guide delivery workflow

Workflow name: `MRX - Free Guide Delivery - Angela`

Trigger: API enrollment from `/api/free-guide` using `GHL_FREE_GUIDE_WORKFLOW_ID`.

Live status as of 2026-07-20: all 24 required contact fields and all five required tags are present in MRX's GHL location. The workflow is not yet created because the connected public/MCP APIs are read-only for workflow definitions and the configured GHL Command workflow-builder is blocked by its install/license limit. Do not set `GHL_FREE_GUIDE_WORKFLOW_ID` until the workflow exists and its sender, branch, and DND checks have been verified in GHL.

The website and workflow follow a single-owner contract:

- When `GHL_FREE_GUIDE_WORKFLOW_ID` is configured, the workflow owns email and SMS delivery. The website does not send duplicate messages.
- When no workflow ID is configured, the website uses the GHL Conversations API as a delivery fallback.
- An unchecked checkbox records a source-specific `false` receipt. It does not change global GHL DND or revoke an older consent from another interaction.
- Existing GHL DND, STOP, HELP, and revocation state always overrides a positive form receipt.
- No AI-generated, artificial, or prerecorded call is part of this guide-delivery workflow.

## Contact fields and tags

Always set by the website:

- `contact.mrx_requested_guide`
- `contact.mrx_requested_guide_title`
- `contact.mrx_requested_guide_url`
- `contact.mrx_guide_email_permission`
- `contact.mrx_free_guide_marketing_email_consent`
- `contact.mrx_free_guide_sms_consent`
- `contact.mrx_free_guide_call_consent`
- consent disclosure text/version, client/server timestamps, page/UTM context, and user-agent receipt fields
- tags `mrx-source-free-guide` and `mrx-guide-requested`

Only add these positive-consent tags when the matching checkbox is selected:

- `mrx-free-guide-marketing-email-consent`
- `mrx-free-guide-sms-consent`
- `mrx-free-guide-call-consent`

## Workflow actions

1. Re-check that `contact.mrx_guide_email_permission` equals `true`.
2. Send the requested email immediately.
   - Subject: `Your MRX guide: How to Find Out What Your Mineral Rights Are`
   - Body: identify Angela with Mineral Rights Xchange, link `{{contact.mrx_requested_guide_url}}`, and state that the guide is general educational information rather than legal, tax, title, or valuation advice.
3. Wait 2 minutes.
4. Branch on all of the following before SMS:
   - `contact.mrx_free_guide_sms_consent` equals `true`;
   - tag `mrx-free-guide-sms-consent` is present;
   - phone is present;
   - SMS DND is not enabled and no later STOP/revocation exists.
5. Send:

   `Hi {{contact.first_name}}, this is Angela with Mineral Rights Xchange. I just sent your guide, "How to Find Out What Your Mineral Rights Are." Were you able to open it? Here is the link again: {{contact.mrx_requested_guide_url}}. Reply STOP to opt out or HELP for help.`

   If first name is blank, use `Hi there` rather than leaving an empty greeting.

6. End the workflow. Do not add an AI Voice action.

Optional educational email nurture must be a separate workflow and require both `contact.mrx_free_guide_marketing_email_consent=true` and the matching positive-consent tag.

## Release verification

- Email-only submission: one email, no SMS, no call, no change to prior global DND/consent.
- SMS submission with no phone: website returns validation failure and does not enroll.
- SMS submission with phone: one email, one SMS after the wait, no call.
- Call checkbox: receipt is stored, but no call occurs because AI Voice remains behind the separate legal, phone-verification, DND, and revocation release gates.
- STOP/revocation test: no later workflow text or call is sent.
