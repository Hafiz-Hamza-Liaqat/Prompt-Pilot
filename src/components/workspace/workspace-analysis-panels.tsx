import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  labelAccessStatus,
  labelConfidenceClassification,
  labelReferenceKind,
  labelReferencePlatform,
  labelTranscriptSource,
} from '@/config/workspace-analysis-labels';
import type { AnalysisViewModel } from '@/domain/workspace/analysis-display';

type WorkspaceAnalysisPanelsProps = {
  analysis: AnalysisViewModel;
};

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return (
    <p>
      <span className="font-medium text-foreground">{label}:</span> {value}
    </p>
  );
}

function ConfidenceBadge({ classification }: { classification?: string }) {
  if (!classification) {
    return null;
  }

  return (
    <Badge variant="outline" className="ml-2">
      {labelConfidenceClassification(classification)}
    </Badge>
  );
}

export function WorkspaceAnalysisPanels({ analysis }: WorkspaceAnalysisPanelsProps) {
  const { metadata, media, transcript, timeline, scenes, story, hooks, audience, cta, camera, editing, safety, summary } =
    analysis;

  const platformLabel = labelReferencePlatform(metadata.platform);

  return (
    <div className="space-y-6">
      <AlertNotice notice={safety.transformationNotice} />

      <Card>
        <CardHeader>
          <CardTitle>Analysis summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <DetailRow label="Reference kind" value={labelReferenceKind(summary.referenceKind)} />
          <DetailRow label="Pipeline version" value={summary.pipelineVersion} />
          <DetailRow
            label="Analysis version"
            value={`v${summary.version.analysisVersion}${summary.version.isLatest ? ' (latest)' : ''}`}
          />
          <DetailRow label="Created" value={formatTimestamp(summary.createdAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reference metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <DetailRow label="Title" value={metadata.title} />
          <DetailRow label="Platform" value={platformLabel} />
          <DetailRow label="Author" value={metadata.authorLabel} />
          <DetailRow
            label="Duration"
            value={metadata.durationSeconds ? `${metadata.durationSeconds}s` : null}
          />
          <DetailRow label="Aspect ratio" value={metadata.aspectRatio} />
          <DetailRow label="Language" value={metadata.language} />
          <DetailRow label="Access" value={labelAccessStatus(metadata.accessStatus)} />
          {metadata.canonicalUrl ? (
            <p className="sm:col-span-2">
              <span className="font-medium text-foreground">Canonical URL:</span>{' '}
              <a
                href={metadata.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand no-underline hover:text-brand/80"
              >
                Open reference link
              </a>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <DetailRow label="Media kind" value={media.mediaKind} />
          {media.resolution ? (
            <DetailRow
              label="Resolution"
              value={`${media.resolution.width}×${media.resolution.height}`}
            />
          ) : null}
          <DetailRow label="Frame rate" value={media.frameRate ? `${media.frameRate} fps` : null} />
          <DetailRow label="Video track" value={media.hasVideoTrack ? 'Present' : 'Absent'} />
          <DetailRow label="Audio track" value={media.hasAudioTrack ? 'Present' : 'Absent'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <DetailRow
            label="Source"
            value={
              transcript.transcriptSource
                ? labelTranscriptSource(transcript.transcriptSource)
                : null
            }
          />
          <DetailRow label="Language" value={transcript.transcriptLanguage} />
          {transcript.transcriptText ? (
            <p className="whitespace-pre-wrap rounded-md border border-border p-3 text-foreground">
              {transcript.transcriptText}
            </p>
          ) : (
            <p>No transcript text is available for this reference.</p>
          )}
          {transcript.transcriptSegments && transcript.transcriptSegments.length > 0 ? (
            <ul className="space-y-2">
              {transcript.transcriptSegments.map((segment, index) => (
                <li key={index} className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    {formatDurationMs(segment.startMs)} – {formatDurationMs(segment.endMs)}
                  </p>
                  <p className="mt-1 text-foreground">{segment.text}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <DetailRow label="Total duration" value={formatDurationMs(timeline.totalDurationMs)} />
          <DetailRow label="Pacing" value={timeline.pacingLabel} />
          <DetailRow
            label="Average shot length"
            value={
              timeline.averageShotLengthMs
                ? formatDurationMs(timeline.averageShotLengthMs)
                : null
            }
          />
          {timeline.segments.length > 0 ? (
            <ul className="space-y-2">
              {timeline.segments.map((segment, index) => (
                <li key={index} className="rounded-md border border-border p-3">
                  <p className="font-medium text-foreground">{segment.label}</p>
                  <p className="text-xs">
                    {formatDurationMs(segment.startMs)} – {formatDurationMs(segment.endMs)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No timeline segments recorded.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reference scenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <DetailRow label="Scene count" value={String(scenes.sceneCount)} />
          {scenes.sceneSegments.length > 0 ? (
            <ul className="space-y-2">
              {scenes.sceneSegments.map((segment) => (
                <li key={segment.index} className="rounded-md border border-border p-3">
                  <p className="font-medium text-foreground">
                    {segment.roleLabel}
                    <ConfidenceBadge classification={segment.confidence} />
                  </p>
                  <p className="text-xs">
                    {formatDurationMs(segment.startMs)} – {formatDurationMs(segment.endMs)}
                  </p>
                  <p className="mt-1">{segment.summary}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No reference scene segments recorded.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Story and messaging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <DetailRow label="Narrative structure" value={story.narrativeStructure} />
          <DetailRow label="Story summary" value={story.storySummary} />
          <DetailRow label="Message theme" value={story.messageTheme} />
          <DetailRow label="Hook pattern" value={hooks.hookPattern} />
          <DetailRow label="Hook summary" value={hooks.hookSummary} />
          <DetailRow label="Inferred audience" value={audience.inferredAudience} />
          {audience.audienceSignals.length > 0 ? (
            <div>
              <p className="font-medium text-foreground">Audience signals</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {audience.audienceSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <DetailRow label="CTA present" value={cta.ctaPresent ? 'Yes' : 'No'} />
          <DetailRow label="CTA pattern" value={cta.ctaPattern} />
          <DetailRow label="CTA summary" value={cta.ctaSummary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Camera and editing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
          <ListBlock title="Framing patterns" items={camera.framingPatterns} />
          <ListBlock title="Movement patterns" items={camera.movementPatterns} />
          <ListBlock title="Angle patterns" items={camera.anglePatterns} />
          <ListBlock title="Subject placement" items={camera.subjectPlacement} />
          <ListBlock title="Transition styles" items={editing.transitionStyles} />
          <div>
            <p className="font-medium text-foreground">Editing rhythm</p>
            <p className="mt-1">Cut rate: {editing.cutRate}</p>
            <p>Rhythm: {editing.rhythmLabel}</p>
            <p>
              On-screen text:{' '}
              {editing.onScreenTextPresence.present ? 'Present' : 'Not detected'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertNotice({ notice }: { notice: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
      {notice}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return (
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-muted-foreground">None recorded.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
