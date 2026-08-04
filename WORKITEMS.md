# Work Items Log

## Technical Debt & Enhancements

- **Model Endpoint Mapping**: As of now, we are injecting auto-fetched custom models (from providers like Cerebras, Zai, etc.) directly into the `custom` endpoint so they appear in the UI. Later, we need to refactor the frontend and backend endpoint architectures so that these third-party providers (Cerebras, Zai, etc.) get natively recognized in the UI with their own dedicated endpoint tabs and routing logic.
