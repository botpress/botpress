# Events, images and voice

Run `pnpm start 24` from `examples` after the shared setup. It sends three short turns to Luna:

1. An application event (`gallery.opened`) with a structured payload.
2. An image attachment using the included red, green, and blue sample panels.
3. A voice transcript asking about the middle panel, with a speech-ready response.

`session.append()` queues each input; `execute()` processes it. Events are labeled data in native user messages and remain events in `session.transcript`. Image attachments become native image parts. The local PNG is sent as a data URL, so no image hosting is required. Set `IMAGE_URL` to use your own image.

By default, the last turn uses a mocked speech-to-text transcript. Set `AUDIO_URL` to a supported, accessible recording URL to send real audio instead; Cognitive performs transcription. Its transcription model defaults to `fast` and can be selected with `options.transcriptionModel`. Actual audio transcription can add provider cost.

The `speech` response preset produces text suitable for speech synthesis. This example prints it; it does not record a microphone or generate audio. In an application, route the response handler to your TTS service. Authorize any event-driven business actions in your tool handlers.

`inputs.test.ts` verifies the native event, image, voice-transcript, and raw-audio representations without network calls.
