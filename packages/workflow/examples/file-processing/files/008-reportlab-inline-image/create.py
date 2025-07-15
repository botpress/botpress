from reportlab.pdfgen import canvas

c = canvas.Canvas("inline-image.pdf")
c.drawInlineImage("smile.png", 100, 100, 100, 100)
c.drawString(200, 100, "Test")
c.showPage()
c.save()
