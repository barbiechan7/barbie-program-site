# -*- coding: utf-8 -*-
# slides/out/*.script.json -> 台本docx  （node slides/gen.js の後に実行）
import zipfile, html, json, glob, os, sys

OUT = os.path.join(os.path.dirname(__file__), "out")
DEST = sys.argv[1] if len(sys.argv) > 1 else OUT

def esc(s): return html.escape(s or "", quote=True)

def para(text, size=22, bold=False, italic=False, color=None, before=0, after=140):
    rpr = ""
    if size:  rpr += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    if color: rpr += f'<w:color w:val="{color}"/>'
    if bold:  rpr += '<w:b/>'
    if italic:rpr += '<w:i/>'
    rprb = f'<w:rPr>{rpr}</w:rPr>' if rpr else ''
    return (f'<w:p><w:pPr><w:spacing w:before="{before}" w:after="{after}" w:line="360" w:lineRule="auto"/>{rprb}</w:pPr>'
            f'<w:r>{rprb}<w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>')

def rule():
    return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="D6698F"/></w:pBdr><w:spacing w:after="240"/></w:pPr></w:p>'

CT = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
 '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
 '<Default Extension="xml" ContentType="application/xml"/>'
 '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
 '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
 '</Types>')
RELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
 '</Relationships>')
DRELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
 '</Relationships>')
STYLES = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
 '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
 '<w:docDefaults><w:rPrDefault><w:rPr>'
 '<w:rFonts w:ascii="Yu Gothic" w:eastAsia="Yu Gothic" w:hAnsi="Yu Gothic" w:cs="Yu Gothic"/>'
 '<w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault>'
 '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault>'
 '</w:docDefaults>'
 '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
 '</w:styles>')

MARKS = {1:"①",2:"②",3:"③",4:"④",5:"⑤",6:"⑥",7:"⑦"}
CHNAME = {1:"気づく",2:"整える"}

def build(data, dst):
    ch, n, mark, title = data["ch"], data["n"], data["mark"], data["title"]
    body = []
    body.append(para(f"第{ch}章 {CHNAME.get(ch,'')} ― {mark}「{title}」　録画用台本（スライド対応版）", size=30, bold=True, after=120))
    body.append(para("想定尺：約9〜10分／使い方：スライドを1枚ずつ表示しながら、本文を声に出して読み上げてください。（間）は一呼吸置く目安です。",
                     size=19, italic=True, color="808080", after=80))
    body.append(rule())
    for s in data["slides"]:
        body.append(para(f'▶ スライド {s["no"]} ／ {s["total"]}', size=24, bold=True, color="A84770", before=320, after=40))
        body.append(para(f'〔画面〕{s["screen"]}', size=18, italic=True, color="808080", after=120))
        if not s["lines"]:
            body.append(para("（このスライドは前後のセリフに続けて表示）", size=18, italic=True, color="A0A0A0"))
        for line in s["lines"]:
            body.append(para(line, size=22, after=140))

    DOC = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
     '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
     + "".join(body) +
     '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'
     '</w:body></w:document>')
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CT)
        z.writestr("_rels/.rels", RELS)
        z.writestr("word/document.xml", DOC)
        z.writestr("word/_rels/document.xml.rels", DRELS)
        z.writestr("word/styles.xml", STYLES)

for jf in sorted(glob.glob(os.path.join(OUT, "*.script.json"))):
    data = json.load(open(jf, encoding="utf-8"))
    key = os.path.basename(jf).replace(".script.json", "")
    dst = os.path.join(DEST, f"{key}_台本.docx")
    build(data, dst)
    print("wrote", dst)
