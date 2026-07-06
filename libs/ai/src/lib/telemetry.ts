import { M3kAiTelemetryEvent, M3kAiTelemetrySink } from './protocol';

const ALLOWED_PROPERTY_KEYS = new Set([
  'adapterId',
  'durationMs',
  'errorClass',
  'retryable',
  'skipReason',
  'state',
  'taskType',
]);

export const noopM3kAiTelemetrySink: M3kAiTelemetrySink = () => undefined;

export function redactM3kAiTelemetry(event: M3kAiTelemetryEvent): M3kAiTelemetryEvent {
  const properties: M3kAiTelemetryEvent['properties'] = {};
  for (const [key, value] of Object.entries(event.properties ?? {})) {
    if (ALLOWED_PROPERTY_KEYS.has(key)) properties[key] = value;
  }
  return { name: event.name, properties };
}

export function createM3kAiTelemetrySink(sink: M3kAiTelemetrySink = noopM3kAiTelemetrySink): M3kAiTelemetrySink {
  return (event) => sink(redactM3kAiTelemetry(event));
}
