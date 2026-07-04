import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProviderAccessBadge } from '@/components/providers/provider-access-badge';
import { ProviderFreshnessBadge } from '@/components/providers/provider-freshness-badge';
import { ProviderStatusBadge } from '@/components/providers/provider-status-badge';
import {
  WORKSPACE_EVIDENCE_ENGINE_BADGE_LABEL,
  WORKSPACE_TRUTHFULNESS_NOTICES,
} from '@/config/result-workspace';
import type {
  ProviderRecommendationResult,
  RecommendationSourceReference,
} from '@/domain/providerRecommendationEngine';
import type {
  ApiAccessStatus,
  FreshnessState,
  LifecycleStatus,
} from '@/domain/providerCatalogue';
import { WorkspaceRuleBasedBadge } from './workspace-sample-badge';

type WorkspaceProviderRecommendationsProps = {
  recommendation: ProviderRecommendationResult;
};

const STATUS_LABELS: Record<ProviderRecommendationResult['recommendationStatus'], string> = {
  recommended: 'Primary recommendation available',
  close_alternatives: 'Close alternatives — no decisive primary recommendation',
  insufficient_evidence: 'Insufficient catalogue evidence for a primary recommendation',
  no_eligible_candidate: 'No eligible provider candidate',
};

function ScorePair({ label, score }: { label: string; score: number }) {
  return (
    <p className="text-sm text-foreground">
      <span className="font-medium">{label}:</span> {score} / 100
    </p>
  );
}

function SourceLinks({ sources }: { sources: RecommendationSourceReference[] }) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {sources.map((source) => (
        <li key={source.sourceId}>
          <a
            href={source.url}
            className="text-brand underline-offset-4 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            {source.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

function CandidateCard({
  candidate,
  heading,
}: {
  candidate: NonNullable<ProviderRecommendationResult['primaryRecommendation']>;
  heading?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          {heading ? <CardTitle className="text-lg">{heading}</CardTitle> : null}
          <CardTitle className="text-lg">
            <Link
              href={`/providers/${candidate.providerId}`}
              className="text-foreground no-underline hover:text-brand"
            >
              {candidate.providerDisplayName}
            </Link>
          </CardTitle>
          <ProviderStatusBadge status={candidate.lifecycleStatus as LifecycleStatus} />
          <ProviderAccessBadge status={candidate.apiAccessStatus as ApiAccessStatus} />
          <ProviderFreshnessBadge freshness={candidate.freshness as FreshnessState} />
        </div>
        <CardDescription>
          Offering: {candidate.offeringDisplayName} ({candidate.offeringKey}) ·{' '}
          {candidate.ownershipType.replace('_', ' ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScorePair label="Evidence-backed fit" score={candidate.evidenceBackedFitScore} />
        <ScorePair label="Evidence coverage" score={candidate.evidenceCoverageScore} />

        {candidate.supportedNeeds.length > 0 ? (
          <div>
            <p className="text-sm font-medium">Supported needs</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {candidate.supportedNeeds.map((need) => (
                <li key={need}>{need}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {candidate.limitedNeeds.length > 0 ? (
          <div>
            <p className="text-sm font-medium">Limited support</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {candidate.limitedNeeds.map((need) => (
                <li key={need}>{need}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {candidate.unsupportedNeeds.length > 0 ? (
          <div>
            <p className="text-sm font-medium">Unsupported needs</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {candidate.unsupportedNeeds.map((need) => (
                <li key={need}>{need}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {candidate.explanation.evidenceGaps.length > 0 ? (
          <div>
            <p className="text-sm font-medium">Evidence gaps</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {candidate.explanation.evidenceGaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {candidate.explanation.cautions.length > 0 ? (
          <div>
            <p className="text-sm font-medium">Cautions</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {candidate.explanation.cautions.map((caution) => (
                <li key={caution}>{caution}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="text-sm font-medium">Official sources</p>
          <SourceLinks sources={candidate.explanation.sourceReferences} />
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspaceProviderRecommendations({
  recommendation,
}: WorkspaceProviderRecommendationsProps) {
  const {
    recommendationStatus,
    primaryRecommendation,
    leadingAlternatives,
    alternatives,
    supportingServices,
    insufficientEvidence,
    ineligible,
    catalogueFreshness,
    algorithmVersion,
    origin,
  } = recommendation;

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>{WORKSPACE_TRUTHFULNESS_NOTICES.recommendationNoticeTitle}</AlertTitle>
        <AlertDescription>{WORKSPACE_TRUTHFULNESS_NOTICES.recommendationNotice}</AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{STATUS_LABELS[recommendationStatus]}</Badge>
        <WorkspaceRuleBasedBadge label={WORKSPACE_EVIDENCE_ENGINE_BADGE_LABEL} />
        <span className="text-xs text-muted-foreground">
          {algorithmVersion} · {origin.replaceAll('_', ' ')}
        </span>
      </div>

      {catalogueFreshness.warnings.length > 0 ? (
        <Alert>
          <AlertTitle>Catalogue freshness</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {catalogueFreshness.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {primaryRecommendation ? (
        <CandidateCard candidate={primaryRecommendation} heading="Primary recommendation" />
      ) : null}

      {leadingAlternatives.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Leading alternatives</h3>
          {leadingAlternatives.map((candidate) => (
            <CandidateCard key={`${candidate.providerId}-${candidate.offeringId}`} candidate={candidate} />
          ))}
        </div>
      ) : null}

      {alternatives.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Other ranked candidates</h3>
          {alternatives.map((candidate) => (
            <CandidateCard key={`${candidate.providerId}-${candidate.offeringId}`} candidate={candidate} />
          ))}
        </div>
      ) : null}

      {supportingServices.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Supporting services</h3>
          <p className="text-sm text-muted-foreground">
            Specialized offerings that may address requested capabilities. These are not presented
            as primary video-generation tools unless catalogue evidence supports that role.
          </p>
          {supportingServices.map((service) => (
            <Card key={service.offeringId}>
              <CardHeader>
                <CardTitle className="text-base">
                  {service.providerDisplayName} — {service.offeringDisplayName}
                </CardTitle>
                <CardDescription>
                  Supports: {service.supportedCapabilityKeys.join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SourceLinks sources={service.explanation.sourceReferences} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {insufficientEvidence.length > 0 ? (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">Insufficient evidence candidates</summary>
          <div className="mt-4 space-y-4">
            {insufficientEvidence.map((candidate) => (
              <CandidateCard key={`${candidate.providerId}-${candidate.offeringId}`} candidate={candidate} />
            ))}
          </div>
        </details>
      ) : null}

      {ineligible.length > 0 ? (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">Ineligible candidates</summary>
          <div className="mt-4 space-y-4">
            {ineligible.map((candidate) => (
              <CandidateCard key={`${candidate.providerId}-${candidate.offeringId}`} candidate={candidate} />
            ))}
          </div>
        </details>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Recommendations are evidence-backed planning heuristics from the saved catalogue. Prompt
        Pilot has not tested providers, does not guarantee generation quality, and does not use
        live pricing or account access checks.
      </p>
    </div>
  );
}
