---
id: hosting
title: Hosting NLU Servers
---

--------------------

Botpress communicates with two services to work correctly: Duckling and a Language Server. If your Botpress installation has no internet access, you'll have to host these services on-prem. When following the different hosting methods, look for a section on on-prem hosting for further details.

## Duckling

We use Duckling to extract system entities (time, email, currency, etc.). This service is very light and requires minimal resources.

### Hosting Duckling on Linux and Mac

On these two Operating Systems, Duckling must be compiled. Therefore, you will need to install the software development tools and build from the source.

Please follow the instructions on the [GitHub page of Duckling](https://github.com/facebook/duckling). We may provide some binaries in the future for common OS'.

### Hosting Duckling on Windows

If you run Botpress on Windows, there is a `.zip` file available [here](https://s3.amazonaws.com/botpress-binaries/tools/duckling/duckling-windows.zip).
Double-click on `run-duckling.bat` (the `bat` file sets the console's code page to UTF-8, then runs the executable). The folder `zoneinfo` includes the Olson timezones, which are already available by default on other OS.

### Configuring your Chatbot

When you have successfully installed the duckling binary, edit the file `data/global/config/nlu.json` and set the parameter `ducklingURL` to where you run Duckling, for example, if it's on the same server as Botpress (and if you use the default port of `8000`), you will set:

```json
{
  ...
  "ducklingURL": "http://localhost:8000"
}
```

## Language Server

The Language Server is used to provide the language models necessary to run the NLU. It is quite resource-intensive to host a language server due to the model sizes. To make it easy to get started, the default installation uses a Botpress-hosted Language Server. You can swap it out for your own (see below). 

:::note
The NLU server is not the same as the language server, and uses the models provided by the language server.
:::

By default, Botpress configures the Language Server to get `100` dimensions for words. If you plan to use that Language Server in production, we highly recommend setting the dimensions to `300` for a better vocabulary.

| Dimensions | RAM Usage    | Disk Usage    |
| ---------- | ------------ | ------------- |
| 100        | about 1.3 Gb |  about 900 Mb |
| 300        | about 3.5 Gb |   about 3 Gb  |

All of this is per language.

### Installing a Language Library

1. Open this metadata file: https://botpress-public.nyc3.digitaloceanspaces.com/embeddings/index.json.
2. Download the `bpe` and `embeddings` files corresponding to your languages. For instance, for French, download the `bp.fr.bpe.model` file located under `remoteUrl` and the `bp.fr.300.bin` also located under `remoteUrl`.
3. Once the files are downloaded, place them somewhere on your server filesystem and take note of the path.
4. Add the `--offline` and the `--dim < number >` arguments to your command when starting the language server. i.e. `./bp lang --offline --dim <number> --langDir <some_path>`. Ensure that the dimension argument matches the dimensions of the models you have downloaded, e.g., `bp.en.300.bin` (Please note that you have to run this command in a directory that contains a functional copy of the Botpress binary).

:::note
`300` is the number of dimensions the model has. More dimensions mean the model size is bigger. You can choose a lighter model if your server specs are limited, but keep in mind that you need to change the `--dim` parameter when you start the Language Server (e.g. `./bp lang --dim < number >`).
:::

| Abbreviation | Language   |
| ------------ | ---------- |
| ar           | Arabic     |
| en           | English    |
| fr           | French     |
| ja           | Japanese   |
| pt           | Portuguese |
| ru           | Russian    |
| de           | German     |
| es           | Spanish    |
| he           | Hebrew     |
| it           | Italian    |
| nl           | Dutch      |
| pl           | Polish     |

### Running your Language Server

The language server is embedded in Botpress and can be started using the command line. Here are the steps to run it and use it with your Botpress Server:

1. Start the language server with `./bp lang`.
2. In `data/global/config/nlu.json`, change `languageSources.endpoint` to `http://localhost:3100`.
3. Restart Botpress and open the Languages page on the Admin.
4. Install the desired languages your server should support.
5. Restart the language server with parameters `./bp lang --readOnly`.

:::note
`ReadOnly` prevents anyone from adding or removing languages and can only be used to fetch embeddings. There are additional parameters that can be configured (for example, to require authentication); you can see them by typing `./bp lang help`.
:::