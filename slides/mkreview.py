# -*- coding: utf-8 -*-
# slides/out/*.script.json -> レビュー用docx（スライド表示文＋読み上げ＋メモ欄）
import zipfile, html, json, glob, os, sys

OUT = os.path.join(os.path.dirname(__file__), "out")
DEST = sys.argv[1] if len(sys.argv) > 1 else OUT

def esc(s): return html.escape(s or "", quote=True)

def para(text="", size=22, bold=False, italic=False, color=None, before=0, after=120, ind=0, border=False):
    rpr = ""
    if size:  rpr += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    if color: rpr += f'<w:color w:val="{color}"/>'
    if bold:  rpr += '<w:b/>'
    if italic:rpr += '<w:i/>'
    rprb = f'<w:rPr>{rpr}</w:rPr>' if rpr else ''
    pbdr = '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="6" w:color="C8C8C8"/></w:pBdr>' if border else ''
    inds = f'<w:ind w:left="{ind}"/>' if ind else ''
    run = f'<w:r>{rprb}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>' if text else ''
    return (f'<w:p><w:pPr>{pbdr}<w:spacing w:before="{before}" w:after="{after}" w:line="336" w:lineRule="auto"/>{inds}{rprb}</w:pPr>{run}</w:p>')

def rule(color="D6698F", sz=8):
    return f'<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="{sz}" w:space="4" w:color="{color}"/></w:pBdr><w:spacing w:after="200"/></w:pPr></w:p>'

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
 '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="336" w:lineRule="auto"/></w:pPr></w:pPrDefault>'
 '</w:docDefaults>'
 '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
 '</w:styles>')

CHNAME = {1: "気づく", 2: "整える"}

def build(data, dst):
    ch, mark, title = data["ch"], data["mark"], data["title"]
    body = []
    body.append(para(f'第{ch}章 {CHNAME.get(ch,"")} ― {mark}「{title}」　レビュー用', size=30, bold=True, after=100))
    body.append(para('スライドの表示文・読み上げ・構成、どこでも直してください。変更履歴（校閲→変更履歴の記録）をONにすると分かりやすいです。'
                     'スライドを増やす／減らす／順番入れ替えは【メモ欄】に一言でOK。', size=18, italic=True, color="808080", after=60))
    body.append(rule())
    for s in data["slides"]:
        body.append(para(f'▶ スライド {s["no"]} ／ {s["total"]}', size=25, bold=True, color="A84770", before=360, after=60))

        body.append(para('【スライドに表示される文字】', size=19, bold=True, color="A84770", after=40))
        if s["display"]:
            for d in s["display"]:
                body.append(para(d, size=21, ind=360, after=40))
        else:
            body.append(para('（表示要素なし）', size=19, italic=True, color="A0A0A0", ind=360))

        body.append(para('【読み上げ】', size=19, bold=True, color="A84770", before=120, after=40))
        if s["lines"]:
            for l in s["lines"]:
                body.append(para(l, size=21, ind=360, after=100))
        else:
            body.append(para('（前後のセリフに続けて表示。読み上げ無し）', size=19, italic=True, color="A0A0A0", ind=360))

        body.append(para('【メモ欄】', size=19, bold=True, color="808080", before=120, after=40))
        for _ in range(2):
            body.append(para('', after=200, border=True))

    DOC = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
     '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
     + "".join(body) +
     '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'
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
    dst = os.path.join(DEST, f"{key}_レビュー.docx")
    build(data, dst)
    print("wrote", dst)
