# Examples module

Here you will find an example module for botpress.

## Bot templates

[Bot-templates](./src/bot-templates) folder contains a starting point for creating a new bot. You will find there `actions`, `content-elements`, `flows` and `config`.

### Weatherbot

To test your weatherbot you have to set API-key for [openweathermap.org](https://openweathermap.org).

1. Sign up or sign in to the [openweathermap.org](https://openweathermap.org).
2. Copy your API-key from [the following page](https://home.openweathermap.org/api_keys).
3. Add API-key to configuration file which is located here: `<BOTPRESS-DIR>/data/global/config/examples.json`.

    ```json
    {
      …
      "openWeatherApiKey": "<YOUR API-Key here>",
      …
    }
    ```

## Configuration

To enable `example` module, turn it on in `<BOTPRESS-DIR>/data/global/botpress.config.json` file.

  ```json
  {
    …
    "modules": [
      …
      {
        "location": "MODULES_ROOT/examples",
        "enabled": true
      },
      …
    ],
    …
  }
  ```
