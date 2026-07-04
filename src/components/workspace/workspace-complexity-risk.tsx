import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  WORKSPACE_COMPLEXITY_RISK_NOTICE,
  WORKSPACE_DETERMINISTIC_BADGE_LABEL,
} from '@/config/result-workspace';
import {
  ASSESSMENT_LEVEL_LABELS,
  COMPLEXITY_RISK_ALGORITHM_VERSION,
  type AssessmentFactor,
  type ComplexityRiskAssessment,
} from '@/domain/complexityRiskAssessment';

type WorkspaceComplexityRiskProps = {
  assessment: ComplexityRiskAssessment;
};

function levelBadgeVariant(level: keyof typeof ASSESSMENT_LEVEL_LABELS) {
  switch (level) {
    case 'low':
      return 'secondary' as const;
    case 'moderate':
      return 'outline' as const;
    case 'high':
      return 'default' as const;
    case 'very_high':
      return 'destructive' as const;
  }
}

function FactorList({ factors }: { factors: AssessmentFactor[] }) {
  if (factors.length === 0) {
    return <p className="text-sm text-muted-foreground">No positive factors contributed.</p>;
  }

  return (
    <ul className="space-y-3">
      {factors.map((factor) => (
        <li key={factor.key} className="rounded-md border border-border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">{factor.label}</p>
            <Badge variant="outline">+{factor.points}</Badge>
          </div>
          <p className="mt-1 text-muted-foreground">{factor.rationale}</p>
        </li>
      ))}
    </ul>
  );
}

function ScoreMeter({
  label,
  score,
  levelLabel,
}: {
  label: string;
  score: number;
  levelLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-2xl font-semibold text-foreground">
          {score} / 100
        </p>
        <Badge variant="outline">{levelLabel}</Badge>
      </div>
      <meter
        aria-label={`${label}: ${score} out of 100, ${levelLabel}`}
        min={0}
        max={100}
        low={25}
        high={75}
        optimum={0}
        value={score}
        className="h-2 w-full"
      />
    </div>
  );
}

export function WorkspaceComplexityRisk({ assessment }: WorkspaceComplexityRiskProps) {
  const { complexity, executionRisk } = assessment;

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Deterministic planning assessment</AlertTitle>
        <AlertDescription>{WORKSPACE_COMPLEXITY_RISK_NOTICE}</AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{WORKSPACE_DETERMINISTIC_BADGE_LABEL}</Badge>
        <span>Algorithm {COMPLEXITY_RISK_ALGORITHM_VERSION}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production complexity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreMeter
            label="Production complexity"
            score={complexity.score}
            levelLabel={ASSESSMENT_LEVEL_LABELS[complexity.level]}
          />
          <FactorList factors={complexity.contributions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Execution risk</CardTitle>
            <Badge variant={levelBadgeVariant(executionRisk.level)}>
              {ASSESSMENT_LEVEL_LABELS[executionRisk.level]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreMeter
            label="Execution risk"
            score={executionRisk.score}
            levelLabel={ASSESSMENT_LEVEL_LABELS[executionRisk.level]}
          />
          {executionRisk.wasCapped ? (
            <Alert>
              <AlertTitle>Score capped at 100</AlertTitle>
              <AlertDescription>
                Raw execution-risk total was {executionRisk.rawScore}. The displayed score uses the
                100-point cap.
              </AlertDescription>
            </Alert>
          ) : null}
          <FactorList factors={executionRisk.contributions} />
        </CardContent>
      </Card>
    </div>
  );
}
