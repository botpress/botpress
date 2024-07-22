import * as bp from ".botpress";
import { marked } from "marked";
import axios, { AxiosError } from "axios";

function wrapHtml(content: string, tag: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Wrapped Content</title>
</head>
<body>
  <${tag}>${content}</${tag}>
</body>
</html>`;
}

async function convertHtmlToPdf(html: string, filename: string) {
  const { data } = await axios.post(
    "https://api.pdfshift.io/v3/convert/pdf",
    {
      source: html,
      filename,
    },
    {
      headers: {
        Authorization: "Basic " + btoa("api:" + bp.secrets.PDFSHIFT_API_KEY),
      },
    }
  );

  const { data: buffer } = await axios.get(data.url, {
    responseType: "arraybuffer", // Ensures the response is treated as a binary buffer
  });

  return buffer;
}

async function uploadPdf(client: any, buffer: Buffer, filename: string) {
  const { file } = await client.uploadFile({
    key: filename,
    accessPolicies: ["public_content"],
    content: buffer,
    contentType: "application/pdf",
    index: false,
  });

  return {
    fileId: file.id,
    fileUrl: file.url!,
  };
}

async function fromHtmlFunction(
  client: any,
  html: string,
  filename: string,
  logger: any
) {
  try {
    logger.forBot().info("Converting HTML to PDF");

    const buffer = await convertHtmlToPdf(html, filename);
    const result = await uploadPdf(client, buffer, filename);

    return result;
  } catch (error) {
    if (error instanceof AxiosError) {
      logger
        .forBot()
        .error(JSON.stringify(error.response?.data ?? {}, null, 2));
    } else {
      logger.forBot().error(error);
    }
    throw new Error("Failed to convert HTML to PDF: " + error);
  }
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    fromHtml: async ({ client, input, logger }) => {
      const { html, filename = "generated.pdf" } = input;
      return fromHtmlFunction(client, html, filename, logger);
    },
    fromMarkdown: async ({ client, input, logger }) => {
      try {
        logger.forBot().info("Converting markdown to PDF");
        const { markdown, filename = "generated.pdf" } = input;

        // Convert markdown to HTML
        const html = wrapHtml(await marked.parse(markdown), "div");

        // Reuse the fromHtml function
        return fromHtmlFunction(client, html, filename, logger);
      } catch (error) {
        logger.forBot().error("Failed to convert markdown to PDF: " + error);
        throw error;
      }
    },
  },
  channels: {},
  handler: async () => {},
});
