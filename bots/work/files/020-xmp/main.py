import io
from pathlib import Path

import fitz
from fpdf import FPDF

# Create a simple PDF using fpdf2
output = io.BytesIO()
pdf = FPDF()
pdf.add_page()
pdf.set_font("Helvetica", size=12)
pdf.cell(200, 10, txt="Hello, World!", ln=1, align="C")
pdf.output(name=output)
output.seek(0)

# Write the PDF to disk temporarily
input_filename = "input.pdf"
with open(input_filename, "wb") as f:
    f.write(output.read())

# Read the PDF into PyMuPDF
doc = fitz.open(input_filename)

# Set XMP metadata
xmp_metadata = """<?xpacket begin="\xef\xbb\xbf" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.0-c060 61.134777, 2010/02/12-17:32:00">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <rdf:Description rdf:about=""
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:pdfx='http://ns.adobe.com/pdfx/1.3/'
            dc:source="Martin Thoma"
            pdfx:other="worlds"
            pdfx:ↂ23F0="time">
            <pdfx:Style>FooBarStyle</pdfx:Style>
            <dc:creator>
                <rdf:Seq>
                    <rdf:li>John Doe</rdf:li>
                </rdf:Seq>
            </dc:creator>
            <dc:description>This is a text</dc:description>
            <dc:date>1990-04-28</dc:date>
            <dc:title>
                <rdf:Alt>
                    <rdf:li xml:lang="x-default">Sample PDF with XMP Metadata</rdf:li>
                </rdf:Alt>
            </dc:title>
        </rdf:Description>
    </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>"""

doc.set_xml_metadata(xmp_metadata)

# Write the PDF with metadata to disk
output_filename = "output_with_metadata_pymupdf.pdf"
doc.save(output_filename)
doc.close()

# Remove the temporary input file
Path(input_filename).unlink()
