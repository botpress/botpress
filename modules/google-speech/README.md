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
- Restart Botpress Server to reload the configuration
