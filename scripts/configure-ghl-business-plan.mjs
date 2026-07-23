import definition from '../config/ghl-business-plan.json' with { type: 'json' };

const API_BASE = 'https://services.leadconnectorhq.com';
const token =
  process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.MRX_GHL_API_KEY || process.env.GHL_API_TOKEN;
const configuredLocation = process.env.GHL_LOCATION_ID || process.env.MRX_GHL_LOCATION_ID;
const calendarId =
  process.env.GHL_CALENDAR_ID || process.env.MRX_GHL_CALENDAR_ID || 'mEqrbWIelaS7o5TMsqUX';
const apply = process.argv.includes('--apply');
const fieldsOnly = process.argv.includes('--fields-only');
const pipelinesOnly = process.argv.includes('--pipelines-only');

if (fieldsOnly && pipelinesOnly) {
  throw new Error('Choose either --fields-only or --pipelines-only, not both.');
}

if (!token) throw new Error('GHL_PRIVATE_INTEGRATION_TOKEN, MRX_GHL_API_KEY, or GHL_API_TOKEN is required');

function headers(version = 'v3') {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Version: version,
  };
}

async function request(url, init = {}) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.message || payload.error || `HTTP ${response.status}`;
    throw new Error(`${detail}`);
  }
  return payload;
}

async function locationId() {
  if (configuredLocation) return configuredLocation;
  const payload = await request(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}`, {
    headers: headers(),
  });
  const resolved = payload.calendar?.locationId || payload.locationId;
  if (!resolved) throw new Error('Could not resolve the GHL location from the MRX calendar');
  return resolved;
}

function fieldKey(name) {
  return `contact.${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')}`;
}

const location = await locationId();
const pipelinePayload = await request(
  `${API_BASE}/opportunities/pipelines?locationId=${encodeURIComponent(location)}`,
  { headers: headers() },
);
const existingPipelines = pipelinePayload.pipelines || [];
const customFieldPayload = await request(
  `${API_BASE}/locations/${encodeURIComponent(location)}/customFields?model=contact`,
  { headers: headers() },
);
const existingFields = customFieldPayload.customFields || [];

const result = { mode: apply ? 'apply' : 'dry-run', pipelines: [], customFields: [] };

for (const pipeline of fieldsOnly ? [] : definition.pipelines) {
  const existing = existingPipelines.find(
    (item) => item.name.trim().toLowerCase() === pipeline.name.toLowerCase(),
  );
  if (!existing) {
    if (!apply) {
      result.pipelines.push({ name: pipeline.name, action: 'create', stages: pipeline.stages });
      continue;
    }
    try {
      const createdPayload = await request(`${API_BASE}/opportunities/pipelines`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          locationId: location,
          name: pipeline.name,
          stages: pipeline.stages.map((name, position) => ({ name, position })),
        }),
      });
      const created = createdPayload.pipeline || createdPayload;
      result.pipelines.push({
        name: pipeline.name,
        action: 'created',
        id: created.id,
        stages: (created.stages || []).map((stage) => ({ name: stage.name, id: stage.id })),
      });
    } catch (error) {
      result.pipelines.push({ name: pipeline.name, action: 'blocked', error: error.message });
    }
    continue;
  }
  const existingNames = new Set((existing.stages || []).map((stage) => stage.name.toLowerCase()));
  const missingStages = pipeline.stages.filter((name) => !existingNames.has(name.toLowerCase()));
  if (!missingStages.length) {
    result.pipelines.push({
      name: pipeline.name,
      action: 'unchanged',
      id: existing.id,
      stages: (existing.stages || []).map((stage) => ({ name: stage.name, id: stage.id })),
    });
    continue;
  }
  if (!apply) {
    result.pipelines.push({ name: pipeline.name, action: 'add-stages', stages: missingStages });
    continue;
  }
  const retained = existing.stages || [];
  try {
    const updatedPayload = await request(
      `${API_BASE}/opportunities/pipelines/${encodeURIComponent(existing.id)}`,
      {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          locationId: location,
          name: pipeline.name,
          stages: [
            ...retained.map((stage, position) => ({
              id: stage.id,
              name: stage.name,
              position,
            })),
            ...missingStages.map((name, offset) => ({
              name,
              position: retained.length + offset,
            })),
          ],
        }),
      },
    );
    const updated = updatedPayload.pipeline || updatedPayload;
    result.pipelines.push({
      name: pipeline.name,
      action: 'updated',
      id: updated.id || existing.id,
      stages: (updated.stages || []).map((stage) => ({ name: stage.name, id: stage.id })),
    });
  } catch (error) {
    result.pipelines.push({ name: pipeline.name, action: 'blocked', error: error.message });
  }
}

for (const field of pipelinesOnly ? [] : definition.customFields) {
  const key = fieldKey(field.name);
  const existing = existingFields.find(
    (item) => item.fieldKey === key || item.name.trim().toLowerCase() === field.name.toLowerCase(),
  );
  if (existing) {
    result.customFields.push({
      name: field.name,
      action: 'unchanged',
      id: existing.id,
      fieldKey: existing.fieldKey,
      dcf: Boolean(field.dcf),
    });
    continue;
  }
  if (!apply) {
    result.customFields.push({
      name: field.name,
      action: 'create',
      fieldKey: key,
      dcf: Boolean(field.dcf),
    });
    continue;
  }
  try {
    const createdPayload = await request(
      `${API_BASE}/locations/${encodeURIComponent(location)}/customFields`,
      {
        method: 'POST',
        headers: headers('2021-07-28'),
        body: JSON.stringify({
          name: field.name,
          dataType: field.dataType,
          model: 'contact',
          placeholder: field.dcf ? 'Leave empty until the validated MRX DCF model is approved' : '',
          position: existingFields.length + result.customFields.length,
        }),
      },
    );
    const created = createdPayload.customField || createdPayload;
    result.customFields.push({
      name: field.name,
      action: 'created',
      id: created.id,
      fieldKey: created.fieldKey,
      dcf: Boolean(field.dcf),
    });
  } catch (error) {
    result.customFields.push({
      name: field.name,
      action: 'blocked',
      error: error.message,
      fieldKey: key,
      dcf: Boolean(field.dcf),
    });
  }
}

console.log(JSON.stringify(result, null, 2));
