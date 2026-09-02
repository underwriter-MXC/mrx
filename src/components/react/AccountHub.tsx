import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import { getGuideChatLabel } from '../../data/guides';
import {
  UNDERWRITING_DOCUMENT_TYPES,
  type UnderwritingDocumentType,
  type UnderwritingSituation,
} from '../../lib/platform/underwriting-packet';
import './AccountHub.css';

interface Props {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
type Conversation = {
  id: string;
  title?: string;
  summary?: string;
  updated_at: string;
  messages?: Array<{
    id: string;
    role: string;
    content: string;
    persona?: string;
    created_at: string;
  }>;
  appointments?: any[];
};
type Attachment = {
  id: string;
  mineral_interest_id?: string | null;
  original_name: string;
  document_type?: string | null;
  mime_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
};

function factText(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value || typeof value !== 'object') return 'Not provided';
  const record = value as Record<string, unknown>;
  const missing = Array.isArray(record.missingFields)
    ? record.missingFields
    : Array.isArray(record.items)
      ? record.items
      : [];
  if (missing.length) return `Still helpful if available: ${missing.join(', ')}`;
  if (typeof record.body === 'string' && record.body.trim()) return record.body;
  return (
    Object.entries(record)
      .filter(([, item]) => item != null && item !== '' && typeof item !== 'object')
      .slice(0, 6)
      .map(([key, item]) => `${key.replaceAll('_', ' ')}: ${String(item)}`)
      .join(' · ') || 'Saved on your profile'
  );
}
type OwnerFact = {
  id: string;
  field: string;
  value: unknown;
  status: 'candidate' | 'confirmed';
  confidence?: number;
  created_at: string;
};
type MineralInterest = {
  id: string;
  label?: string;
  city?: string;
  state?: string;
  state_code?: string;
  county?: string;
  county_fips?: string;
  basin_name?: string;
  oil_gas_province?: string;
  basin_status?: string;
  basin_needs_confirmation?: boolean;
  operator?: string;
  lease_name?: string;
  legal_description?: string;
  parcel_reference?: string;
  township_district?: string;
  lease_status?: string;
  producing_status?: string;
  recent_check_amount?: string;
  unknown_fields?: string[];
  raw_intake_answers?: Record<string, unknown>;
  inherited?: boolean;
  location_precision?: string;
  geography_status?: string;
  status: string;
  updated_at: string;
};
type RequestedPermissions = { email: boolean; sms: boolean; call: boolean; aiVoice: boolean };
type AccountProfile = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  primary_mineral_interest_id?: string | null;
  residence_city?: string | null;
  residence_state?: string | null;
  residence_state_code?: string | null;
  residence_county?: string | null;
  residence_county_fips?: string | null;
  residence_geography_status?: string | null;
};

type OwnerUnderwritingChecklist = {
  readinessStatus: 'collecting' | 'ready';
  summary: {
    total: number;
    complete: number;
    needsUpload: number;
    processing: number;
    needsStaffReview: number;
  };
  items: Array<{
    requirementKey: string;
    mineralInterestId: string | null;
    label: string;
    required: boolean;
    requirementLevel: 'required' | 'recommended';
    acceptedDocumentTypes: UnderwritingDocumentType[];
    status:
      | 'missing'
      | 'needed'
      | 'uploaded'
      | 'processing'
      | 'verified'
      | 'waived'
      | 'rejected'
      | 'not_applicable';
    ownerAction: 'complete' | 'wait' | 'upload' | 'reupload';
  }>;
};

const DOCUMENT_TYPE_LABELS: Record<UnderwritingDocumentType, string> = {
  mineral_deed: 'Mineral deed',
  royalty_statement: 'Royalty statement',
  royalty_check_stub: 'Royalty check stub',
  form_1099_misc: 'Form 1099-MISC (royalties in Box 2)',
  oil_gas_lease: 'Oil and gas lease',
  lease_amendment: 'Lease amendment',
  division_order: 'Division order',
  probate_order: 'Probate order',
  trust_document: 'Trust document',
  purchase_offer: 'Purchase offer or agreement',
  competing_offer: 'Competing offer',
  operator_correspondence: 'Operator correspondence',
  tax_statement: 'Tax statement',
  county_record: 'County record',
  other: 'Other supporting document',
};

function isUnderwritingDocumentType(value: string): value is UnderwritingDocumentType {
  return (UNDERWRITING_DOCUMENT_TYPES as readonly string[]).includes(value);
}

function selectedDocumentType(value: string): UnderwritingDocumentType {
  return isUnderwritingDocumentType(value) ? value : 'other';
}

function trackAccountEvent(event: string, detail: Record<string, unknown> = {}) {
  const push = (window as Window & { __mrxPush?: (payload: Record<string, unknown>) => void })
    .__mrxPush;
  if (typeof push === 'function') push({ event, ...detail });
}

function AccountExplainer() {
  return (
    <section className="account-explainer" aria-labelledby="account-explainer-title">
      <p className="account-kicker">Owner account</p>
      <h2 id="account-explainer-title">One secure MRX owner profile</h2>
      <p>
        Keep your paperwork, documents, conversations, and mineral-interest details together so you
        can return later without starting over.
      </p>
      <ul>
        <li>
          Retain Travis conversations, cited answers, appointment context, and uploaded
          mineral-rights documents.
        </li>
        <li>
          Keep multiple properties, counties, leases, operators, and remembered facts organized in
          one private profile.
        </li>
        <li>Share records when you are ready for a more exact underwriter review or assessment.</li>
      </ul>
      <small>
        Sharing documents can improve the review record, but it does not guarantee a value, quote,
        offer, or outcome.
      </small>
    </section>
  );
}

export default function AccountHub({ supabaseUrl, supabaseAnonKey }: Props) {
  const supabase = useMemo(
    () =>
      typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null,
    [supabaseUrl, supabaseAnonKey],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [deviceAccess, setDeviceAccess] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [facts, setFacts] = useState<OwnerFact[]>([]);
  const [interests, setInterests] = useState<MineralInterest[]>([]);
  const [activeInterestId, setActiveInterestId] = useState<string | null>(null);
  const [accountProfile, setAccountProfile] = useState<AccountProfile>({});
  const [requestedPermissions, setRequestedPermissions] = useState<RequestedPermissions>({
    email: false,
    sms: false,
    call: false,
    aiVoice: false,
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestingLink, setRequestingLink] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingInterest, setSavingInterest] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] =
    useState<UnderwritingDocumentType>('royalty_statement');
  const [uploadRequirementKey, setUploadRequirementKey] = useState<string | null>(null);
  const [documentUploadsEnabled, setDocumentUploadsEnabled] = useState(false);
  const [documentProcessingEnabled, setDocumentProcessingEnabled] = useState(false);
  const [underwritingChecklist, setUnderwritingChecklist] =
    useState<OwnerUnderwritingChecklist | null>(null);
  const [deletionToken, setDeletionToken] = useState<string | null>(null);
  const [deletionPending, setDeletionPending] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeStep, setIntakeStep] = useState(0);
  const [savedIntake, setSavedIntake] = useState<{ interestId: string; label: string } | null>(
    null,
  );
  const [intakeMissing, setIntakeMissing] = useState<string[]>([]);
  const [sendingChecklist, setSendingChecklist] = useState(false);
  const intakeFormRef = useRef<HTMLFormElement | null>(null);
  const intakeStartedTracked = useRef(false);
  const accountIntent =
    typeof window === 'undefined'
      ? ''
      : new URLSearchParams(window.location.search).get('welcome') ||
        new URLSearchParams(window.location.search).get('upload') ||
        (window.location.pathname.startsWith('/owner-intake') ? 'standalone' : '') ||
        '';
  const rawSituation =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('situation');
  const accountSituationCode = (() => {
    if (!rawSituation) return null;
    const aliases: Record<string, UnderwritingSituation> = {
      'estate-heir': 'inherited_or_probate',
      'confused-inheritor': 'inherited_or_probate',
      'multi-state-inheritor': 'inherited_or_probate',
      'suspicious-seller': 'offer_review',
      '1031-exchange': 'tax_sensitive_1031',
    };
    return aliases[rawSituation] ?? null;
  })();
  const accountIntentTitle =
    accountIntent === 'appointment'
      ? 'Your appointment is connected to your owner account'
      : accountIntent === 'elena'
        ? 'Elena can finish your owner intake now'
        : accountIntent === 'standalone'
          ? 'Start your guided owner intake'
          : accountIntent === '1'
            ? 'Sign in to upload your document'
            : accountIntent === 'conversation'
              ? 'Save this conversation across devices'
              : 'Create your private MRX account';
  const accountIntentDescription =
    accountIntent === 'appointment'
      ? 'Use the secure email link MRX sent after booking, or request a new one below. Your appointment, conversations, and documents will stay together in your private profile.'
      : accountIntent === 'elena'
        ? 'Continue on this device to save property details, unknown answers, and documents so Elena can hand the record to a Senior Underwriter. Your secure email link lets you return from another device.'
        : accountIntent === 'standalone'
          ? 'Create a secure owner profile first, then add as many mineral properties as you need. Every question accepts I do not know, and MRX will keep the missing-info checklist on your record.'
          : accountIntent === 'conversation'
            ? 'Enter your full name, email, and phone so MRX can connect this private history to one verified owner profile. MRX will send a passwordless sign-in link so this conversation, future questions, locations, and documents can stay together when you return.'
            : 'Enter your full name, email, and phone. You can continue on this device right away, and MRX will send a passwordless sign-in link for secure return access.';

  const hasOwnerAccess = Boolean(session || deviceAccess);

  useEffect(() => {
    if (
      hasOwnerAccess &&
      ['appointment', 'elena', 'standalone', 'conversation'].includes(accountIntent)
    ) {
      setIntakeOpen(true);
    }
  }, [accountIntent, hasOwnerAccess]);

  useEffect(() => {
    if (!hasOwnerAccess || !intakeOpen || intakeStartedTracked.current) return;
    intakeStartedTracked.current = true;
    trackAccountEvent('intake_started', { source: accountIntent || 'account' });
  }, [accountIntent, hasOwnerAccess, intakeOpen]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !authReady) return;
    let cancelled = false;
    (async () => {
      const headers = session ? { Authorization: `Bearer ${session.access_token}` } : undefined;
      if (session) await fetch('/api/account/claim', { method: 'POST', headers });
      const response = await fetch('/api/chat/session', { headers });
      const data = await response.json().catch(() => ({}));
      if (cancelled || !response.ok) {
        if (!cancelled) setLoading(false);
        return;
      }
      setDeviceAccess(Boolean(data.deviceAccess));
      setDocumentUploadsEnabled(Boolean(data.documentUploadsEnabled));
      setDocumentProcessingEnabled(Boolean(data.documentProcessingEnabled));
      setConversations((data.conversations as Conversation[]) ?? []);
      setAttachments((data.documents as Attachment[]) ?? []);
      setFacts((data.facts as OwnerFact[]) ?? []);
      setInterests((data.interests as MineralInterest[]) ?? []);
      setActiveInterestId(data.profile?.primary_mineral_interest_id ?? null);
      setAccountProfile(data.profile ?? {});
      const checklistResponse = await fetch('/api/account/underwriting-checklist', { headers });
      if (checklistResponse.ok) {
        const checklistResult = await checklistResponse.json();
        setUnderwritingChecklist(checklistResult.checklist ?? null);
        if (typeof checklistResult.processing?.available === 'boolean') {
          setDocumentProcessingEnabled(checklistResult.processing.available);
        }
      }
      setRequestedPermissions({
        email: Boolean(data.permissions?.email),
        sms: Boolean(data.permissions?.sms),
        call: Boolean(data.permissions?.call),
        aiVoice: Boolean(data.permissions?.aiVoice),
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, session, supabase]);

  function ownerHeaders(json = false) {
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
  }

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('fullName') || '').trim();
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    setRequestingLink(true);
    setStatus('');
    try {
      const response = await fetch('/api/chat/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'email',
          accountSignup: true,
          fullName,
          email,
          phone,
          sourceUrl: location.href,
          redirectTo: new URL(
            accountIntent === 'standalone' ? '/owner-intake/' : '/account/?welcome=elena',
            location.origin,
          ).toString(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.deviceAccess) {
        const nameParts = fullName.split(/\s+/).filter(Boolean);
        setDeviceAccess(true);
        setAccountProfile((current) => ({
          ...current,
          first_name: nameParts[0] || null,
          last_name: nameParts.slice(1).join(' ') || null,
          email,
          phone,
        }));
        setRequestedPermissions({
          email: false,
          sms: false,
          call: false,
          aiVoice: false,
        });
        window.dispatchEvent(
          new CustomEvent('mrx:account-created', {
            detail: { email, phone },
          }),
        );
        setIntakeOpen(true);
      }
      setStatus(
        response.ok
          ? result.verificationSent
            ? 'Your private profile is saved. Continue with Elena now on this device. A secure return link was requested for your email so you can come back from another device.'
            : 'Your private profile is saved. Continue with Elena now on this device. Secure return email is temporarily unavailable, but your intake will stay protected in this browser.'
          : result.error === 'invalid_phone'
            ? 'Please include a valid phone number with area code.'
            : result.error === 'invalid_full_name'
              ? 'Please enter your full first and last name.'
              : 'Your private profile could not be created just now.',
      );
    } catch {
      setStatus('Your private profile could not be created just now.');
    } finally {
      setRequestingLink(false);
    }
  }

  async function downloadExport() {
    if (!session) return;
    const response = await fetch('/api/account/export', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return setStatus('The export could not be prepared.');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mrx-account-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function deleteAttachment(id: string) {
    if (!hasOwnerAccess || !confirm('Delete this private document from your MRX account?')) return;
    const response = await fetch(`/api/chat/attachments/${id}`, {
      method: 'DELETE',
      headers: ownerHeaders(),
    });
    if (response.ok) setAttachments((current) => current.filter((item) => item.id !== id));
  }

  async function openConversation(id: string) {
    if (!session) return;
    const response = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId: id }),
    });
    if (response.ok) location.href = '/?ask=1';
    else setStatus('That conversation could not be opened.');
  }

  async function deleteConversation(id: string) {
    if (
      !session ||
      !confirm('Permanently delete this conversation and any documents attached to it?')
    )
      return;
    const response = await fetch(`/api/chat/conversations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (response.ok) setConversations((current) => current.filter((item) => item.id !== id));
    else setStatus('That conversation could not be deleted.');
  }

  async function updateFact(fact: OwnerFact, action: 'confirm' | 'reject' | 'correct') {
    if (!hasOwnerAccess) return;
    let value: unknown;
    if (action === 'correct') {
      const next = prompt('Enter the corrected information:', String(fact.value ?? ''));
      if (next === null || !next.trim()) return;
      value = next.trim();
    }
    const response = await fetch('/api/chat/facts', {
      method: 'POST',
      headers: ownerHeaders(true),
      body: JSON.stringify({ action, factId: fact.id, ...(action === 'correct' ? { value } : {}) }),
    });
    if (!response.ok) return setStatus('That remembered fact could not be updated.');
    if (action === 'reject') setFacts((current) => current.filter((item) => item.id !== fact.id));
    else if (action === 'confirm')
      setFacts((current) =>
        current.map((item) => (item.id === fact.id ? { ...item, status: 'confirmed' } : item)),
      );
    else location.reload();
  }

  async function previewAttachment(id: string) {
    if (!hasOwnerAccess) return;
    const response = await fetch(`/api/chat/attachments/${id}?preview=1`, {
      headers: ownerHeaders(),
    });
    const result = await response.json();
    if (result.attachment?.previewUrl)
      window.open(result.attachment.previewUrl, '_blank', 'noopener,noreferrer');
    else setStatus('A secure preview is not ready yet.');
  }

  async function uploadDocument(file?: File, mineralInterestId = activeInterestId) {
    if (!file || !supabase || !hasOwnerAccess) return;
    if (!documentUploadsEnabled || !documentProcessingEnabled) {
      setStatus(
        'Secure document processing is temporarily unavailable. No file was uploaded. Please try again later.',
      );
      return;
    }
    const preparedRequirement = uploadRequirementKey
      ? underwritingChecklist?.items.find((item) => item.requirementKey === uploadRequirementKey)
      : null;
    const requestedMineralInterestId = uploadRequirementKey
      ? (preparedRequirement?.mineralInterestId ?? null)
      : mineralInterestId;
    if (
      !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) ||
      file.size > 15 * 1024 * 1024
    ) {
      setStatus('Use a PDF, JPEG, or PNG up to 15 MB.');
      return;
    }
    const consented = window.confirm(
      'Allow MRX to securely scan, OCR, redact sensitive identifiers from, and analyze this document to help assess your mineral rights?',
    );
    if (!consented) {
      setStatus('Nothing was uploaded.');
      return;
    }
    setUploadingDocument(true);
    try {
      const signedResponse = await fetch('/api/chat/attachments/sign', {
        method: 'POST',
        headers: ownerHeaders(true),
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          mineralInterestId: requestedMineralInterestId,
          documentType: uploadDocumentType,
          requirementKey: uploadRequirementKey || undefined,
          documentProcessingConsent: true,
          disclosureVersion: '2026-07-20-account-upload',
          sourceUrl: location.href,
        }),
      });
      const signed = await signedResponse.json();
      if (!signedResponse.ok) throw new Error(signed.error || 'signed_upload_failed');
      const upload = await supabase.storage
        .from('owner-documents')
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
      if (upload.error) throw upload.error;
      const complete = await fetch('/api/chat/attachments/complete', {
        method: 'POST',
        headers: ownerHeaders(true),
        body: JSON.stringify({ attachmentId: signed.attachmentId }),
      });
      const result = await complete.json();
      if (!complete.ok) throw new Error(result.error || 'processing_not_started');
      setAttachments((current) => [
        {
          id: String(signed.attachmentId),
          mineral_interest_id: requestedMineralInterestId,
          original_name: file.name,
          document_type: uploadDocumentType,
          mime_type: file.type,
          size_bytes: file.size,
          status: String(result.status || 'quarantined'),
          created_at: new Date().toISOString(),
        } satisfies Attachment,
        ...current,
      ]);
      const uploadStatusMessage =
        result.status === 'quarantined'
          ? file.name +
            ' is saved to your private MRX profile and is waiting for its security scan.'
          : file.name + ' was received and queued for its security scan.';
      setStatus(uploadStatusMessage);
      trackAccountEvent('document_received', {
        document_type: uploadDocumentType,
        requirement_key: uploadRequirementKey,
        status: result.status,
      });
      setUploadRequirementKey(null);
      const checklistResponse = await fetch('/api/account/underwriting-checklist', {
        headers: ownerHeaders(),
      });
      if (checklistResponse.ok) {
        const checklistResult = await checklistResponse.json();
        setUnderwritingChecklist(checklistResult.checklist ?? null);
      }
    } catch {
      setStatus('That document could not be uploaded. Nothing was shared with MRX.');
    } finally {
      setUploadingDocument(false);
    }
  }

  async function chooseInterest(id: string) {
    if (!hasOwnerAccess) return;
    const response = await fetch('/api/account/primary-interest', {
      method: 'POST',
      headers: ownerHeaders(true),
      body: JSON.stringify({ interestId: id }),
    });
    if (!response.ok) return setStatus('The active mineral interest could not be changed.');
    setActiveInterestId(id);
    setStatus('That mineral interest will be used first in future conversations.');
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasOwnerAccess) return;
    setSavingProfile(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/account/profile', {
      method: 'POST',
      headers: ownerHeaders(true),
      body: JSON.stringify({
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        phone: String(form.get('phone') || '') || null,
        residenceLocation: String(form.get('residenceLocation') || '') || null,
      }),
    });
    const result = await response.json();
    setSavingProfile(false);
    if (!response.ok) {
      setStatus(
        result.error === 'invalid_phone'
          ? 'Please include a valid phone number with area code.'
          : 'Your profile could not be updated.',
      );
      return;
    }
    const residence = result.geography;
    setAccountProfile((current) => ({
      ...current,
      first_name: String(form.get('firstName') || ''),
      last_name: String(form.get('lastName') || ''),
      phone: String(form.get('phone') || '') || null,
      residence_city: residence?.city ?? current.residence_city,
      residence_state: residence?.state ?? current.residence_state,
      residence_state_code: residence?.stateCode ?? current.residence_state_code,
      residence_county: residence
        ? residence.status === 'resolved'
          ? residence.county
          : null
        : current.residence_county,
      residence_geography_status: residence?.status ?? current.residence_geography_status,
    }));
    setStatus(
      residence?.status === 'ambiguous'
        ? `Your profile is saved. ${residence.city} crosses ${residence.counties.map((county: { name: string }) => county.name).join(', ')} counties, so add a street address or ZIP when you are comfortable.`
        : 'Your MRX profile is saved for the next time you return.',
    );
  }

  async function persistMineralInterest(data: FormData) {
    if (!hasOwnerAccess) return null;
    setSavingInterest(true);
    try {
      const response = await fetch('/api/account/mineral-interest', {
        method: 'POST',
        headers: ownerHeaders(true),
        body: JSON.stringify({
          label: String(data.get('interestLabel') || '').trim() || null,
          locationDescription: String(data.get('mineralLocation') || '').trim() || null,
          state: String(data.get('state') || '').trim() || null,
          county: String(data.get('county') || '').trim() || null,
          townshipDistrict: String(data.get('townshipDistrict') || '').trim() || null,
          taxParcelId: String(data.get('taxParcelId') || '').trim() || null,
          blockSection: String(data.get('blockSection') || '').trim() || null,
          abstractSurvey: String(data.get('abstractSurvey') || '').trim() || null,
          sectionTownshipRange: String(data.get('sectionTownshipRange') || '').trim() || null,
          netMineralAcres: String(data.get('netMineralAcres') || '').trim() || null,
          grossAcresUnderLease: String(data.get('grossAcresUnderLease') || '').trim() || null,
          leaseStatus: String(data.get('leaseStatus') || 'unknown'),
          producingStatus: String(data.get('producingStatus') || 'unknown'),
          recentCheckAmount: String(data.get('recentCheckAmount') || '').trim() || null,
          ownershipType: String(data.get('ownershipType') || 'unknown'),
          operator: String(data.get('operator') || '').trim() || null,
          leaseName: String(data.get('leaseName') || '').trim() || null,
          assessmentDetails: String(data.get('assessmentDetails') || '').trim() || null,
          situationCode: accountSituationCode,
          intakeVersion: '2026-07-20-elena-v1',
          source:
            accountIntent === 'standalone'
              ? 'standalone_guided_intake'
              : accountIntent === 'elena' || accountIntent === 'conversation'
                ? 'elena_post_signup'
                : 'account_guided_intake',
          unknownFields: Array.from(data.entries())
            .filter(([key, value]) => key.startsWith('unknown_') && value === 'on')
            .map(([key]) => key.replace(/^unknown_/, '')),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'intake_save_failed');
      return result as {
        interestId: string;
        label: string;
        missingFields?: string[];
        geography?: { county?: string; state?: string; basin?: string };
      };
    } catch {
      setStatus(
        'That property could not be saved just now. Your answers are still on this screen.',
      );
      return null;
    } finally {
      setSavingInterest(false);
    }
  }

  async function saveMineralInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await persistMineralInterest(new FormData(form));
    if (!result) return;
    form.reset();
    setStatus(
      `Saved to your private profile${result.geography?.county ? ` in ${result.geography.county} County, ${result.geography.state}` : ''}${result.geography?.basin ? `. The property point maps to the ${result.geography.basin}` : ''}.${result.missingFields?.length ? ' MRX will use your consent choices for a missing-information checklist.' : ''}`,
    );
    window.setTimeout(() => location.reload(), 700);
  }

  async function saveGuidedIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasOwnerAccess) return;
    const data = new FormData(event.currentTarget);
    const result = await persistMineralInterest(data);
    if (!result) return;
    setSavedIntake({ interestId: result.interestId, label: result.label });
    setIntakeMissing(result.missingFields ?? []);
    setActiveInterestId(result.interestId);
    setInterests((current) => [
      {
        id: result.interestId,
        label: result.label,
        state: String(data.get('state') || '') || undefined,
        county: String(data.get('county') || '') || undefined,
        unknown_fields: result.missingFields ?? [],
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      ...current.filter((interest) => interest.id !== result.interestId),
    ]);

    const channels = [
      data.get('followupEmail') === 'on' ? 'email' : null,
      data.get('followupSms') === 'on' ? 'sms' : null,
    ].filter((channel): channel is 'email' | 'sms' => Boolean(channel));
    if ((result.missingFields?.length ?? 0) > 0 && channels.length) {
      setSendingChecklist(true);
      const followUp = await fetch('/api/account/intake-follow-up', {
        method: 'POST',
        headers: ownerHeaders(true),
        body: JSON.stringify({
          interestId: result.interestId,
          channels,
          sourceUrl: location.href,
        }),
      }).catch(() => null);
      const followUpResult = await followUp?.json().catch(() => ({}));
      setSendingChecklist(false);
      if (!followUp?.ok) {
        setStatus(
          'Your property is saved. The checklist could not be sent, so it remains visible in your private profile.',
        );
      } else {
        setStatus(
          `Your property is saved. Elena queued the missing-information checklist by ${followUpResult?.queued?.join(' and ') || channels.join(' and ')}.`,
        );
      }
    } else {
      setStatus('Your property is saved for Senior Underwriter review.');
    }
    setIntakeStep(6);
    trackAccountEvent('intake_completed', { mineral_interest_id: result.interestId });
  }

  function finishIntake() {
    setIntakeOpen(false);
    setIntakeStep(0);
    setSavedIntake(null);
    setIntakeMissing([]);
    if (typeof history !== 'undefined') history.replaceState({}, '', location.pathname);
  }

  function addAnotherInterest() {
    intakeFormRef.current?.reset();
    setSavedIntake(null);
    setIntakeMissing([]);
    setIntakeStep(1);
  }

  async function deleteAccount() {
    if (!session) return;
    if (!deletionToken) {
      if (
        !confirm(
          'Request deletion of your MRX owner account? MRX will mark the account for deletion and give you one more confirmation step.',
        )
      )
        return;
      const response = await fetch('/api/account/deletion-request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.deletionToken)
        return setStatus('The account deletion request could not be started.');
      setDeletionToken(result.deletionToken);
      setDeletionPending(true);
      setStatus(
        'Account deletion is pending. Deletion will complete in 24 hours unless you sign back in. Choose Delete my account again within 10 minutes to confirm permanent deletion now.',
      );
      return;
    }
    if (
      !confirm(
        'Final confirmation: permanently delete your MRX account, conversations, appointments, and private documents? This cannot be undone.',
      )
    )
      return;
    const response = await fetch('/api/account', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deletionIntent: true, deletionToken }),
    });
    if (!response.ok)
      return setStatus(
        'The account could not be deleted. Request a new deletion token and try again.',
      );
    await supabase?.auth.signOut();
    location.href = '/';
  }

  async function revokePermission(channel: keyof RequestedPermissions) {
    if (!accountProfile.email)
      return setStatus('A verified email is required to update communication choices.');
    const next = { ...requestedPermissions, [channel]: false };
    const response = await fetch('/api/chat/permissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        email: accountProfile.email,
        phone: accountProfile.phone || null,
        permissions: next,
        sourceUrl: location.href,
      }),
    });
    if (!response.ok) return setStatus('That communication choice could not be updated.');
    setRequestedPermissions(next);
    const channelLabel =
      channel === 'email'
        ? 'Email'
        : channel === 'sms'
          ? 'SMS'
          : channel === 'call'
            ? 'Human phone call'
            : 'Automated/AI voice';
    setStatus(`${channelLabel} requested updates are now declined.`);
  }

  if (!supabase)
    return (
      <div className="account-card">
        <AccountExplainer />
        <h3>Account connection pending</h3>
        <p>
          The private account area is built and will become active when the Supabase project
          settings are added.
        </p>
      </div>
    );
  if (loading)
    return (
      <div className="account-card">
        <p>Loading your private MRX account…</p>
      </div>
    );
  if (!hasOwnerAccess)
    return (
      <form className="account-card account-signin" onSubmit={requestLink}>
        <p className="account-kicker">Private owner account</p>
        <h2>{accountIntentTitle}</h2>
        <p>{accountIntentDescription}</p>
        <label>
          Full name
          <input name="fullName" type="text" required autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" required autoComplete="tel" />
        </label>
        <button type="submit" disabled={requestingLink}>
          {requestingLink ? 'Creating private account…' : 'Create account and continue'}
        </button>
        <small>
          Continue immediately on this device. MRX also requests a passwordless email link for
          secure return access from another device. Saving your contact details does not give MRX
          permission to send updates or place calls; you can approve each channel separately with
          Travis.
        </small>
        {status && (
          <p className="account-status" role="status">
            {status}
          </p>
        )}
      </form>
    );

  return (
    <>
      {intakeOpen && (
        <div className="elena-intake-backdrop" role="presentation">
          <section
            className="elena-intake"
            role="dialog"
            aria-modal="true"
            aria-labelledby="elena-intake-title"
          >
            <header className="elena-intake__header">
              <img src="/assets/team/elena-128.webp" alt="" width="64" height="64" />
              <div>
                <span>Elena · MRX owner intake</span>
                <h2 id="elena-intake-title">
                  {intakeStep === 6
                    ? 'Your property is saved'
                    : 'Let’s prepare your underwriter record'}
                </h2>
              </div>
              <button type="button" aria-label="Close owner intake" onClick={finishIntake}>
                ×
              </button>
            </header>

            {intakeStep === 0 ? (
              <div className="elena-intake__intro">
                <p>
                  Hi{accountProfile.first_name ? `, ${accountProfile.first_name}` : ''}. I’m Elena.
                  I’ll ask a few short questions about one mineral property at a time so a Senior
                  Underwriter can prepare a fair, more useful assessment before your call.
                </p>
                <p>
                  This takes a couple of minutes. If you do not know an answer, that is completely
                  fine. Choose “I don’t know” and I’ll put it on a checklist you can reply to later.
                </p>
                <div className="elena-intake__actions">
                  <button type="button" onClick={() => setIntakeStep(1)}>
                    Start with one property
                  </button>
                  <button type="button" className="elena-intake__secondary" onClick={finishIntake}>
                    I’ll do this later
                  </button>
                </div>
              </div>
            ) : (
              <form ref={intakeFormRef} className="elena-intake__form" onSubmit={saveGuidedIntake}>
                {intakeStep < 6 && (
                  <div className="elena-intake__progress" aria-label={`Step ${intakeStep} of 5`}>
                    <span style={{ width: `${intakeStep * 20}%` }} />
                  </div>
                )}

                <fieldset hidden={intakeStep !== 1}>
                  <legend>Where are these minerals?</legend>
                  <p>
                    Start with whatever location detail you have. A state and county are enough to
                    begin.
                  </p>
                  <label>
                    Property nickname, optional
                    <input
                      name="interestLabel"
                      placeholder="Example: Reeves County inherited royalties"
                    />
                  </label>
                  <div className="elena-intake__grid">
                    <label>
                      State
                      <input name="state" autoComplete="address-level1" placeholder="Texas" />
                      <small>
                        <input type="checkbox" name="unknown_state" /> I don’t know
                      </small>
                    </label>
                    <label>
                      County or parish
                      <input name="county" autoComplete="address-level2" placeholder="Reeves" />
                      <small>
                        <input type="checkbox" name="unknown_county" /> I don’t know
                      </small>
                    </label>
                  </div>
                  <label>
                    Any location or property description
                    <textarea
                      name="mineralLocation"
                      rows={3}
                      placeholder="Address, nearby town, coordinates, deed wording, or other description"
                    />
                    <small>
                      <input type="checkbox" name="unknown_mineralLocation" /> I don’t know
                    </small>
                  </label>
                </fieldset>

                <fieldset hidden={intakeStep !== 2}>
                  <legend>Do you have a parcel or legal description?</legend>
                  <p>
                    These details may be on a deed, lease, tax record, division order, or royalty
                    statement.
                  </p>
                  <label>
                    Township or district name
                    <input name="townshipDistrict" placeholder="Township, district, or unit" />
                    <small>
                      <input type="checkbox" name="unknown_townshipDistrict" /> I don’t know
                    </small>
                  </label>
                  <label>
                    Tax parcel or other property ID
                    <input
                      name="taxParcelId"
                      placeholder="Parcel ID, API, lease number, or deed reference"
                    />
                    <small>
                      <input type="checkbox" name="unknown_taxParcelId" /> I don’t know
                    </small>
                  </label>
                  <div className="elena-intake__grid">
                    <label>
                      Block / section
                      <input name="blockSection" placeholder="Block 13, Section 22" />
                    </label>
                    <label>
                      Abstract / survey
                      <input name="abstractSurvey" placeholder="A-123, Smith Survey" />
                    </label>
                  </div>
                  <label>
                    Section / township / range
                    <input name="sectionTownshipRange" placeholder="Sec 12 T2N R3W" />
                  </label>
                </fieldset>

                <fieldset hidden={intakeStep !== 3}>
                  <legend>What kind of interest do you own?</legend>
                  <label>
                    Ownership type
                    <select name="ownershipType" defaultValue="unknown">
                      <option value="unknown">I don’t know</option>
                      <option value="mineral_rights">Mineral rights</option>
                      <option value="royalties_only">Royalty interest</option>
                      <option value="overriding_royalties">Overriding royalty</option>
                      <option value="working_interest">Working interest</option>
                    </select>
                  </label>
                  <div className="elena-intake__grid">
                    <label>
                      Net mineral acres owned
                      <input
                        name="netMineralAcres"
                        inputMode="decimal"
                        placeholder="Example: 12.5"
                      />
                      <small>
                        <input type="checkbox" name="unknown_netMineralAcres" /> I don’t know
                      </small>
                    </label>
                    <label>
                      Gross acres under lease
                      <input
                        name="grossAcresUnderLease"
                        inputMode="decimal"
                        placeholder="If known"
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset hidden={intakeStep !== 4}>
                  <legend>Is it leased or producing?</legend>
                  <div className="elena-intake__grid">
                    <label>
                      Is the property currently leased?
                      <select name="leaseStatus" defaultValue="unknown">
                        <option value="unknown">I don’t know</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                    <label>
                      Is the property currently producing?
                      <select name="producingStatus" defaultValue="unknown">
                        <option value="unknown">I don’t know</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Recent royalty-check amount, if producing
                    <input name="recentCheckAmount" placeholder="Amount and month, if known" />
                    <small>
                      <input type="checkbox" name="unknown_recentCheckAmount" /> I don’t know
                    </small>
                  </label>
                  <div className="elena-intake__grid">
                    <label>
                      Operator, optional
                      <input name="operator" placeholder="Operator name" />
                    </label>
                    <label>
                      Lease, unit, or well name, optional
                      <input name="leaseName" />
                    </label>
                  </div>
                </fieldset>

                <fieldset hidden={intakeStep !== 5}>
                  <legend>Anything else the Senior Underwriter should know?</legend>
                  <label>
                    Questions, offers, deadlines, or other details
                    <textarea
                      name="assessmentDetails"
                      rows={4}
                      placeholder="Tell us what you want help assessing. It is okay to leave this blank."
                    />
                  </label>
                  <div className="elena-intake__followup">
                    <strong>How should Elena send your missing-information checklist?</strong>
                    <label>
                      <input type="checkbox" name="followupEmail" />
                      Email it to {accountProfile.email || session?.user.email || 'your email'}
                    </label>
                    <label>
                      <input type="checkbox" name="followupSms" disabled={!accountProfile.phone} />
                      Text it
                      {accountProfile.phone
                        ? ` to ${accountProfile.phone}`
                        : ' after a phone is added to your profile'}
                    </label>
                    <small>
                      Requested case updates only. Message and data rates may apply; reply STOP to
                      opt out. You can reply with pictures or email
                      underwriter@mineralrightsxchange.com.
                    </small>
                  </div>
                </fieldset>

                {intakeStep === 6 && savedIntake && (
                  <div className="elena-intake__complete">
                    <p>
                      <strong>{savedIntake.label}</strong> is now on your private owner profile.
                    </p>
                    {intakeMissing.length ? (
                      <div>
                        <p>
                          If you find any of these later, reply to Elena’s message or send a
                          picture:
                        </p>
                        <ul>
                          {intakeMissing.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p>
                        You supplied the key starting details. A Senior Underwriter can review the
                        record before your call.
                      </p>
                    )}
                    <label>
                      Document type
                      <select
                        value={uploadDocumentType}
                        onChange={(event) => {
                          setUploadDocumentType(selectedDocumentType(event.currentTarget.value));
                          setUploadRequirementKey(null);
                        }}
                      >
                        {UNDERWRITING_DOCUMENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {DOCUMENT_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p>Underwriter preparation checklist</p>
                    <label className="account-upload-button">
                      {uploadingDocument
                        ? 'Uploading…'
                        : 'Upload a deed, statement, lease, or photo'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={
                          uploadingDocument || !documentUploadsEnabled || !documentProcessingEnabled
                        }
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = '';
                          void uploadDocument(file, savedIntake.interestId);
                        }}
                      />
                    </label>
                    <div className="elena-intake__actions">
                      <button type="button" onClick={addAnotherInterest}>
                        Add another property
                      </button>
                      <button
                        type="button"
                        className="elena-intake__secondary"
                        onClick={finishIntake}
                      >
                        Finish
                      </button>
                    </div>
                  </div>
                )}

                {intakeStep > 0 && intakeStep < 6 && (
                  <div className="elena-intake__actions">
                    <button
                      type="button"
                      className="elena-intake__secondary"
                      onClick={() => setIntakeStep((step) => Math.max(0, step - 1))}
                    >
                      Back
                    </button>
                    {intakeStep < 5 ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          setIntakeStep((step) => step + 1);
                        }}
                      >
                        Next
                      </button>
                    ) : (
                      <button type="submit" disabled={savingInterest || sendingChecklist}>
                        {savingInterest || sendingChecklist
                          ? 'Saving securely…'
                          : 'Save this property'}
                      </button>
                    )}
                  </div>
                )}
              </form>
            )}
          </section>
        </div>
      )}
      <div className="account-hub">
        <header>
          <div>
            <p className="account-kicker">Private owner account</p>
            <h2>Welcome back{accountProfile.first_name ? `, ${accountProfile.first_name}` : ''}</h2>
            <p>Take your time. MRX will keep the thread as you gather documents and questions.</p>
          </div>
          {session ? (
            <button type="button" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          ) : (
            <span className="account-device-badge">Protected on this device</span>
          )}
        </header>
        {status && <p className="account-status">{status}</p>}
        <section className="account-profile">
          <div className="account-section-head">
            <div>
              <h3>Your MRX profile</h3>
              <p>
                One private record keeps your contact details, home geography, mineral properties,
                and ongoing conversations together.
              </p>
            </div>
            <span className={session ? 'account-verified' : 'account-device-badge'}>
              {session
                ? `✓ ${session.user.email}`
                : 'Current device access · email verification pending'}
            </span>
          </div>
          <form className="account-profile-form" onSubmit={saveProfile}>
            <label>
              First name
              <input
                name="firstName"
                defaultValue={accountProfile.first_name || ''}
                required
                autoComplete="given-name"
              />
            </label>
            <label>
              Last name
              <input
                name="lastName"
                defaultValue={accountProfile.last_name || ''}
                required
                autoComplete="family-name"
              />
            </label>
            <label>
              Phone, optional
              <input
                name="phone"
                type="tel"
                defaultValue={accountProfile.phone || ''}
                autoComplete="tel"
              />
            </label>
            <label className="account-profile-form__wide">
              Where you live, optional
              <input
                name="residenceLocation"
                defaultValue={[
                  accountProfile.residence_city,
                  accountProfile.residence_county && `${accountProfile.residence_county} County`,
                  accountProfile.residence_state_code || accountProfile.residence_state,
                ]
                  .filter(Boolean)
                  .join(', ')}
                placeholder="City and state, or a full address for an exact county"
                autoComplete="street-address"
              />
              <small>
                A full address can distinguish cities that cross county lines. This is kept separate
                from where your minerals are located.
              </small>
            </label>
            <button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save my profile'}
            </button>
          </form>
        </section>
        <section>
          <div className="account-section-head">
            <div>
              <h3>Conversations</h3>
              <p>Your saved questions, cited answers, and appointment history.</p>
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('mrx:open-chat'))}
            >
              Ask Travis
            </button>
          </div>
          {!conversations.length ? (
            <p className="account-empty">No saved conversations yet.</p>
          ) : (
            <div className="account-list">
              {conversations.map((conversation) => (
                <details key={conversation.id}>
                  <summary>
                    <span>
                      {conversation.title || conversation.summary || 'Mineral-rights conversation'}
                    </span>
                    <time>{new Date(conversation.updated_at).toLocaleDateString()}</time>
                  </summary>
                  <div>
                    <span>
                      <button type="button" onClick={() => openConversation(conversation.id)}>
                        Continue this conversation
                      </button>
                      <button type="button" onClick={() => deleteConversation(conversation.id)}>
                        Delete conversation
                      </button>
                    </span>
                    {conversation.messages
                      ?.filter((message) => message.role !== 'system')
                      .map((message) => (
                        <article key={message.id}>
                          <small>
                            {message.role === 'assistant'
                              ? getGuideChatLabel(message.persona || 'travis')
                              : 'You'}
                          </small>
                          <p>{message.content}</p>
                        </article>
                      ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="account-section-head">
            <div>
              <h3>
                {accountIntent === 'elena' ? 'Elena guided owner intake' : 'Guided owner intake'}
              </h3>
              <p>
                Add one property at a time. Choose I do not know whenever you are not sure; MRX
                keeps unknown answers visible for Senior Underwriter review instead of guessing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIntakeStep(0);
                setIntakeOpen(true);
              }}
            >
              Start with Elena
            </button>
          </div>
          <details className="account-manual-intake">
            <summary>Prefer to see every question on one page?</summary>
            <form className="account-location-form" onSubmit={saveMineralInterest}>
              <label>
                Mineral interest name
                <input
                  name="interestLabel"
                  placeholder="Example: Reeves County inherited royalties"
                />
              </label>
              <label>
                Property location or legal description
                <textarea
                  name="mineralLocation"
                  rows={3}
                  placeholder="City and state, street address, coordinates, or any section-township-range/legal description you have"
                />
                <small>
                  <input type="checkbox" name="unknown_mineralLocation" /> I do not know yet
                </small>
              </label>
              <label>
                State
                <input name="state" placeholder="Texas, Oklahoma, New Mexico…" />
                <small>
                  <input type="checkbox" name="unknown_state" /> I do not know yet
                </small>
              </label>
              <label>
                County or parish
                <input name="county" placeholder="Reeves, Midland, Lea…" />
                <small>
                  <input type="checkbox" name="unknown_county" /> I do not know yet
                </small>
              </label>
              <label>
                Township, district, or survey
                <input
                  name="townshipDistrict"
                  placeholder="Township, district, abstract, survey, or unit"
                />
                <small>
                  <input type="checkbox" name="unknown_townshipDistrict" /> I do not know yet
                </small>
              </label>
              <label>
                Parcel, tax, lease, or legal identifier
                <input
                  name="taxParcelId"
                  placeholder="Parcel ID, API, lease number, unit, or deed reference"
                />
                <small>
                  <input type="checkbox" name="unknown_taxParcelId" /> I do not know yet
                </small>
              </label>
              <label>
                Block / section
                <input name="blockSection" placeholder="Block 13, Section 22" />
              </label>
              <label>
                Abstract / survey
                <input name="abstractSurvey" placeholder="A-123, Smith Survey" />
              </label>
              <label>
                Section-township-range
                <input name="sectionTownshipRange" placeholder="Sec 12 T2N R3W" />
              </label>
              <label>
                Acreage or decimal interest
                <input name="netMineralAcres" placeholder="Net mineral acres or royalty decimal" />
                <small>
                  <input type="checkbox" name="unknown_netMineralAcres" /> I do not know yet
                </small>
              </label>
              <label>
                Gross acres under lease
                <input
                  name="grossAcresUnderLease"
                  placeholder="If shown on a lease or check stub"
                />
              </label>
              <label>
                Leased?
                <select name="leaseStatus" defaultValue="unknown">
                  <option value="unknown">I do not know</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label>
                Producing?
                <select name="producingStatus" defaultValue="unknown">
                  <option value="unknown">I do not know</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label>
                Recent check or statement
                <input
                  name="recentCheckAmount"
                  placeholder="Amount, date, operator, or I do not know"
                />
                <small>
                  <input type="checkbox" name="unknown_recentCheckAmount" /> I do not know yet
                </small>
              </label>
              <label>
                Ownership type
                <select name="ownershipType" defaultValue="unknown">
                  <option value="unknown">I do not know</option>
                  <option value="mineral_rights">Mineral rights</option>
                  <option value="royalties_only">Royalty interest</option>
                  <option value="overriding_royalties">Overriding royalty</option>
                  <option value="working_interest">Working interest</option>
                </select>
              </label>
              <label>
                Operator, optional
                <input name="operator" placeholder="Operator name if known" />
              </label>
              <label>
                Lease or well names, optional
                <input name="leaseName" placeholder="Lease, unit, or well names" />
              </label>
              <label className="account-profile-form__wide">
                What do you want MRX to help assess?
                <textarea
                  name="assessmentDetails"
                  rows={4}
                  placeholder="Tell MRX what you own or may own, recent royalty checks, offers received, questions, deadlines, or documents you plan to upload."
                />
              </label>
              <button type="submit" disabled={savingInterest}>
                {savingInterest ? 'Saving…' : 'Save for assessment'}
              </button>
              <small>
                Documents are reviewed by a Senior Underwriter. Submission does not constitute an
                offer. If details are missing and you have consented to email or SMS updates, MRX
                can send a checklist; you can reply by text with pictures or email
                underwriter@mineralrightsxchange.com.
              </small>
            </form>
          </details>
          {!interests.length ? (
            <p className="account-empty">
              No mineral interests have been identified yet. Add whatever location detail you have
              now and refine it later.
            </p>
          ) : (
            <div className="account-files">
              {interests.map((interest) => (
                <div key={interest.id}>
                  <span>
                    <strong>
                      {interest.label ||
                        [interest.city, interest.county, interest.state]
                          .filter(Boolean)
                          .join(', ') ||
                        'Mineral interest'}
                    </strong>
                    <small>
                      {[
                        interest.basin_name,
                        interest.operator,
                        interest.lease_name,
                        interest.township_district &&
                          `Township/district: ${interest.township_district}`,
                        interest.lease_status && `Leased: ${interest.lease_status}`,
                        interest.producing_status && `Producing: ${interest.producing_status}`,
                        interest.recent_check_amount &&
                          `Recent check: ${interest.recent_check_amount}`,
                        interest.unknown_fields?.length &&
                          `Unknown: ${interest.unknown_fields.join(', ')}`,
                        interest.location_precision && `${interest.location_precision} location`,
                        interest.geography_status === 'ambiguous' && 'county confirmation needed',
                        interest.basin_needs_confirmation && 'basin confirmation needed',
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Details can be added in chat'}
                    </small>
                  </span>
                  <button type="button" onClick={() => chooseInterest(interest.id)}>
                    {activeInterestId === interest.id ? 'Active in chat' : 'Use in chat'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="account-section-head">
            <div>
              <h3>What MRX remembers</h3>
              <p>
                Confirm, correct, or remove facts. Corrections keep a private history instead of
                silently overwriting the old value.
              </p>
            </div>
          </div>
          {!facts.length ? (
            <p className="account-empty">No remembered owner facts yet.</p>
          ) : (
            <div className="account-files">
              {facts.map((fact) => (
                <div key={fact.id}>
                  <span>
                    <strong>{fact.field.replaceAll('_', ' ')}</strong>
                    <small>
                      {factText(fact.value)} · {fact.status}
                    </small>
                  </span>
                  <span>
                    <button type="button" onClick={() => updateFact(fact, 'correct')}>
                      Correct
                    </button>
                    {fact.status === 'candidate' && (
                      <button type="button" onClick={() => updateFact(fact, 'confirm')}>
                        Confirm
                      </button>
                    )}
                    <button type="button" onClick={() => updateFact(fact, 'reject')}>
                      Remove
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="account-section-head">
            <div>
              <h3>Private documents</h3>
              <p>
                Original files and raw OCR remain private in Supabase. GHL receives redacted
                summaries/status only after processing.
              </p>
            </div>
            <label>
              Document type
              <select
                value={uploadDocumentType}
                onChange={(event) => {
                  setUploadDocumentType(selectedDocumentType(event.currentTarget.value));
                  setUploadRequirementKey(null);
                }}
              >
                {UNDERWRITING_DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DOCUMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            {(!documentUploadsEnabled || !documentProcessingEnabled) && (
              <p role="status" className="account-empty">
                Secure document uploads are temporarily unavailable while the security processor is
                offline. Appointments and intake remain available.
              </p>
            )}
            {uploadRequirementKey && (
              <p className="account-device-badge">
                Prepared for:{' '}
                {underwritingChecklist?.items.find(
                  (item) => item.requirementKey === uploadRequirementKey,
                )?.label || 'selected checklist item'}
              </p>
            )}
            <p>Underwriter preparation checklist</p>
            <label className="account-upload-button">
              {uploadingDocument ? 'Uploading…' : 'Upload supporting document'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={
                  uploadingDocument || !documentUploadsEnabled || !documentProcessingEnabled
                }
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = '';
                  void uploadDocument(file);
                }}
              />
            </label>
          </div>
          <section className="account-checklist" aria-labelledby="underwriting-checklist-heading">
            <div className="account-section-head">
              <div>
                <h4 id="underwriting-checklist-heading">Underwriter preparation checklist</h4>
                <p>
                  Requirements adapt to each saved property and situation. A clean upload still
                  needs assigned staff verification; checklist status is not an offer, appraisal,
                  title opinion, or guarantee.
                </p>
              </div>
              {underwritingChecklist && (
                <span
                  className={
                    underwritingChecklist.readinessStatus === 'ready'
                      ? 'account-verified'
                      : 'account-device-badge'
                  }
                >
                  {underwritingChecklist.summary.complete} of {underwritingChecklist.summary.total}{' '}
                  complete
                </span>
              )}
            </div>
            {!underwritingChecklist?.items.length ? (
              <p className="account-empty">
                Save a mineral property to generate its document checklist.
              </p>
            ) : (
              <div className="account-files">
                {underwritingChecklist.items.map((item) => (
                  <div key={item.requirementKey}>
                    <span>
                      <strong>{item.label}</strong>
                      <small>
                        {item.requirementLevel === 'required'
                          ? 'Required for packet readiness'
                          : 'Recommended if available'}{' '}
                        ·{' '}
                        {item.ownerAction === 'complete'
                          ? 'Complete'
                          : item.ownerAction === 'wait'
                            ? 'Received; staff review pending'
                            : item.ownerAction === 'reupload'
                              ? 'Replacement requested'
                              : `Upload ${item.acceptedDocumentTypes
                                  .map((type) => DOCUMENT_TYPE_LABELS[type])
                                  .join(' or ')}`}
                      </small>
                    </span>
                    {(item.ownerAction === 'upload' || item.ownerAction === 'reupload') && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadDocumentType(item.acceptedDocumentTypes[0] ?? 'other');
                          setUploadRequirementKey(item.requirementKey);
                          if (item.mineralInterestId) setActiveInterestId(item.mineralInterestId);
                          setStatus(
                            'Choose the typed file below to attach it to this checklist item.',
                          );
                        }}
                      >
                        Prepare upload
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          {!attachments.length ? (
            <p className="account-empty">No private documents attached.</p>
          ) : (
            <div className="account-files">
              {attachments.map((file) => (
                <div key={file.id}>
                  <span>
                    <strong>{file.original_name}</strong>
                    <small>
                      {file.document_type && isUnderwritingDocumentType(file.document_type)
                        ? `${DOCUMENT_TYPE_LABELS[file.document_type]} · `
                        : ''}
                      {Math.round(file.size_bytes / 1024)} KB · {file.status}
                    </small>
                  </span>
                  <span>
                    {file.status === 'ready' && (
                      <button type="button" onClick={() => previewAttachment(file.id)}>
                        Open
                      </button>
                    )}
                    <button type="button" onClick={() => deleteAttachment(file.id)}>
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="account-section-head">
            <div>
              <h3>Requested update permissions</h3>
              <p>
                Website help continues even when every channel is declined. GHL Voice AI is limited
                to case updates you requested and also requires a verified phone.
              </p>
            </div>
          </div>
          <div className="account-files">
            {(
              [
                ['email', 'Email requested updates'],
                ['call', 'Human phone call requested updates'],
                ['sms', 'SMS requested updates'],
                ['aiVoice', 'GHL Voice AI requested updates'],
              ] as Array<[keyof RequestedPermissions, string]>
            ).map(([channel, label]) => (
              <div key={channel}>
                <span>
                  <strong>{label}</strong>
                  <small>{requestedPermissions[channel] ? 'Allowed' : 'Declined'}</small>
                </span>
                {requestedPermissions[channel] && (
                  <button type="button" onClick={() => revokePermission(channel)}>
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="account-controls">
          <h3>Your data controls</h3>
          {session ? (
            <>
              <p>
                {deletionPending
                  ? 'Account deletion is pending and will complete in 24 hours unless you sign back in. Confirm again if you want to permanently delete now.'
                  : 'Download a machine-readable copy or permanently delete the account and its private files.'}
              </p>
              <div>
                <button type="button" onClick={downloadExport}>
                  Download my data
                </button>
                <button type="button" className="account-danger" onClick={deleteAccount}>
                  {deletionToken ? 'Confirm permanent deletion' : 'Delete my account'}
                </button>
              </div>
            </>
          ) : (
            <p>
              Open the secure link sent to {accountProfile.email || 'your email'} to enable
              cross-device access, data export, and permanent account deletion. You can finish this
              intake and upload documents on the current device now.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
