from pypdf import PdfReader, PdfWriter

reader = PdfReader("../001-trivial/minimal-document.pdf")
writer = PdfWriter()
writer.append_pages_from_reader(reader)

with open("image.png", "rb") as file:
    writer.add_attachment("image.png", file.read())
with open("with-attachment.pdf", "wb") as file:
    writer.write(file)
