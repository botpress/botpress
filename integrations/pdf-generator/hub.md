# Botpress PDF Conversion Integration

## Overview

This integration allows you to convert markdown and HTML content to PDF files using the PDFShift API.

## Configuration

No additional configuration is needed.

## Actions

### Markdown to PDF

Converts markdown content to a PDF file.

#### Input

- `markdown` (string): The markdown content to convert to PDF. (Required)
- `filename` (string): The filename of the PDF. Defaults to `generated.pdf`. (Optional)

#### Output

- `fileId` (string): The generated PDF file ID.
- `fileUrl` (string): The public URL to download the PDF.

### HTML to PDF

Converts an HTML document to a PDF file.

#### Input

- `html` (string): The HTML content to convert to PDF. (Required)
- `filename` (string): The filename of the PDF. Defaults to `generated.pdf`. (Optional)

#### Output

- `fileId` (string): The generated PDF file ID.
- `fileUrl` (string): The public URL to download the PDF.

## Secrets

- `PDFSHIFT_API_KEY`: The API key to use PDFShift. You can get it from [PDFShift](https://app.pdfshift.io/env/apikeys).
