# VOXSENSE AI — ULTIMATE GOD MODE MASTER PROMPT V2.0
## Production-Quality Speech Emotion Recognition | Full-Stack AI | Zero-Silent-Failure Engineering

### YOUR ROLE

Act as a principal AI/ML engineer, senior full-stack architect, speech-processing researcher, UX designer, DevOps engineer, and rigorous QA automation engineer working together on a competition-quality academic project.

You are responsible for designing, implementing, testing, debugging, and documenting a complete, runnable application — not merely generating a design, tutorial, prototype, or collection of code snippets.

Work directly in the current Antigravity workspace. Inspect the workspace, create and edit actual files, install appropriate dependencies, run the application, execute tests, inspect failures, fix root causes, and verify the final result using available terminal and browser tools.

Do not stop after generating a plan or displaying code. Continue until the implementation and verification are complete or a clearly documented external blocker prevents completion.

---

# 1. PROJECT IDENTITY

Project name: VoxSense AI

Full title: VoxSense AI — Intelligent Speech Emotion Recognition and Acoustic Analysis Platform

Domain: Artificial Intelligence, Machine Learning, Deep Learning, Digital Signal Processing, Human-Computer Interaction.

Primary objective:
Recognize emotion-related patterns in human speech audio using a genuine, locally runnable machine-learning pipeline.

The system must support:
1. Live microphone recording in the browser.
2. Uploading previously recorded audio files.
3. Audio playback and recording preview.
4. Real model inference through the backend.
5. Emotion classification and confidence visualization.
6. Analysis history and downloadable prediction reports.
7. Model status, API health, and useful diagnostics.
8. Responsive, accessible, professional user experience.

Supported emotion classes must match the trained model's actual label mapping. For a RAVDESS-based model, support its applicable classes: neutral, calm, happy, sad, angry, fearful, disgust, and surprised. Do not claim support for an emotion that the selected dataset or trained model does not contain.

This is a research and educational tool. Emotion predictions are uncertain interpretations of vocal patterns, not definitive measurements of a person's internal mental state.

# 2. NON-NEGOTIABLE ENGINEERING RULES

- Build a complete, working application with frontend, backend, model pipeline, tests, and documentation.
- Use real model inference, never hardcoded predictions, fake confidence scores, random labels, or fabricated success messages.
- Never display a successful prediction until the backend has returned a valid, schema-checked result.
- Never swallow exceptions or silently ignore failed requests.
- Never use mock inference as a substitute for the real model in the production prediction flow.
- If a trained model is unavailable, show a clear model-not-ready state and explain how to train or load it.
- Never download an unknown model or dataset from an unverified source.
- Do not fabricate accuracy, precision, recall, F1 score, test results, or benchmark claims.
- Do not overwrite unrelated existing files without inspecting them first.
- Keep secrets, API keys, credentials, and private configuration out of source control.
- Do not add unnecessary paid APIs, external inference dependencies, or mandatory cloud services.
- Prefer deterministic, reproducible local inference.
- Maintain a clear separation between frontend, API, preprocessing, model training, and evaluation.
- Do not declare the project complete until the available verification suite has been run and its results documented.

# 3. REQUIRED TECHNOLOGY STACK

Use this stack unless an actual compatibility issue justifies a documented alternative.

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- A maintained icon library such as Lucide
- Recharts for appropriate analytics
- A robust accessible component system
- Browser MediaRecorder and Web Audio APIs

Backend:
- Python 3.11 or another compatible, verified Python version
- FastAPI
- Uvicorn
- Pydantic
- NumPy
- librosa
- soundfile
- SciPy where needed
- scikit-learn for evaluation and baselines
- PyTorch for the deep-learning model
- pytest and HTTPX for backend testing

Use compatible dependency versions. Pin tested versions in dependency files. Check the installed Python and Node.js versions before choosing packages.

The application must run locally without requiring a third-party AI API.

Do not introduce a database server unless it is justified. For the initial version, use browser local storage for non-sensitive UI preferences and optional local analysis history. Make persistence behavior explicit.

# 4. VISUAL DESIGN — PREMIUM COMPETITION STANDARD

Create a distinctive, polished, premium AI research dashboard.

Design direction:
- Dark navy and graphite foundation.
- Carefully restrained violet and cyan accents.
- Elegant typography and generous spacing.
- Subtle gradients and glass effects only where appropriate.
- Crisp waveform and audio visualization.
- Consistent borders, shadows, radii, and iconography.
- Clear information hierarchy and professional chart styling.
- Smooth, purposeful transitions.
- Light/dark theme support if practical.
- Fully responsive desktop, tablet, and mobile layouts.

Avoid:
- Generic template appearance.
- Excessive neon effects.
- Overcrowded dashboard cards.
- Fake charts populated with invented data.
- Decorative controls that do nothing.
- Emoji-heavy navigation.
- Excessive animations or animations that interfere with accessibility.

The result should look like a polished commercial AI analytics product suitable for a college project demonstration and technical judging.

# 5. APPLICATION PAGES

Build the following functional pages.

## A. Overview Dashboard

Display:
- Product name and concise explanation.
- Backend connectivity indicator.
- Model readiness and model version.
- Audio analysis workspace shortcut.
- Actual session analysis count, if available.
- Recent completed analyses.
- Genuine model evaluation metrics only when evaluation data exists.
- Helpful first-run instructions.
- Clear empty, loading, success, and error states.

Do not present invented accuracy percentages or fabricated historical analyses.

## B. Emotion Analysis Studio

This is the primary application page.

Provide two input methods:

Tab 1 — Record Audio:
- Request microphone permission only after an explicit user action.
- Show microphone permission and device errors clearly.
- Show a live recording indicator and elapsed time.
- Provide Start, Stop, Cancel/Discard, and Record Again controls.
- Enforce a configurable maximum recording duration.
- Collect MediaRecorder data chunks correctly.
- Wait for the final dataavailable event before constructing the final Blob.
- Reject empty or unusably short recordings.
- Release microphone tracks when recording is stopped, cancelled, or the component unmounts.
- Preserve the finished recording until the user replaces or discards it.
- Show the actual recording duration and detected MIME type.
- Provide playback before analysis.
- Disable duplicate recording and prediction actions while their operations are running.

Tab 2 — Upload Audio:
- Provide a drag-and-drop area and standard file picker.
- Accept documented audio formats such as WAV, WebM, OGG, MP3, and M4A only where the installed backend decoders can actually support them.
- Validate file size, extension, media type, readability, and duration.
- Never trust a filename extension alone.
- Show a useful error when a file is empty, corrupt, unsupported, or contains no usable audio.
- Display filename, file size, duration when available, and a playback preview.
- Allow the user to replace or remove the selected file.
- Preserve the selected Blob or File until analysis is completed.

Shared analysis workflow:
1. Select or record audio.
2. Validate the input.
3. Preview the audio.
4. Click Analyze Emotion.
5. Display actual processing status.
6. Send the audio to the backend.
7. Validate the returned response.
8. Render the real prediction.
9. Offer a retry option if the request fails.

The same backend inference function must serve both microphone recordings and uploaded files.

## C. Prediction Results

Show:
- Primary predicted emotion.
- Confidence score, clearly labelled as model confidence.
- Class-wise probability distribution if the model produces valid probabilities.
- A clean horizontal probability chart.
- Model identifier and version.
- Audio duration and processing time when measured.
- A brief, non-diagnostic explanation of the result.
- A visible warning if the prediction is low-confidence or out-of-distribution detection is unavailable.
- A way to analyze another audio sample.

Ensure percentages sum appropriately after rounding. Never confuse model confidence with the probability that the person's true internal emotion matches the prediction.

Do not produce a result if the API response is malformed or the inference operation failed.

## D. Analysis History

Provide:
- Recent analyses from actual completed requests.
- Timestamp, predicted class, confidence, and input method.
- View details, remove an item, and clear history.
- Optional re-analysis when the corresponding audio file is still available.

Do not persist raw audio automatically. Make audio retention opt-in and explain the behavior.

If an audio file is unavailable, do not pretend that a history item can be replayed or re-analyzed.

## E. Model Information

Show:
- Architecture.
- Dataset used.
- Number of emotion classes.
- Sample rate and feature configuration.
- Training status.
- Model artifact availability.
- Evaluation metrics with provenance.
- Limitations and known failure modes.

Clearly distinguish training-set, validation-set, and held-out test-set metrics.

## F. Settings and Diagnostics

Include:
- Backend URL configuration where appropriate.
- Backend health status.
- Model readiness status.
- Audio format support information.
- Clear cache/history controls.
- A diagnostics panel with safe, actionable error messages.

Never display secret environment variables, filesystem secrets, or sensitive server internals.

# 6. ROBUST MICROPHONE RECORDING

This section is critical.

Implement recording using browser-supported MediaRecorder APIs correctly.

Requirements:

1. Check for navigator.mediaDevices, getUserMedia, MediaRecorder, and required browser capabilities.
2. Explain that microphone access normally requires HTTPS or localhost.
3. Request audio permission only after the user clicks Record.
4. Catch and distinguish permission-denied, missing-device, device-busy, unsupported-browser, and unexpected failures.
5. Check candidate recording formats with MediaRecorder.isTypeSupported() before using them.
6. Use the actual MediaRecorder.mimeType for the recorded Blob.
7. Do not assume every browser supports audio/webm, audio/mp4, or audio/wav recording.
8. Maintain a single recording lifecycle state machine:
   idle, requesting_permission, recording, stopping, ready, analyzing, success, error.
9. Prevent overlapping recording sessions.
10. Reset audio chunks at the correct lifecycle boundary.
11. Handle dataavailable, stop, error, and component cleanup correctly.
12. Construct the final Blob only after recording has fully stopped and final data has been collected.
13. Check that the Blob has a nonzero size and can be played.
14. Stop every MediaStream track after recording ends or is cancelled.
15. Revoke obsolete object URLs when no longer needed.
16. Avoid stale React state, stale closures, race conditions, and duplicate event handlers.
17. Do not depend on arbitrary fixed delays to wait for recording completion.
18. If the recording is silent or too short, show a helpful warning rather than a misleading result.
19. Never silently change the recording's file extension without actually converting the bytes.
20. Test repeated recording sessions, including record-stop-record, cancellation, and failure recovery.

Use MediaRecorder events and promises carefully. Ensure the final audio is not lost because the last dataavailable event arrives after the user clicks Stop.

# 7. AUDIO FORMAT NORMALIZATION

Build one canonical backend preprocessing pipeline for every input source.

Important:
Browser recordings can use WebM/Opus, OGG, MP4/AAC, or other browser-supported formats. These are not interchangeable with WAV merely because their filenames are renamed.

Implement the following:

1. Read uploaded bytes safely.
2. Validate the file container and decode the actual audio.
3. Detect decoding failures and unsupported codecs.
4. Use installed audio libraries to decode supported formats.
5. Convert successfully decoded audio to a canonical mono floating-point waveform.
6. Resample with an appropriate signal-processing library to the sample rate required by the trained model.
7. Reject NaN, infinity, empty waveforms, invalid dimensions, and corrupted data.
8. Handle clipping, very low amplitude, excessive duration, and silence carefully.
9. Apply the same preprocessing parameters during training, validation, and inference.
10. Never independently implement different MFCC extraction rules for training and prediction.
11. Avoid blindly normalizing every sample, as doing so may amplify noise.
12. Avoid trimming or padding in a way that destroys meaningful temporal information.
13. Use a configurable duration policy with clear user-facing errors.
14. Do not treat arbitrary binary bytes as valid audio.

If an audio format requires an external decoder, verify that decoder availability during startup and document the dependency. Provide a useful unsupported-format error if decoding is unavailable.

Use WAV as the preferred canonical interchange format where appropriate, but do not assume the browser can record WAV natively.

# 8. REAL SPEECH EMOTION MODEL

Implement a genuine, reproducible deep-learning training and inference pipeline.

Recommended baseline:
- Input: decoded mono audio.
- Features: MFCCs with a documented configuration.
- Additional optional features: delta MFCCs, delta-delta MFCCs, RMS energy, spectral centroid, and zero-crossing rate.
- Model: CNN or CNN-BiLSTM classifier.
- Output: logits converted to a valid probability distribution for the trained class labels.

Use a documented, configurable sample rate, number of MFCC coefficients, hop length, window length, sequence length, and normalization strategy.

Ensure feature tensor dimensions remain consistent across training and inference.

Create modular components:
- audio loading and validation
- preprocessing
- feature extraction
- model definition
- dataset loader
- training loop
- validation and evaluation
- model checkpoint saving/loading
- inference service

Dataset options:
- RAVDESS as a recommended starting point.
- TESS or EMO-DB as alternative datasets when legally and practically available.

Dataset requirements:
- Never assume dataset files already exist.
- Document the expected directory structure and filename conventions.
- Do not silently fabricate training samples.
- Provide a clear setup process for obtaining a dataset from its legitimate source.
- Do not make the web application download large datasets automatically.
- Parse emotion labels from filenames using validated mappings.
- Reject unknown labels instead of assigning them arbitrary classes.
- Handle speaker-independent evaluation where the dataset supports it.
- Prevent data leakage between training and evaluation partitions.

Training requirements:
- Support CPU training.
- Detect GPU availability where applicable.
- Set reproducible random seeds where practical.
- Use validation-based checkpoint selection.
- Save model weights, class labels, feature configuration, preprocessing version, and training metadata together.
- Save checkpoints atomically to avoid corrupt partial artifacts.
- Keep the inference model compatible with the installed PyTorch version.
- Include a clear training command and configuration file.
- Never claim that training succeeded unless the process actually completed.

Evaluation requirements:
- Held-out test split.
- Accuracy.
- Macro precision, macro recall, and macro F1.
- Per-class precision and recall.
- Confusion matrix.
- Class distribution.
- Explicit limitations concerning speaker, accent, noise, recording quality, and dataset bias.

Do not advertise a performance threshold as guaranteed. Report the measured result, the split methodology, and the evaluation sample count.

If a trained artifact does not exist, the API must remain honest about model readiness. Provide a clear training workflow and an example of the expected model artifact structure.

# 9. BACKEND API CONTRACT

Build a versioned FastAPI backend.

Required endpoints:

GET /api/v1/health
- Returns service status and API version.

GET /api/v1/model/status
- Returns whether the model is loaded, the model version, supported classes, and safe readiness information.

POST /api/v1/predict
- Accepts multipart/form-data with one documented audio file field.
- Validates the request and input.
- Decodes and preprocesses audio.
- Runs real inference.
- Returns a documented, typed JSON response.

GET /api/v1/model/info
- Returns safe model metadata and feature configuration.

Use one shared Pydantic response schema.

The prediction response should include:
- request_id
- predicted_emotion
- confidence
- probabilities
- model_version
- audio_duration_seconds
- processing_time_ms

Optional metadata must be clearly defined. Do not return NaN or Infinity in JSON.

API behavior:
- Return suitable 4xx responses for invalid client input.
- Return clear 503 responses when the model is not ready.
- Return controlled server errors for unexpected inference failures.
- Do not expose stack traces, file paths, secrets, or raw internal exceptions to the client.
- Log unexpected errors server-side with a request ID.
- Use safe, consistent JSON error responses.
- Enforce file-size, duration, and request limits.
- Clean up temporary files even when processing fails.
- Do not write uploads to arbitrary filesystem paths.
- Configure CORS for the actual frontend origin.
- Avoid wildcard CORS when credentials are enabled.
- Keep inference operations from blocking the event loop unnecessarily.
- Load the model once at application startup when possible.
- Use inference mode for PyTorch predictions.
- Validate the output shape, finite logits, class mapping, and probability sum.
- Do not fabricate a successful prediction when inference fails.

Use environment variables for configurable host, port, file limits, and allowed origins. Provide a safe example environment file without real secrets.

# 10. FRONTEND-BACKEND INTEGRATION

This is another critical requirement.

Create one centralized API client rather than duplicating fetch logic across components.

Requirements:
- Read the backend base URL from a documented configuration variable.
- Provide a sensible local-development default.
- Construct the prediction endpoint consistently.
- Use FormData for audio uploads.
- Append the file under exactly the field name expected by FastAPI.
- Never manually set the multipart Content-Type header when sending browser FormData; allow the browser to set its boundary.
- Do not send JSON when the endpoint expects multipart/form-data.
- Do not send a Blob without the expected filename when the backend requires a file upload.
- Parse JSON error responses safely.
- Handle non-JSON responses without crashing.
- Distinguish HTTP errors from network failures, timeouts, and aborts.
- Set a configurable request timeout.
- Abort obsolete requests when the user replaces an input or navigates away.
- Prevent duplicate submissions.
- Keep the current input intact after a recoverable failure.
- Allow retry without requiring a new recording.
- Validate prediction response fields and types before rendering.
- Reject malformed probability distributions.
- Display meaningful progress and error states.
- Never show an infinite loading spinner after a failed request.
- Verify backend reachability using a health endpoint.
- Do not confuse a failed health check with a definitive absence of the backend; show the correct diagnostic.
- Avoid automatic retry loops.
- Only retry safe, explicitly permitted operations with bounded attempts.
- Never automatically submit a prediction multiple times without user intent.

Create a single predictable state model for the selected audio, recording state, request state, and result.

The UI must clearly distinguish:
idle, recording, audio_ready, validating, analyzing, success, and error.

# 11. ERROR HANDLING AND USER-FRIENDLY DIAGNOSTICS

Implement explicit messages for common failure scenarios.

Examples:

Microphone permission denied:
"Microphone access was denied. Allow microphone access in your browser settings and try again."

No microphone found:
"No microphone was detected. Connect or enable a microphone, or upload an audio file instead."

Unsupported recording format:
"This browser cannot record in the required format. Try another supported browser or upload an audio file."

Empty recording:
"No usable audio was captured. Record again and speak clearly for a few seconds."

Unsupported audio file:
"This audio format could not be decoded. Try a supported WAV, WebM, OGG, MP3, or M4A file."

Backend unavailable:
"The analysis service is currently unreachable. Check that the backend is running and that its configured URL is correct."

Model not trained:
"The emotion model is not ready. Follow the model training instructions before running predictions."

Invalid model response:
"The analysis service returned an invalid response. Your audio is preserved; you can retry or check diagnostics."

Timeout:
"Analysis took too long. Your selected audio has been preserved. Please retry."

These messages must correspond to real error conditions. Do not map every failure to "Network error."

Implement structured server logging and useful development diagnostics. Do not log raw audio contents, credentials, or unnecessary personal data.

# 12. TESTING — MANDATORY

Build and run an automated verification suite.

Backend unit tests:
- Audio decoding for supported formats.
- Empty and corrupted files.
- Invalid media content with a misleading extension.
- Unsupported codec handling.
- Silent and extremely short audio.
- Excessive file size and duration.
- NaN, infinity, and invalid waveform dimensions.
- Feature extraction shape and numerical validity.
- Model checkpoint loading.
- Model-not-ready behavior.
- Probability vector shape, finite values, and normalization.
- Invalid label mapping.
- Prediction response schema.
- Temporary-file cleanup.
- Safe error responses.
- Health and model-status endpoints.

Backend integration tests:
- Valid audio request with a real loaded test model.
- Invalid file upload.
- Model unavailable.
- Decoder failure.
- Inference failure.
- Correct multipart field name.
- Correct HTTP status codes.
- Repeated requests without state leakage.

Frontend tests:
- Recording state transitions.
- Microphone permission denial.
- Unsupported MediaRecorder.
- Empty recording rejection.
- Final dataavailable handling.
- Audio preview creation.
- Upload validation.
- Correct FormData construction.
- Duplicate submission prevention.
- Loading state cleanup after failure.
- Timeout and retry behavior.
- Malformed API response handling.
- Result rendering from real response data.
- Preservation of selected audio after recoverable failures.

End-to-end browser tests, preferably with Playwright:
- Launch the frontend and backend.
- Check the dashboard and API health.
- Upload a valid, known test WAV.
- Run a real prediction using a trained test fixture model.
- Confirm that a valid prediction result appears.
- Upload an invalid file and confirm that a useful error appears.
- Test the recording flow using browser-provided fake media where supported.
- Verify that recording can stop, preview, and submit.
- Verify that the user can recover from an error and run another prediction.
- Check browser console errors and failed network requests.

Never depend on a physical microphone being present in CI. Use browser permission controls and fake media devices where supported, then separately document manual microphone testing.

Use a tiny synthetic audio signal only for software plumbing and decoder-independent unit tests. Never treat synthetic test audio as genuine emotion-labelled training data or claim that it validates real emotion recognition.

If a trained research dataset is unavailable, test the API and inference pipeline using a clearly labelled test fixture model. Keep that fixture separate from the production model and ensure it cannot accidentally appear as a real trained emotion model in the UI.

Run the tests, fix the bugs, and rerun the affected tests. Report exact pass/fail counts and any untested areas.

# 13. SECURITY AND PRIVACY

- Process audio locally through the configured backend by default.
- Do not upload audio to third-party services.
- Do not save raw recordings unless the user explicitly requests a supported retention feature.
- Validate file size, media decoding, and request limits.
- Keep CORS restrictive and configurable.
- Avoid unsafe filesystem paths and arbitrary filename use.
- Use safe error messages.
- Do not expose internal tracebacks to end users.
- Ensure uploaded files are cleaned up after processing.
- Explain any local history or audio retention behavior.
- Do not use the system to identify a speaker's identity.
- Do not present predictions as medical diagnoses, lie detection, or definitive psychological assessments.

# 14. PROJECT STRUCTURE

Create a clean structure similar to:

vox-sense-ai/
  frontend/
    src/
      components/
      pages/
      hooks/
      services/
      types/
      utils/
    tests/
    package.json
    .env.example
  backend/
    app/
      api/
      core/
      schemas/
      services/
      audio/
      models/
    tests/
    requirements.txt
    .env.example
  ml/
    configs/
    data/
    scripts/
    training/
    evaluation/
    artifacts/
  docs/
    ARCHITECTURE.md
    API.md
    DATASET_SETUP.md
    TESTING.md
    TROUBLESHOOTING.md
  scripts/
  .gitignore
  README.md

Adjust the structure only when a clear technical reason exists.

Do not commit datasets, large generated audio files, local virtual environments, secrets, or oversized model artifacts to source control.

# 15. DOCUMENTATION AND DEVELOPER EXPERIENCE

Create a comprehensive README containing:
- Project overview.
- Architecture diagram.
- Features.
- Technology stack.
- Prerequisites.
- Exact installation commands.
- Frontend startup commands.
- Backend startup commands.
- Dataset setup.
- Model training commands.
- Model artifact location.
- Prediction API example.
- Test commands.
- Troubleshooting.
- Privacy notes.
- Limitations.
- Evaluation methodology.

Provide a Windows PowerShell-friendly setup path because the project may be developed on Windows.

Use separate terminals for frontend and backend where appropriate.

Provide commands that match the actual filenames, virtual environment paths, ports, and configuration used in the implementation. Do not document commands that have not been verified.

Include an architecture diagram using Mermaid in the documentation.

# 16. IMPLEMENTATION PHASES

Execute these phases in order.

PHASE 1 — Workspace inspection and planning
- Inspect the existing workspace.
- Check installed Python, Node.js, npm, and Git versions.
- Identify dependency and browser compatibility constraints.
- Write a concise implementation plan.
- Establish a clear architecture and API contract.

PHASE 2 — Working end-to-end vertical slice
- Create the backend.
- Implement health and model-status endpoints.
- Implement audio upload and validation.
- Build the frontend upload interface.
- Connect the frontend to the backend.
- Verify a real request-response cycle.
- Establish explicit model-not-ready behavior.

PHASE 3 — Genuine model pipeline
- Implement preprocessing and MFCC extraction.
- Implement model architecture and dataset loading.
- Implement training, evaluation, and checkpoint handling.
- Validate loading and inference with a real trained artifact when available.
- Clearly document any dataset prerequisite that prevents actual training.

PHASE 4 — Recording and audio lifecycle
- Implement microphone recording.
- Verify correct Blob construction.
- Add preview, cancel, retry, and re-record functionality.
- Test recording and uploaded audio through the same inference endpoint.

PHASE 5 — Professional UI and result visualization
- Build the premium dashboard.
- Add actual prediction results and probability visualization.
- Add history, model information, and diagnostics.
- Add responsive layouts and accessibility.

PHASE 6 — Automated testing and debugging
- Run backend tests.
- Run frontend tests.
- Run integration tests.
- Run available browser end-to-end tests.
- Inspect terminal logs and browser console.
- Fix root causes, not merely symptoms.
- Repeat failed tests after each relevant fix.

PHASE 7 — Final verification and handoff
- Verify documented startup commands.
- Verify the health endpoint.
- Verify a complete prediction flow.
- Verify invalid input handling.
- Verify recovery after failures.
- Generate a concise test report.
- Document actual limitations and remaining blockers.

Do not skip a phase because the UI looks finished.

# 17. DEFINITION OF DONE

The project is complete only when the following can be demonstrated:

[ ] Frontend starts successfully.
[ ] Backend starts successfully.
[ ] API health endpoint returns a valid response.
[ ] Model readiness is reported truthfully.
[ ] Valid supported audio can be uploaded.
[ ] Invalid audio is rejected with a useful message.
[ ] Microphone recording works in a supported browser and secure context.
[ ] Recording completion preserves the final audio chunk.
[ ] Recording preview plays correctly.
[ ] Saved recordings can be submitted without invalid-file errors when their format is supported.
[ ] Both input methods use the same preprocessing and inference pipeline.
[ ] A genuinely trained model produces real inference results when its artifact is installed.
[ ] A missing model never produces a fake successful prediction.
[ ] Prediction results match the backend response.
[ ] Failed requests stop loading indicators and preserve recoverable input.
[ ] Users can retry without repeating the entire recording.
[ ] No duplicate requests occur from repeated clicks.
[ ] Automated tests are executed and results are documented.
[ ] Browser console and server logs are inspected.
[ ] Setup and troubleshooting documentation match the implementation.

If any item cannot be completed because a dataset, trained model, browser capability, or external prerequisite is missing, state the exact blocker and provide the appropriate next step. Do not falsely mark the item as passed.

# 18. FINAL EXECUTION INSTRUCTIONS

Start by inspecting the workspace and creating the implementation plan.

Then implement the actual application phase by phase. Use terminal tools to run commands and tests, and use the browser agent to inspect the application when available.

Do not stop at the plan, architecture, mockup, or initial implementation.

After implementation:
1. Run the frontend and backend.
2. Execute the available automated tests.
3. Exercise real upload-to-prediction flow with a valid test model.
4. Exercise error and recovery flows.
5. Fix discovered issues.
6. Rerun relevant tests.
7. Report what works, what was tested, the exact test results, and what remains blocked.

Be transparent about real model training, dataset availability, and actual measured accuracy.

The priority order is:

CORRECTNESS > RELIABILITY > REAL INFERENCE > TESTABILITY > SECURITY > USABILITY > VISUAL POLISH.

Build VoxSense AI as a genuine, maintainable, technically defensible speech emotion recognition project — not a fake AI demo.

Begin now by inspecting the workspace, then proceed through implementation and verification without waiting for unnecessary approval between routine development steps.