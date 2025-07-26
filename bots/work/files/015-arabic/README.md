# Arabic script for testing text extraction

`habibi.pdf` was generated using weasyprint 54.1-3 on debian unstable in July 2022, using the following command:

```bash
weasyprint habibi.html habibi.pdf
```

See also https://github.com/py-pdf/pypdf/issues/1111

# CMap Structure

`habibi-oneline-cmap.pdf` is the same file, but the `beginbfchar` stanza of the `ToUnicode` CMap is written with ASCII space delimiters between `<srcString> <dstString>` pairings, rather than newlines.  That is, where `habibi.pdf` contains:

```
6 beginbfchar
<0003> <>
<03f2> <>
<0392> <>
<03f4> <>
<02f4> <>
<03a3> <062d064e0628064a0628064a0020>
endbfchar
```

`habibi-oneline-cmap.pdf` contains:

```
6 beginbfchar
<0003> <> <03f2> <> <0392> <> <03f4> <> <02f4> <> <03a3> <062d064e0628064a0628064a0020>
endbfchar
```

Otherwise the two files are exactly identical.

I believe text extraction should behave the same way on both files.
From what i understand of the PDF specification, they are syntactically equivalent.
