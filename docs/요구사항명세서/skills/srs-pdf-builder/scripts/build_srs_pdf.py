#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path


@dataclass
class MarkdownTable:
    title: str
    caption: str
    rows: list[tuple[str, str]]


@dataclass
class DataTable:
    name: str
    caption: str
    headers: list[str]
    rows: list[list[str]]


MD_IMAGE_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]*)\})?")
MD_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
MD_TABLE_CAPTION_RE = re.compile(r"^\s*Table:\s*(.+?)\s*$")


def die(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def tex_escape(text: str) -> str:
    text = text.replace("\\", r"\textbackslash{}")
    text = text.replace("&", r"\&")
    text = text.replace("%", r"\%")
    text = text.replace("$", r"\$")
    text = text.replace("#", r"\#")
    text = text.replace("_", r"\_")
    text = text.replace("{", r"\{")
    text = text.replace("}", r"\}")
    text = text.replace("~", r"\textasciitilde{}")
    text = text.replace("^", r"\textasciicircum{}")
    return text


def strip_md(text: str) -> str:
    text = re.sub(r"^#+\s*", "", text.strip())
    text = text.replace("**", "").replace("__", "")
    text = re.sub(r"`([^`]+)`", r"\1", text)
    return text.strip()


def split_cells(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [cell.strip() for cell in line.split("|")]


def is_separator(line: str) -> bool:
    cells = split_cells(line)
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", c.strip()) for c in cells)


def parse_frontmatter(md: str) -> tuple[dict[str, str], str]:
    if not md.startswith("---\n"):
        return {}, md
    end = md.find("\n---", 4)
    if end == -1:
        return {}, md
    raw = md[4:end].strip()
    data: dict[str, str] = {}
    for line in raw.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            data[key.strip()] = value.strip().strip('"')
    return data, md[end + 4 :].lstrip()


def section_between(md: str, start: str, end: str | None) -> str:
    start_match = re.search(rf"^{re.escape(start)}\s*$", md, flags=re.M)
    if not start_match:
        return ""
    start_i = start_match.end()
    if end is None:
        return md[start_i:].strip()
    end_match = re.search(rf"^{re.escape(end)}\s*$", md[start_i:], flags=re.M)
    end_i = start_i + end_match.start() if end_match else len(md)
    return md[start_i:end_i].strip()


def parse_markdown_table(lines: list[str], i: int) -> tuple[list[str], list[list[str]], int]:
    headers = split_cells(lines[i])
    if i + 1 >= len(lines) or not is_separator(lines[i + 1]):
        return [], [], i
    rows: list[list[str]] = []
    i += 2
    while i < len(lines) and lines[i].strip().startswith("|"):
        rows.append(split_cells(lines[i]))
        i += 1
    return headers, rows, i


def heading_text(raw: str) -> str:
    return strip_md(re.sub(r"^#{1,6}\s*", "", raw).strip())


def extract_usecase_name(heading: str) -> str:
    match = re.match(r"^UC-\d+\s+(.+)$", strip_md(heading))
    return match.group(1).strip() if match else strip_md(heading)


def infer_table_caption(heading_stack: list[tuple[int, str]], headers: list[str]) -> str:
    current_heading = heading_stack[-1][1] if heading_stack else ""
    current_heading = strip_md(current_heading)
    if current_heading == "Definitions, Acronyms, and Abbreviation":
        first_header = strip_md(headers[0]).lower() if headers else ""
        if "acronym" in first_header:
            return "Table of acronyms and abbreviations"
        if "term" in first_header:
            return "Table of terms and definitions"
    return current_heading


def table_column_spec(column_count: int) -> str:
    if column_count == 2:
        return r"@{}>{\RaggedRight\arraybackslash}m{0.26\linewidth}>{\RaggedRight\arraybackslash}m{0.62\linewidth}@{}"
    if column_count == 3:
        return r"@{}>{\RaggedRight\arraybackslash}m{0.22\linewidth}>{\RaggedRight\arraybackslash}m{0.18\linewidth}>{\RaggedRight\arraybackslash}X@{}"
    if column_count == 4:
        return r"@{}>{\RaggedRight\arraybackslash}m{0.23\linewidth}>{\RaggedRight\arraybackslash}m{0.10\linewidth}>{\RaggedRight\arraybackslash}m{0.18\linewidth}>{\RaggedRight\arraybackslash}X@{}"
    return "@{}" + ">{\\RaggedRight\\arraybackslash}X" * column_count + "@{}"


def render_table_cell(value: str, column_index: int) -> str:
    raw = strip_md(value).replace("\n", " ").strip()
    return tex_escape(raw)


def render_table_latex(
    headers: list[str],
    rows: list[list[str]],
    caption: str,
    title_row: str | None = None,
) -> str:
    cols = table_column_spec(len(headers))
    header_cells = []
    for idx, h in enumerate(headers):
        text = f"\\textbf{{{tex_escape(strip_md(h))}}}"
        if idx == 0 and len(headers) == 4:
            header_cells.append(
                f"\\multicolumn{{1}}{{>{{\\RaggedRight\\arraybackslash}}m{{0.23\\linewidth}}}}{{{text}}}"
            )
        elif idx == 0 and len(headers) == 3:
            header_cells.append(
                f"\\multicolumn{{1}}{{>{{\\RaggedRight\\arraybackslash}}m{{0.22\\linewidth}}}}{{{text}}}"
            )
        elif idx == 0 and len(headers) == 2:
            header_cells.append(
                f"\\multicolumn{{1}}{{>{{\\RaggedRight\\arraybackslash}}m{{0.26\\linewidth}}}}{{{text}}}"
            )
        else:
            header_cells.append(f"\\multicolumn{{1}}{{c}}{{{text}}}")
    header_row = " & ".join(header_cells) + r" \\"
    body_rows = []
    for row in rows:
        padded = (row + [""] * len(headers))[: len(headers)]
        cells = []
        first_key = strip_md(padded[0]) if padded else ""
        for idx, cell in enumerate(padded):
            if len(headers) == 2 and strip_md(headers[0]) == "Item" and first_key == "Normal Course" and idx == 1:
                cells.append(normal_course_to_tex(cell))
            else:
                cells.append(render_table_cell(cell, idx))
        body_rows.append(" & ".join(cells) + r" \\")
    return (
        "\\begin{table}[H]\n"
        "\\centering\n"
        "\\small\n"
        "\\setlength{\\tabcolsep}{5pt}\n"
        "\\begin{tabularx}{\\linewidth}{"
        + cols
        + "}\n"
        + "\\toprule\n"
        + (
            "\\multicolumn{"
            + str(len(headers))
            + "}{c}{\\textbf{"
            + tex_escape(strip_md(title_row))
            + "}} \\\\\n\\midrule\n"
            if title_row
            else ""
        )
        + header_row
        + "\n\\midrule\n"
        + "\n\\midrule\n".join(body_rows)
        + "\n\\bottomrule\n"
        + "\\end{tabularx}\n"
        + "\\caption{"
        + tex_escape(strip_md(caption))
        + "}\n"
        + "\\end{table}"
    )


def render_document_history_table(headers: list[str], rows: list[list[str]], caption: str) -> str:
    header = (
        "\\multicolumn{1}{>{\\centering\\arraybackslash}p{0.14\\linewidth}}{\\textbf{"
        + tex_escape(strip_md(headers[0]))
        + "}} & "
        "\\multicolumn{1}{>{\\centering\\arraybackslash}p{0.10\\linewidth}}{\\textbf{"
        + tex_escape(strip_md(headers[1]))
        + "}} & "
        "\\multicolumn{1}{>{\\RaggedRight\\arraybackslash}X}{\\textbf{"
        + tex_escape(strip_md(headers[2]))
        + "}} & "
        "\\multicolumn{1}{>{\\centering\\arraybackslash}p{0.14\\linewidth}}{\\textbf{"
        + tex_escape(strip_md(headers[3]))
        + "}} \\\\"
    )
    body_rows = []
    for row in rows:
        padded = (row + [""] * len(headers))[: len(headers)]
        body_rows.append(
            " & ".join(
                [
                    f"\\multicolumn{{1}}{{>{{\\centering\\arraybackslash}}p{{0.14\\linewidth}}}}{{{render_table_cell(padded[0], 0)}}}",
                    f"\\multicolumn{{1}}{{>{{\\centering\\arraybackslash}}p{{0.10\\linewidth}}}}{{{render_table_cell(padded[1], 1)}}}",
                    f"\\multicolumn{{1}}{{>{{\\RaggedRight\\arraybackslash}}X}}{{{render_table_cell(padded[2], 2)}}}",
                    f"\\multicolumn{{1}}{{>{{\\centering\\arraybackslash}}p{{0.14\\linewidth}}}}{{{render_table_cell(padded[3], 3)}}}",
                ]
            )
            + r" \\"
        )
    return (
        "\\begin{table}[H]\n"
        "\\centering\n"
        "\\footnotesize\n"
        "\\setlength{\\tabcolsep}{4pt}\n"
        "\\renewcommand{\\arraystretch}{1.08}\n"
        "\\begin{tabularx}{\\linewidth}{@{}>{\\centering\\arraybackslash}p{0.14\\linewidth}>{\\centering\\arraybackslash}p{0.10\\linewidth}>{\\RaggedRight\\arraybackslash}X>{\\centering\\arraybackslash}p{0.14\\linewidth}@{}}\n"
        "\\toprule\n"
        + header
        + "\n\\midrule\n"
        + "\n\\midrule\n".join(body_rows)
        + "\n\\bottomrule\n\\end{tabularx}\n\\caption{"
        + tex_escape(strip_md(caption))
        + "}\n\\end{table}"
    )


def replace_tables_with_latex(md_text: str, table_title_rows: set[str] | None = None) -> str:
    lines = md_text.splitlines()
    out: list[str] = []
    heading_stack: list[tuple[int, str]] = []
    pending_caption: str | None = None
    pending_title_row: tuple[int, str] | None = None
    in_data_dictionary = False
    in_external_interface = False
    in_use_case_section = False
    current_usecase_name: str | None = None
    i = 0

    def flush_pending_title_row() -> None:
        nonlocal pending_title_row
        if pending_title_row is not None:
            level, text = pending_title_row
            out.append(f"{'#' * level} {text}")
            pending_title_row = None

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped == "" and pending_title_row is not None:
            out.append(line)
            i += 1
            continue

        if pending_title_row is not None and stripped and not stripped.startswith("|") and not MD_HEADING_RE.match(stripped):
            flush_pending_title_row()

        heading_match = MD_HEADING_RE.match(stripped)
        if heading_match:
            level = len(heading_match.group(1))
            text = heading_text(heading_match.group(2))
            heading_stack = [(lvl, txt) for lvl, txt in heading_stack if lvl < level]
            heading_stack.append((level, text))
            if level == 2:
                in_external_interface = text == "External Interface Requirements"
            if text == "Data Dictionary":
                in_data_dictionary = True
            elif text == "Data Flow Diagram":
                in_data_dictionary = False
            if level == 3:
                if text == "Use Case":
                    in_use_case_section = True
                else:
                    in_use_case_section = False
                    current_usecase_name = None
            if in_use_case_section and level == 4:
                current_usecase_name = extract_usecase_name(text)

            if in_use_case_section and level == 4:
                i += 1
                continue

            if (in_data_dictionary and level == 4) or (table_title_rows and text in table_title_rows):
                pending_title_row = (level, text)
            elif in_external_interface and level == 4:
                i += 1
                continue
            else:
                flush_pending_title_row()
                out.append(line)
            i += 1
            continue

        caption_match = MD_TABLE_CAPTION_RE.match(stripped)
        if caption_match:
            pending_caption = caption_match.group(1).strip()
            i += 1
            continue

        if stripped.startswith("|"):
            headers, rows, next_i = parse_markdown_table(lines, i)
            if headers and rows:
                normalized_headers = [strip_md(h) for h in headers]
                caption = pending_caption or infer_table_caption(heading_stack, headers)
                if caption == "Document History":
                    out.append(render_document_history_table(headers, rows, caption))
                    pending_caption = None
                    i = next_i
                    continue
                if in_use_case_section and current_usecase_name and len(headers) == 2 and normalized_headers[:2] == ["Item", "Content"]:
                    caption = pending_caption or current_usecase_name
                    out.append(
                        render_table_latex(
                            ["Use case name", current_usecase_name],
                            rows,
                            caption,
                        )
                    )
                    pending_caption = None
                    i = next_i
                    continue
                title_row = None
                if pending_title_row is not None:
                    title_row = pending_title_row[1]
                    pending_title_row = None
                out.append(render_table_latex(headers, rows, caption, title_row=title_row))
                pending_caption = None
                i = next_i
                continue

        flush_pending_title_row()
        out.append(line)
        i += 1

    flush_pending_title_row()
    return "\n".join(out)


def parse_use_cases(sec: str) -> list[MarkdownTable]:
    part = section_between(sec, "### 3.2.1 Use Case", "### 3.2.2 Use Case Diagram")
    lines = part.splitlines()
    tables: list[MarkdownTable] = []
    i = 0
    while i < len(lines):
        if lines[i].strip().startswith("|"):
            headers, rows, next_i = parse_markdown_table(lines, i)
            row_pairs = [(r[0], r[1]) for r in rows if len(r) >= 2]
            caption = ""
            j = next_i
            while j < len(lines):
                s = lines[j].strip()
                if s.startswith("Table "):
                    caption = s.split(":", 1)[1].strip() if ":" in s else s
                    break
                if s.startswith("|"):
                    break
                j += 1
            title = next((v for k, v in row_pairs if k == "Use case name"), caption)
            if title:
                tables.append(MarkdownTable(title=title, caption=caption or title, rows=row_pairs))
            i = max(j + 1, next_i)
        else:
            i += 1
    return tables


def parse_data_tables(sec: str) -> list[DataTable]:
    part = section_between(sec, "### 3.2.3 Data Dictionary", "### 3.2.4 Data Flow Diagram")
    lines = part.splitlines()
    tables: list[DataTable] = []
    i = 0
    current_name = ""
    while i < len(lines):
        s = lines[i].strip()
        if s.startswith("#### "):
            current_name = strip_md(s)
            i += 1
            continue
        if s.startswith("|"):
            headers, rows, next_i = parse_markdown_table(lines, i)
            caption = current_name
            j = next_i
            while j < len(lines):
                t = lines[j].strip()
                if t.startswith("Table "):
                    caption = t.split(":", 1)[1].strip() if ":" in t else caption
                    break
                if t.startswith("#### ") or t.startswith("|"):
                    break
                j += 1
            if headers and rows:
                tables.append(DataTable(current_name or caption, caption, headers, rows))
            i = max(j + 1, next_i)
        else:
            i += 1
    return tables


def first_paragraph_after_heading(sec: str, heading: str) -> str:
    part = section_between(sec, heading, None)
    lines: list[str] = []
    for line in part.splitlines():
        s = line.strip()
        if not s:
            if lines:
                break
            continue
        if s.startswith("#"):
            break
        lines.append(s)
    return " ".join(lines)


def parse_bullets(part: str) -> list[str]:
    return [line.strip()[2:].strip() for line in part.splitlines() if line.strip().startswith("- ")]


def fenced_text(part: str) -> str:
    m = re.search(r"```(?:text)?\n(.*?)```", part, flags=re.S)
    return m.group(1).strip("\n") if m else ""


def markdown_image_refs(text: str) -> list[tuple[str, str]]:
    refs: list[tuple[str, str]] = []
    for match in MD_IMAGE_RE.finditer(text):
        alt = match.group(1).strip()
        target = match.group(2).strip().split()[0].strip("<>")
        if target:
            refs.append((alt, target))
    return refs


def resolve_image_path(target: str, source_dir: Path) -> Path:
    path = Path(target)
    if not path.is_absolute():
        path = source_dir / path
    return path.resolve()


def copy_image_assets(md_text: str, source_dir: Path, out_dir: Path) -> None:
    seen: set[str] = set()
    for _, target in markdown_image_refs(md_text):
        if target in seen:
            continue
        seen.add(target)
        src = resolve_image_path(target, source_dir)
        if not src.exists():
            die(f"Image file not found: {src}")
        dst = (out_dir / target).resolve()
        dst.parent.mkdir(parents=True, exist_ok=True)
        if src != dst:
            shutil.copy2(src, dst)


def extract_cover_and_body(md_text: str) -> tuple[str, str, str]:
    lines = md_text.splitlines()
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    title = ""
    subtitle = ""
    if i < len(lines) and lines[i].startswith("# "):
        title = strip_md(lines[i])
        i += 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines) and lines[i].startswith("## "):
        subtitle = strip_md(lines[i])
        i += 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    body = "\n".join(lines[i:])
    return title, subtitle, body


def inject_table_captions(md_text: str) -> str:
    lines = md_text.splitlines()
    out: list[str] = []
    in_usecase = False
    in_datadict = False
    last_heading = ""
    i = 0

    def capture_table(start: int) -> tuple[list[str], int]:
        block: list[str] = []
        j = start
        while j < len(lines) and lines[j].strip().startswith("|"):
            block.append(lines[j])
            j += 1
        return block, j

    while i < len(lines):
        line = lines[i]
        s = line.strip()

        if s.startswith("### 3.2.1 Use Case"):
            in_usecase = True
            in_datadict = False
            last_heading = ""
            out.append(line)
            i += 1
            continue
        if s.startswith("### 3.2.2 Use Case Diagram"):
            in_usecase = False
            out.append(line)
            i += 1
            continue
        if s.startswith("### 3.2.3 Data Dictionary"):
            in_usecase = False
            in_datadict = True
            last_heading = ""
            out.append(line)
            i += 1
            continue
        if s.startswith("### 3.2.4 Data Flow Diagram"):
            in_datadict = False
            out.append(line)
            i += 1
            continue
        if s.startswith("#### ") and (in_usecase or in_datadict):
            last_heading = strip_md(s)
            out.append(line)
            i += 1
            continue

        if s.startswith("|") and (in_usecase or in_datadict):
            table_lines, next_i = capture_table(i)
            out.extend(table_lines)

            j = next_i
            while j < len(lines) and not lines[j].strip():
                j += 1
            has_caption = j < len(lines) and re.match(r"^\s*Table\s*:", lines[j]) is not None
            if not has_caption and last_heading:
                out.append("")
                out.append(f"Table: {last_heading}")
            i = next_i
            continue

        out.append(line)
        i += 1

    return "\n".join(out)


def preprocess_markdown_for_pandoc(md_text: str, table_title_rows: set[str] | None = None) -> tuple[str, str, str]:
    title, subtitle, body = extract_cover_and_body(md_text)
    body = replace_tables_with_latex(body, table_title_rows=table_title_rows)
    body = replace_markdown_images_with_figures(body)
    body = style_reference_links(body)
    body = re.sub(r"(?m)^(\s*)Table\s+\S+:\s*(.+)$", r"\1Table: \2", body)
    body = body.replace("<br />", r"\newline ")
    body = body.replace("<br/>", r"\newline ")
    body = body.replace("<br>", r"\newline ")
    return title, subtitle, body


def pandoc_markdown_to_latex(md_text: str, source_dir: Path) -> str:
    if shutil.which("pandoc") is None:
        die("pandoc not found. Install pandoc to build the full Markdown document.")
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as tmp:
        tmp.write(md_text)
        tmp_path = Path(tmp.name)
    try:
        result = subprocess.run(
            [
                "pandoc",
                "--from=markdown+raw_tex+raw_html+table_captions",
                "--to=latex",
                "--wrap=preserve",
                f"--resource-path={source_dir}",
                str(tmp_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout
    finally:
        tmp_path.unlink(missing_ok=True)


def normal_course_to_tex(value: str) -> str:
    pieces = re.split(r"<br\s*/?>", value)
    items: list[str] = []
    for piece in pieces:
        piece = strip_md(piece)
        piece = re.sub(r"^\d+\.\s*", "", piece).strip()
        if piece:
            items.append(piece)
    if not items:
        return tex_escape(strip_md(value))
    body = "\n".join(f"  \\item {tex_escape(item)}" for item in items)
    return (
        "\\begin{minipage}[t]{\\linewidth}\n"
        "\\begin{enumerate}\n"
        + body
        + "\n\\end{enumerate}\n"
        "\\vspace{0.35em}\n"
        "\\end{minipage}"
    )


def table_cell_tex(value: str, column_index: int) -> str:
    raw = strip_md(value)
    return tex_escape(raw)


def usecase_tex(tables: list[MarkdownTable]) -> str:
    chunks: list[str] = []
    for table in tables:
        rows = []
        for key, value in table.rows:
            if key == "Use case name":
                continue
            val = normal_course_to_tex(value) if key == "Normal Course" else tex_escape(strip_md(value))
            rows.append(f"\\ucrow{{{tex_escape(key)}}}{{{val}}}")
        if rows:
            rows[-1] = rows[-1].replace("\\ucrow", "\\lastucrow", 1)
        chunks.append(
            "\\begin{usecasetable}{"
            + tex_escape(strip_md(table.title))
            + "}{"
            + tex_escape(strip_md(table.caption))
            + "}\n"
            + "\n".join(rows)
            + "\n\\end{usecasetable}"
        )
    return "\n\n".join(chunks)


def data_tables_tex(tables: list[DataTable]) -> str:
    chunks: list[str] = []
    for t in tables:
        if strip_md(t.caption) == "Document History":
            header = (
                "\\multicolumn{1}{>{\\centering\\arraybackslash}p{0.16\\linewidth}}{\\textbf{"
                + tex_escape(strip_md(t.headers[0]))
                + "}} & "
                "\\multicolumn{1}{>{\\centering\\arraybackslash}p{0.11\\linewidth}}{\\textbf{"
                + tex_escape(strip_md(t.headers[1]))
                + "}} & "
                "\\multicolumn{1}{>{\\RaggedRight\\arraybackslash}X}{\\textbf{"
                + tex_escape(strip_md(t.headers[2]))
                + "}} & "
                "\\multicolumn{1}{>{\\centering\\arraybackslash}p{0.16\\linewidth}}{\\textbf{"
                + tex_escape(strip_md(t.headers[3]))
                + "}} \\\\"
            )
            rows = []
            for r in t.rows:
                padded = (r + [""] * len(t.headers))[: len(t.headers)]
                rows.append(
                    " & ".join(
                        [
                            f"\\multicolumn{{1}}{{>{{\\centering\\arraybackslash}}p{{0.16\\linewidth}}}}{{{table_cell_tex(padded[0], 0)}}}",
                            f"\\multicolumn{{1}}{{>{{\\centering\\arraybackslash}}p{{0.11\\linewidth}}}}{{{table_cell_tex(padded[1], 1)}}}",
                            f"\\multicolumn{{1}}{{>{{\\RaggedRight\\arraybackslash}}X}}{{{table_cell_tex(padded[2], 2)}}}",
                            f"\\multicolumn{{1}}{{>{{\\centering\\arraybackslash}}p{{0.16\\linewidth}}}}{{{table_cell_tex(padded[3], 3)}}}",
                        ]
                    )
                    + r" \\"
                )
            chunks.append(
                "\\begin{table}[H]\n\\centering\n\\footnotesize\n\\renewcommand{\\arraystretch}{1.12}\n"
                + "\\begin{tabularx}{\\linewidth}{@{}>{\\centering\\arraybackslash}p{0.16\\linewidth}>{\\centering\\arraybackslash}p{0.11\\linewidth}>{\\RaggedRight\\arraybackslash}X>{\\centering\\arraybackslash}p{0.16\\linewidth}@{}}\n"
                + "\\toprule\n"
                + header
                + "\n\\midrule\n"
                + "\n\\midrule\n".join(rows)
                + "\n\\bottomrule\n\\end{tabularx}\n\\caption{"
                + tex_escape(strip_md(t.caption))
                + "}\n\\end{table}"
            )
            continue

        header_cells = []
        for idx, h in enumerate(t.headers):
            text = f"\\textbf{{{tex_escape(strip_md(h))}}}"
            if idx == 0:
                header_cells.append(
                    f"\\multicolumn{{1}}{{>{{\\RaggedRight\\arraybackslash}}m{{0.23\\textwidth}}}}{{{text}}}"
                )
            else:
                header_cells.append(f"\\multicolumn{{1}}{{c}}{{{text}}}")
        header = " & ".join(header_cells) + r" \\"
        rows = []
        for r in t.rows:
            padded = (r + [""] * len(t.headers))[: len(t.headers)]
            rows.append(" & ".join(table_cell_tex(c, idx) for idx, c in enumerate(padded)) + r" \\")
        chunks.append(
            "\\begin{table}[!htbp]\n\\centering\n\\small\n"
            + "\\begin{tabular}{>{\\RaggedRight\\arraybackslash}m{0.23\\textwidth}>{\\centering\\arraybackslash}m{0.10\\textwidth}>{\\centering\\arraybackslash}m{0.18\\textwidth}>{\\RaggedRight\\arraybackslash}m{0.37\\textwidth}}\n"
            + "\\toprule\n"
            + header
            + "\n\\midrule\n"
            + "\n\\midrule\n".join(rows)
            + "\n\\bottomrule\n\\end{tabular}\n\\caption{"
            + tex_escape(strip_md(t.caption))
            + "}\n\\end{table}"
        )
    return "\n\n".join(chunks)


def performance_tex(sec: str) -> str:
    static_part = section_between(sec, "### 3.3.1 Static Numerical Requirement", "### 3.3.2 Dynamic Numerical Requirement")
    dynamic_part = section_between(sec, "### 3.3.2 Dynamic Numerical Requirement", "## 3.4 Logical Database Requirements")
    def itemize(items: list[str]) -> str:
        return "\\begin{itemize}\n" + "\n".join(f"  \\item {tex_escape(strip_md(x))}" for x in items) + "\n\\end{itemize}"
    return (
        "\\subsection{Performance Requirements}\n\n"
        + tex_escape(first_paragraph_after_heading(sec, "## 3.3 Performance Requirements"))
        + "\n\n\\subsubsection{Static Numerical Requirement}\n\n"
        + itemize(parse_bullets(static_part))
        + "\n\n\\subsubsection{Dynamic Numerical Requirement}\n\n"
        + itemize(parse_bullets(dynamic_part))
    )


def logical_db_tex(sec: str) -> str:
    part = section_between(sec, "## 3.4 Logical Database Requirements", None)
    paragraphs = []
    for block in re.split(r"\n\s*\n", part):
        block = block.strip()
        if block and not block.startswith("#"):
            paragraphs.append(tex_escape(" ".join(line.strip() for line in block.splitlines())))
    return "\\subsection{Logical Database Requirements}\n\n" + "\n\n".join(paragraphs)


def figure_from_image(caption: str, image_path: str, width: str = r"\linewidth") -> str:
    return (
        "\\begin{figure}[H]\n\\centering\n"
        "\\includegraphics[width="
        + width
        + "]{"
        + image_path
        + "}\n\\caption{"
        + tex_escape(caption)
        + "}\n\\end{figure}"
    )


def figure_from_text(caption: str, text: str) -> str:
    if not text:
        return ""
    escaped = tex_escape(text)
    return (
        "\\begin{figure}[H]\n\\centering\n\\fbox{\\begin{minipage}{0.9\\textwidth}\n"
        "\\small\\ttfamily\n"
        + escaped.replace("\n", "\\\\\n")
        + "\n\\end{minipage}}\n\\caption{"
        + tex_escape(caption)
        + "}\n\\end{figure}"
    )


def diagram_figure(section_text: str, fallback_caption: str) -> str:
    images = markdown_image_refs(section_text)
    if images:
        figures = []
        for alt, target in images:
            width_match = re.search(r"\{\s*width\s*=\s*([0-9.]+)\\textwidth\s*\}", section_text)
            width_value = f"{width_match.group(1)}\\linewidth" if width_match else r"\linewidth"
            caption = alt or Path(target).stem.replace("-", " ").title()
            figures.append(figure_from_image(caption, target, width=width_value))
        return "\n\n".join(figures)

    text = fenced_text(section_text)
    if text:
        return figure_from_text(fallback_caption, text)
    return ""


def replace_markdown_images_with_figures(md_text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        alt = match.group(1).strip()
        target = match.group(2).strip().split()[0].strip("<>")
        attrs = match.group(3) or ""
        width_match = re.search(r"width\s*=\s*([0-9.]+)\\textwidth", attrs)
        width = f"{width_match.group(1)}\\linewidth" if width_match else r"\linewidth"
        caption = alt or Path(target).stem.replace("-", " ").title()
        return figure_from_image(caption, target, width=width)

    return MD_IMAGE_RE.sub(repl, md_text)


def style_reference_links(md_text: str) -> str:
    start_match = re.search(r"^## References\s*$", md_text, flags=re.M)
    if not start_match:
        return md_text
    section_start = start_match.end()
    end_match = re.search(r"^##\s+", md_text[section_start:], flags=re.M)
    section_end = section_start + end_match.start() if end_match else len(md_text)

    def repl(match: re.Match[str]) -> str:
        text = match.group(1).strip()
        url = match.group(2).strip()
        return rf"\href{{{url}}}{{\textcolor{{blue}}{{\underline{{{text}}}}}}}"

    section = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", repl, md_text[section_start:section_end])
    return md_text[:section_start] + section + md_text[section_end:]


def generate_tex(md_text: str, source_dir: Path, table_title_rows: set[str] | None = None) -> str:
    title, subtitle, body_md = preprocess_markdown_for_pandoc(md_text, table_title_rows=table_title_rows)
    body_tex = pandoc_markdown_to_latex(body_md, source_dir)

    preamble = r"""\documentclass[11pt,a4paper]{article}
\usepackage[a4paper,top=25mm,bottom=25mm,left=25mm,right=25mm]{geometry}
\usepackage{graphicx}
\usepackage{float}
\usepackage{xcolor}
\usepackage{fontspec}
\usepackage{xetexko}
\usepackage{longtable}
\usepackage{array}
\usepackage{tabularx}
\usepackage{booktabs}
\usepackage{caption}
\usepackage{fancyhdr}
\usepackage{hyperref}
\usepackage{enumitem}
\usepackage{ragged2e}
\setmainfont{Arial}
\setsansfont{Arial}
\setmonofont{Latin Modern Mono}
\setmainhangulfont{UnBatang}
\setsanshangulfont{UnBatang}
\setmonohangulfont{UnDotum}
\renewcommand{\tabularxcolumn}[1]{m{#1}}
\newcolumntype{L}[1]{>{\centering\arraybackslash}m{#1}}
\newcolumntype{Y}{>{\centering\arraybackslash}X}
\hypersetup{colorlinks=false,pdfborder={0 0 0},pdftitle={Software Requirements Specification},pdfauthor={Cinemate}}
\captionsetup{labelfont=bf,labelsep=colon,justification=centering}
\counterwithin{table}{section}
\counterwithin{figure}{section}
\renewcommand{\arraystretch}{1.18}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.45em}
\setlength{\headheight}{14pt}
\providecommand{\tightlist}{%
  \setlength{\itemsep}{0pt}\setlength{\parskip}{0pt}}
\renewcommand{\labelitemi}{-}
\renewcommand{\labelitemii}{-}
\setlist[itemize]{leftmargin=1.4em,itemsep=0.1em,topsep=0.1em,label=\textbullet}
\setlist[enumerate]{leftmargin=1.8em,itemsep=0.15em,topsep=0.1em}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\nouppercase{\leftmark}}
\fancyhead[R]{\thepage}
\renewcommand{\headrulewidth}{0.4pt}
\begin{document}
"""

    title_page = f"""
\\begin{{titlepage}}
\\centering
\\vspace*{{2.3cm}}
{{\\Huge {tex_escape(title)}\\par}}
\\vspace{{0.8cm}}
{{\\Large {tex_escape(subtitle)}\\par}}
\\vspace{{1.6cm}}
{{\\Large 2조\\par}}
\\vspace{{0.35cm}}
{{\\Large 서동규, 왕지훈, 이진성, 정다연\\par}}
\\vfill
{{\\large Instructor: 이은석\\par}}
{{\\large Document Date: 06 May, 2026\\par}}
{{\\large Faculty: SungKyunKwan University\\par}}
\\end{{titlepage}}
"""

    return (
        preamble
        + title_page
        + "\\pagenumbering{roman}\n"
        + "\\tableofcontents\n\\clearpage\n"
        + "\\listoffigures\n\\clearpage\n"
        + "\\listoftables\n\\clearpage\n"
        + "\\pagenumbering{arabic}\n"
        + body_tex
        + "\n\\end{document}\n"
    )


def run_xelatex(tex_path: Path) -> None:
    if shutil.which("xelatex") is None:
        die("xelatex not found. Install texlive-xetex and texlive-lang-korean.")
    outdir = tex_path.parent.resolve()
    tex_name = tex_path.name
    for _ in range(2):
        subprocess.run(
            ["xelatex", "-interaction=nonstopmode", "-halt-on-error", f"-output-directory={outdir}", tex_name],
            check=True,
            cwd=outdir,
        )


def cleanup_auxiliary_files(tex_path: Path) -> None:
    stem = tex_path.stem
    outdir = tex_path.parent
    for suffix in [
        ".aux",
        ".log",
        ".out",
        ".toc",
        ".lof",
        ".lot",
        ".fls",
        ".fdb_latexmk",
        ".synctex.gz",
    ]:
        path = outdir / f"{stem}{suffix}"
        if path.exists():
            path.unlink()


def main() -> None:
    parser = argparse.ArgumentParser(description="Build SRS-style LaTeX and PDF from Markdown.")
    parser.add_argument("markdown", type=Path)
    parser.add_argument("--tex", type=Path, default=None)
    parser.add_argument("--pdf", type=Path, default=None)
    parser.add_argument("--no-pdf", action="store_true")
    parser.add_argument(
        "--table-title-row",
        action="append",
        default=[],
        help="Render matching data dictionary table headings as a title row inside the table instead of a caption.",
    )
    args = parser.parse_args()

    md_path = args.markdown
    if not md_path.exists():
        die(f"Markdown file not found: {md_path}")
    tex_path = args.tex or md_path.with_name(md_path.stem + "-srs.tex")
    pdf_path = args.pdf or tex_path.with_suffix(".pdf")

    tex_path.parent.mkdir(parents=True, exist_ok=True)
    md_text = md_path.read_text(encoding="utf-8")
    copy_image_assets(md_text, md_path.parent, tex_path.parent)
    table_title_rows = {item.strip() for item in args.table_title_row if item.strip()}
    tex = generate_tex(md_text, md_path.parent, table_title_rows=table_title_rows)
    tex_path.write_text(tex, encoding="utf-8")

    if not args.no_pdf:
        run_xelatex(tex_path)
        produced = tex_path.with_suffix(".pdf")
        if produced != pdf_path:
            shutil.copy2(produced, pdf_path)
        cleanup_auxiliary_files(tex_path)

    print(f"Wrote {tex_path}")
    if not args.no_pdf:
        print(f"Wrote {pdf_path}")


if __name__ == "__main__":
    main()
