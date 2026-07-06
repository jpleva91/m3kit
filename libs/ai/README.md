# @m3kit/ai

Optional, headless browser-worker AI runtime contracts for m3kit consumers.

This library is intentionally adapter-first: it ships a generic task protocol,
a `M3kAiRuntimeAdapter` seam, a deterministic fake adapter, worker harness,
warmup skip heuristics, validators, and privacy-safe telemetry helpers. It does
not download models in CI, configure hosted endpoints, or include provider
credentials.

Basic worker usage:

```ts
import { createM3kAiWorker, M3kAiFakeAdapter } from '@m3kit/ai';

createM3kAiWorker({ adapter: new M3kAiFakeAdapter() });
```

Consumers can lift this source and provide their own adapter for WebLLM,
Transformers.js, a browser-native API, or a private service. Telemetry helpers
only keep operational properties such as adapter id, task type, duration, error
class, retryable flag, and skip reason; inputs and outputs are not emitted by
default.
