# Work Items Log

## Technical Debt & Enhancements

- **Model Endpoint Mapping**: As of now, we are injecting auto-fetched custom models (from providers like Cerebras, Zai, etc.) directly into the `custom` endpoint so they appear in the UI. Later, we need to refactor the frontend and backend endpoint architectures so that these third-party providers (Cerebras, Zai, etc.) get natively recognized in the UI with their own dedicated endpoint tabs and routing logic.

## Future Industrial-Grade Upgrades

- **Fully Automated CI/CD Pipelines**: Implement a GitHub Action for the `prod` branch that automatically runs security checks, builds the codebase, and hits the Render deploy webhook, creating a flawless zero-touch deployment workflow.
- **Intelligent Fallbacks & Dynamic Load Balancing**: Upgrade the current basic fallback to use Dynamic Provider Routing. If an LLM provider hits rate limits or latency spikes, seamlessly route the prompt to an equivalent backup provider (e.g., Anthropic or Google) so the end-user experiences zero downtime.
- **Semantic Caching**: Integrate a Semantic Cache using Redis or PGVector. By caching highly similar user prompts, we can serve instant responses for repeated questions, drastically reducing LLM token costs and achieving sub-millisecond response times.
- **Distributed Rate Limiting & Tiered Billing**: Implement a Redis-backed Token Bucket rate limiter to strictly throttle API abuse per-user based on their License Tier (e.g., 10 req/min for Free, 50 req/min for Pro).
- **Comprehensive Observability & Telemetry**: Integrate an observability stack (e.g., OpenTelemetry or Grafana) to create an admin dashboard that visualizes exact millisecond latency per LLM request, provider bottleneck tracking, and real-time database alerts.
