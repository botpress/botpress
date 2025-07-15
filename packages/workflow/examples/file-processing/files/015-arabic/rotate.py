from pypdf import PdfReader, PdfWriter

reader = PdfReader("habibi.pdf")
writer = PdfWriter()
page = reader.pages[0]

page.rotate(90)

writer.add_page(page)

page.rotate(90)

writer.add_page(page)

page.rotate(90)

writer.add_page(page)

page.rotate(90)

writer.add_page(page)


with open("habibi-rotated.pdf", "wb") as fp:
    writer.write(fp)
