from datetime import datetime

from fpdf import FPDF  # pip install fpdf2

pdf = FPDF()
pdf.set_creation_date(datetime(1990, 4, 28, 0, 0, 0))
pdf.set_creator("created by Martin Thoma")
pdf.set_producer("produced by FPDF2")
pdf.set_title("Annotated PDF")

pdf.add_page()
pdf.set_font("Helvetica", size=24)

pdf.text(x=10, y=20, txt="Some text.")
pdf.text_annotation(
    x=60,
    y=20,
    text="This is a text annotation.",
)

with pdf.highlight("Highlight comment"):
    pdf.text(50, 50, "Line 1")
    pdf.set_y(50)
    pdf.multi_cell(w=30, txt="Line 2")
pdf.cell(w=60, txt="Not highlighted", border=1)


pdf.ink_annotation(
    [(10, 120), (20, 110), (30, 120), (20, 130), (10, 120)],
    title="Lucas",
    contents="Hello world!",
)

pdf.output("annotated_pdf.pdf")
