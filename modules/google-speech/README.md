# Google-Speech

## Requirements

Google Speech requires you to have a Google Cloud project to setup your bot.

- [Create a Google Cloud Project](https://console.cloud.google.com/)
- [Create a Google Cloud Service Account](https://cloud.google.com/speech-to-text/docs/libraries#setting_up_authentication)
- [Enable speech-to-text](https://console.cloud.google.com/marketplace/product/google/speech.googleapis.com)
- [Enable text-to-speech](https://console.cloud.google.com/marketplace/product/google/texttospeech.googleapis.com)

## Setup

### Bot-level Configuration

#### Enable the Google Speech module

- Go to the module admin page and enable `google-speech`.
- Create a config file for your bot (`data/bots/<your_bot>/config/google-speech.json`) using the content of the **global** `google-speech.json` file and prefix the `$schema` property with an additional `../` to point to the correct schema.
- Set the following properties:
  - `enabled: true`
  - `clientEmail`: You will find this value in the JSON file containing the service account keys.
  - `privateKey`: You will find this value in the JSON file containing the service account keys.
  - `projectId (Optional)`: The project ID on which the Google APIs are enabled.
  - `confidenceThreshold`: The confidence threshold used to discard text alternatives when using speech-to-text. **Must be a floating number between 0 and 1**
  - `maxAudioDuration`: The maximal duration (in seconds) allowed for an audio file when using speech-to-text.**Must be a number between 0 and 60**
  - `languageMapping`: The mapping between Botpress languages and languages in BCP-47 format recognized by Google.
  - `voiceSelection`: The type of voice the text-to-speech audio file should have. One of: "MALE", "FEMALE", "NEUTRAL".
- Restart Botpress Server to reload the configuration

## Module Limitations

Currently, only **channel-vonage** supports receiving and sending voice messages

### Speech-to-text

Currently, **this feature only supports** `ogg/obus` and `mp3` (`mpeg 1 layer 3`) audio files. When the module receives a file in a format that is not supported, a _warning_ will be displayed in the logs.

### Text-to-speech

Only sends `.mp3` files for the moment.
