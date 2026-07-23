# Angela MRX appointment and document follow-up

## Live GHL assets

- Location: `jjYm9OmYrCzClPff91X7`
- Calendar: `mEqrbWIelaS7o5TMsqUX`
- Appointment owner: Jamison Mcilvain (`WOXgxf7qKDUK8Tk4HFA6`)
- Appointment owner and email sender: `underwriter@mineralrightsxchange.com`
- Calendar connection: the appointment owner's linked Google Calendar for `underwriter@mineralrightsxchange.com`
- Workflow: `2. Appointment Confirmation + Reminders` (`d27071a3-a0a7-4ba1-9d08-4e55de2ed345`)
- Angela knowledge base: `cKjEocFWw4HoUJzXHIUN`
- Email templates:
  - Appointment prep and document checklist: `6a57e46f65d4eb583246ccf9`
  - 24-hour appointment reminder: `6a57e47184eead6f8f13b1ea`
  - Document follow-up: `6a57e47096e6652f1a3ec2cd`

The website enrolls each new appointment into the workflow with `eventStartTime`, so all waits can be relative to the booked time. A secure document that reaches `mrx_document_status=ready` removes the contact from the workflow and marks the follow-up complete.

## Workflow configuration

Configure the existing appointment workflow with this order. Use GoHighLevel Voice AI only. Keep the AI voice branch disabled until counsel approval, phone verification, and revocation tests are complete:

1. Assign the contact to Jamison Mcilvain.
2. Add tags `mrx-appt-booked` and `mrx-angela-followup`.
3. Set `MRX Follow-Up Status` to `appointment_booked`.
4. If `MRX Email Permission` is `true`, send the appointment-prep email template.
5. If `MRX SMS Permission` is `true`, send the appointment-prep SMS below.
6. Wait until 24 hours before the event start time.
7. If `MRX Email Permission` is `true`, send the 24-hour email template.
8. Reserved GHL Voice AI branch: only after approval, require current `MRX AI Voice Permission=true`, a verified designated phone, no DND or revocation, and a still-confirmed appointment before one disclosed Angela AI call.
9. Wait until 2 hours before the event start time.
10. If `MRX SMS Permission` is `true` and the appointment is still confirmed, send the 2-hour SMS below.
11. Wait until one day after the event. If `MRX Document Status` is `ready` or `MRX Follow-Up Status` is `documents_received`, end the workflow.
12. Otherwise set status to `documents_requested`, add `mrx-documents-requested`, and send the document follow-up email/SMS only through permitted channels.
13. Recheck the document status after 3 days and 7 days before sending another reminder. At day 10, create a task for Jamison and end the automated sequence.

Every branch must stop for DND, opt-out, cancellation, `followup_complete`, or `documents_received`. Do not use marketing content in this workflow.

## SMS copy

### Appointment prep

Hi {{contact.first_name}}, I’m Angela, MRX’s AI scheduling guide. Your phone appointment with Jamison is {{appointment.start_time}}. If available, have any recent royalty statement/check stub, division order, mineral deed or lease, written offer, and applicable probate/trust records nearby. Do not text sensitive documents. Private account: https://mineralrightsxchange.com/account/ Reply READY when prepared, HELP for assistance, or STOP to opt out.

### 24-hour reminder

Hi {{contact.first_name}}, Angela here, MRX’s AI scheduling guide. Reminder: Jamison will call you tomorrow at {{appointment.start_time}}. Please have relevant mineral or royalty documents nearby. Reschedule: {{appointment.reschedule_link}} Reply STOP to opt out.

### 2-hour reminder

Hi {{contact.first_name}}, your MRX phone appointment with Jamison is in about 2 hours at {{appointment.start_time}}. Please keep your phone available and any relevant documents nearby. Angela, MRX AI scheduling guide. Reply STOP to opt out.

### Missing documents

Hi {{contact.first_name}}, Angela here, MRX’s AI next-steps guide. Jamison may still need documents for your review. Open your private MRX account for secure-upload availability: https://mineralrightsxchange.com/account/ Do not text sensitive files. Reply DOCS if you need help identifying what to gather, DONE if already provided, or STOP to opt out.

### No-show

Hi {{contact.first_name}}, we missed you for your MRX phone appointment. I can help you reschedule with Jamison: {{appointment.reschedule_link}}. Angela, MRX AI scheduling guide. Reply HELP for assistance or STOP to opt out.

## Angela Voice AI setup

Create or select the Angela outbound agent, attach the `Angela MRX Appointment & Document Follow-Up` knowledge base, and use the existing MRX phone number. The prompt must:

- disclose that Angela is an AI scheduling guide with Mineral Rights Xchange;
- say the call concerns the requested appointment with Jamison;
- confirm the appointment time and timezone from GHL rather than guessing;
- ask which relevant documents the owner already has and record only a safe checklist in `MRX Documents Needed`;
- direct private files to the MRX owner account and warn owners not to include SSNs, bank or routing numbers, signatures, or unrelated sensitive identifiers because the scanned OCR is copied into the restricted GHL conversation;
- offer rescheduling or escalation to Jamison;
- avoid valuation, title, legal, and tax conclusions; and
- immediately honor do-not-call, wrong-number, and opt-out requests.

Outbound Voice AI must remain disabled until legal approval. After approval, it must remain behind current `MRX AI Voice Permission=true`, verified-phone, purpose, and revocation checks.

## Required UI-only activation

1. Connect an outbound email service for the MRX location.
2. Enable Voice AI outbound calling and complete HighLevel KYC/terms if required.
3. Create/select the Angela Voice AI agent, attach the knowledge base, and select the MRX phone number.
4. Paste the SMS actions above into the workflow (the current private token lacks template-write scope).
5. Publish the workflow and run an internal test contact through every consent branch before allowing live enrollment.
