import pdfkit

html = """<html>
<head>
    <title>Title</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        * {
            padding: 0;
            font-family: sans-serif;
            margin: 0;
        }

        html {
            font-size: 16pt;
        }
    </style>
</head>

<body lang="en-DE" style="word-wrap:break-word">
    <h1>Header</h1>
    <div class="box">
        <p><b>Foo:</b> bar</p>
        <p><b>ABC:</b> DEF</p>
    </div>
</body>
</html>"""

with open("pdfkit.pdf", "wb") as fp:
    fp.write(pdfkit.from_string(html))
