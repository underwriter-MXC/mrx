import {
  OWNER_CASE_STATUSES,
  ownerCaseStatusLabel,
  type OwnerCaseStatus,
} from '../../lib/platform/staff';
import {
  STAFF_PIPELINE_PHASES,
  type StaffDashboardCase,
  type StaffDashboardData,
} from '../../lib/platform/staff-dashboard';
import type { ReactNode } from 'react';

export type StaffPortalView = 'overview' | 'pipeline' | 'owners';

export function StaffIcon({
  name,
}: {
  name: StaffPortalView | 'attention' | 'sync' | 'search' | 'arrow';
}) {
  const paths: Record<typeof name, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    pipeline: (
      <>
        <path d="M4 5h5v5H4zM15 14h5v5h-5z" />
        <path d="M9 7.5h4a3 3 0 0 1 3 3V14M7 10v5a2 2 0 0 0 2 2h6" />
      </>
    ),
    owners: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3.3 2.5-5 5.5-5s4.9 1.7 5.5 5M16 7h5M16 11h5M17 15h4" />
      </>
    ),
    attention: (
      <>
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v5M12 17.5v.01" />
      </>
    ),
    sync: (
      <>
        <path d="M20 7h-5V2M4 17h5v5" />
        <path d="M18.5 10a7 7 0 0 0-12-3L4 9M5.5 14a7 7 0 0 0 12 3L20 15" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
  };
  return (
    <svg className="staff-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function phaseIncludes(statuses: readonly OwnerCaseStatus[], status: OwnerCaseStatus) {
  return statuses.includes(status);
}

function moneyLabel(cents: number | null | undefined) {
  if (cents == null) return 'Value not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function contactLabel(item: StaffDashboardCase) {
  if (item.daysSinceContact == null) return 'Never contacted';
  if (item.daysSinceContact === 0) return 'Contacted today';
  if (item.daysSinceContact === 1) return 'Contacted yesterday';
  return `Contacted ${item.daysSinceContact} days ago`;
}

function syncLabel(value: string) {
  const labels: Record<string, string> = {
    synced: 'Synced',
    pending: 'Pending',
    sync_failed: 'Sync failed',
    not_configured: 'Not configured',
    contact_not_linked: 'Contact not linked',
    stage_unmapped: 'Stage unmapped',
    not_started: 'Not started',
  };
  return labels[value] ?? value.replaceAll('_', ' ');
}

function DashboardSkeleton() {
  return (
    <div
      className="staff-dashboard-skeleton"
      aria-label="Loading backoffice statistics"
      role="status"
    >
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function StaffOverview({
  dashboard,
  loading,
  onOpenPipeline,
  onOpenCases,
  onSelectCase,
}: {
  dashboard: StaffDashboardData | null;
  loading: boolean;
  onOpenPipeline: () => void;
  onOpenCases: () => void;
  onSelectCase: (profileId: string) => void;
}) {
  if (loading || !dashboard) return <DashboardSkeleton />;
  const { summary } = dashboard;
  const attention = dashboard.cases
    .filter((item) => item.status !== 'closed' && item.status !== 'lost')
    .filter((item) => item.attentionReasons.length > 0)
    .slice(0, 6);
  const maxPhaseCount = Math.max(
    1,
    ...STAFF_PIPELINE_PHASES.map(
      (phase) =>
        dashboard.cases.filter((item) => phaseIncludes(phase.statuses, item.status)).length,
    ),
  );

  return (
    <div className="staff-view staff-overview-view">
      <section className="staff-view-heading">
        <div>
          <p className="account-kicker">Operations overview</p>
          <h2>MRX backoffice</h2>
          <p>Portfolio health, pipeline movement, and the cases that need attention now.</p>
        </div>
        <button type="button" className="staff-primary-action" onClick={onOpenPipeline}>
          Open deals pipeline <StaffIcon name="arrow" />
        </button>
      </section>

      <section className="staff-kpi-grid" aria-label="Pipeline statistics">
        <button type="button" onClick={onOpenPipeline}>
          <span>Open opportunity value</span>
          <strong>{moneyLabel(summary.openValueCents)}</strong>
          <small>{moneyLabel(summary.valueAtRiskCents)} needs attention</small>
        </button>
        <button type="button" onClick={onOpenPipeline}>
          <span>Active deals</span>
          <strong>{summary.activeCases}</strong>
          <small>{summary.offersInFlight} offers in flight</small>
        </button>
        <button type="button" className="staff-kpi-card--attention" onClick={onOpenPipeline}>
          <span>Needs attention</span>
          <strong>{summary.needsAttention}</strong>
          <small>{summary.staleCases + summary.neverContacted} stale or never contacted</small>
        </button>
        <button type="button" onClick={onOpenPipeline}>
          <span>Ready for review</span>
          <strong>{summary.readyForReview}</strong>
          <small>{summary.recentlyContacted} contacted in the last 7 days</small>
        </button>
      </section>

      <div className="staff-overview-grid">
        <section className="staff-panel" aria-labelledby="staff-pipeline-glance-heading">
          <div className="staff-panel__heading">
            <div>
              <p className="account-kicker">Portfolio flow</p>
              <h3 id="staff-pipeline-glance-heading">Pipeline at a glance</h3>
            </div>
            <button type="button" className="staff-text-action" onClick={onOpenPipeline}>
              View pipeline
            </button>
          </div>
          <div className="staff-funnel-list">
            {STAFF_PIPELINE_PHASES.map((phase) => {
              const matching = dashboard.cases.filter((item) =>
                phaseIncludes(phase.statuses, item.status),
              );
              const value = matching.reduce(
                (sum, item) => sum + (item.opportunityValueCents ?? 0),
                0,
              );
              return (
                <div key={phase.id} className="staff-funnel-row">
                  <div>
                    <strong>{phase.label}</strong>
                    <span>{matching.length} cases</span>
                  </div>
                  <span className="staff-funnel-row__bar" aria-hidden="true">
                    <i
                      style={{ width: `${Math.max(5, (matching.length / maxPhaseCount) * 100)}%` }}
                    />
                  </span>
                  <strong>{moneyLabel(value)}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="staff-panel staff-attention-panel"
          aria-labelledby="staff-focus-heading"
        >
          <div className="staff-panel__heading">
            <div>
              <p className="account-kicker">Daily queue</p>
              <h3 id="staff-focus-heading">Needs attention</h3>
            </div>
            <span className="staff-panel-count">{summary.needsAttention}</span>
          </div>
          {attention.length ? (
            <div className="staff-focus-list">
              {attention.map((item) => (
                <button key={item.id} type="button" onClick={() => onSelectCase(item.id)}>
                  <span
                    className={`staff-rating-dot staff-rating-dot--${item.rating}`}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.attentionReasons.slice(0, 2).join(' · ')}</small>
                  </span>
                  <span>
                    <strong>{moneyLabel(item.opportunityValueCents)}</strong>
                    <small>{item.statusLabel}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="staff-empty-state">
              <StaffIcon name="attention" />
              <strong>No active exceptions</strong>
              <span>
                Urgent, stale, high-risk, unassigned, or sync-failed cases will appear here.
              </span>
            </div>
          )}
        </section>
      </div>

      <section className="staff-health-strip" aria-label="Data and sync health">
        <div>
          <StaffIcon name="sync" />
          <span>
            <strong>CRM sync health</strong>
            <small>
              {summary.ghlMappedCases} mapped · {summary.ghlSyncFailures} failures
            </small>
          </span>
        </div>
        <div>
          <StaffIcon name="owners" />
          <span>
            <strong>Assignment coverage</strong>
            <small>{summary.unassignedCases} active cases unassigned</small>
          </span>
        </div>
        <button type="button" className="staff-text-action" onClick={onOpenCases}>
          Search all owner cases <StaffIcon name="arrow" />
        </button>
      </section>
    </div>
  );
}

export function StaffPipeline({
  dashboard,
  loading,
  movingCaseId,
  onSelectCase,
  onMoveCase,
}: {
  dashboard: StaffDashboardData | null;
  loading: boolean;
  movingCaseId: string | null;
  onSelectCase: (profileId: string) => void;
  onMoveCase: (item: StaffDashboardCase, status: OwnerCaseStatus) => void;
}) {
  if (loading || !dashboard) return <DashboardSkeleton />;

  return (
    <div className="staff-view staff-pipeline-view">
      <section className="staff-view-heading">
        <div>
          <p className="account-kicker">Deals pipeline</p>
          <h2>Move opportunities forward</h2>
          <p>
            MRX status is authoritative. Approved stage changes mirror to the CRM from the server.
          </p>
        </div>
        <div className="staff-pipeline-totals" aria-label="Pipeline totals">
          <span>
            <small>Open value</small>
            <strong>{moneyLabel(dashboard.summary.openValueCents)}</strong>
          </span>
          <span>
            <small>Active</small>
            <strong>{dashboard.summary.activeCases}</strong>
          </span>
          <span className={dashboard.summary.ghlSyncFailures ? 'has-exception' : ''}>
            <small>Sync failures</small>
            <strong>{dashboard.summary.ghlSyncFailures}</strong>
          </span>
        </div>
      </section>

      <div className="staff-pipeline-board" aria-label="Owner case pipeline">
        {STAFF_PIPELINE_PHASES.map((phase) => {
          const phaseCases = dashboard.cases.filter((item) =>
            phaseIncludes(phase.statuses, item.status),
          );
          const phaseValue = phaseCases.reduce(
            (sum, item) => sum + (item.opportunityValueCents ?? 0),
            0,
          );
          return (
            <section className="staff-pipeline-column" key={phase.id}>
              <header>
                <div>
                  <span>{phaseCases.length}</span>
                  <strong>{phase.label}</strong>
                </div>
                <small>{moneyLabel(phaseValue)}</small>
                <p>{phase.description}</p>
              </header>
              <div className="staff-pipeline-column__cards">
                {phaseCases.length ? (
                  phaseCases.map((item) => (
                    <article
                      className={`staff-deal-card staff-deal-card--${item.rating}`}
                      key={item.id}
                    >
                      <div className="staff-deal-card__topline">
                        <span className={`staff-pill staff-pill--${item.rating}`}>
                          {item.rating}
                        </span>
                        <span className={`staff-priority staff-priority--${item.priority}`}>
                          {item.priority} priority
                        </span>
                      </div>
                      <button
                        type="button"
                        className="staff-deal-card__identity"
                        onClick={() => onSelectCase(item.id)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.statusLabel}</span>
                      </button>
                      <div className="staff-deal-card__value">
                        <strong>{moneyLabel(item.opportunityValueCents)}</strong>
                        <span>{item.mineralRightsCount} mineral interests</span>
                      </div>
                      <dl>
                        <div>
                          <dt>Owner</dt>
                          <dd>{item.assigneeLabel}</dd>
                        </div>
                        <div>
                          <dt>Contact</dt>
                          <dd>{contactLabel(item)}</dd>
                        </div>
                        <div>
                          <dt>CRM</dt>
                          <dd
                            className={`staff-sync-state staff-sync-state--${item.ghlSyncStatus}`}
                          >
                            {syncLabel(item.ghlSyncStatus)}
                          </dd>
                        </div>
                      </dl>
                      {item.attentionReasons.length > 0 && (
                        <div className="staff-deal-card__alerts" aria-label="Attention needed">
                          <StaffIcon name="attention" />
                          <span>{item.attentionReasons.slice(0, 2).join(' · ')}</span>
                        </div>
                      )}
                      <label className="staff-stage-control">
                        Move to stage
                        <select
                          value={item.status}
                          disabled={movingCaseId === item.id}
                          onChange={(event) =>
                            onMoveCase(item, event.target.value as OwnerCaseStatus)
                          }
                          aria-label={`Move ${item.name} to stage`}
                        >
                          {OWNER_CASE_STATUSES.map((status) => (
                            <option value={status} key={status}>
                              {ownerCaseStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="staff-deal-card__open"
                        onClick={() => onSelectCase(item.id)}
                      >
                        Open owner case <StaffIcon name="arrow" />
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="staff-empty-stage">
                    <span>No cases in this phase.</span>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
