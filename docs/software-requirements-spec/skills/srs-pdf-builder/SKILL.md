---
name: srs-pdf-builder
description: 마크다운 기반 요구사항 명세서를 SRS 형식의 LaTeX와 PDF로 변환한다. `requirements-spec.md` 같은 요구사항 문서를 편집한 뒤, 제목 페이지, 목차, 그림/표 목록, 사용 사례/데이터 사전/문서 이력 표, 러닝 헤더, 한글 폰트 지원이 포함된 IEEE-830 유사 형식으로 재생성할 때 사용한다.
---

# SRS PDF 빌더

## 작업 흐름

`scripts/build_srs_pdf.py`를 사용해 마크다운 요구사항 명세서를 다시 빌드한다.
빌더는 Markdown 전체 본문을 `pandoc`로 LaTeX로 변환하고, Markdown 안의 `png` 이미지를 PDF에 포함한다.

기본 실행 예시는 다음과 같다.

```bash
python3 ~/.codex/skills/srs-pdf-builder/scripts/build_srs_pdf.py \
  <markdown-file> \
  --tex <output-tex> \
  --pdf <output-pdf>
```

저장소 루트에서 실행한다. 스크립트는 다음을 수행한다.

1. 문서 상단 제목 블록을 한 장짜리 중앙 정렬 표지로 변환한다.
2. 본문 전체를 `pandoc`로 LaTeX로 변환한다.
3. Markdown 표 중 필요한 항목에는 표 캡션을 자동 부여해 `List of Tables`에 반영한다.
4. Markdown의 `png` 이미지를 출력 디렉터리로 복사한 뒤 PDF에 포함한다.
5. `xelatex`를 두 번 실행해 PDF를 생성한다.

## 요구사항

빌드 전에 다음 명령이 동작하는지 확인한다.

```bash
pandoc --version
xelatex --version
fc-match Arial
fc-match UnDotum
```

WSL 환경에서 Arial 폰트가 없으면 Windows 폰트를 등록한다.

```bash
mkdir -p ~/.fonts
cp /mnt/c/Windows/Fonts/arial*.ttf ~/.fonts/
fc-cache -fv ~/.fonts
```

생성되는 LaTeX는 다음 폰트를 사용한다.

- 영어: `Arial`
- 한글: `UnBatang`
- 고정폭: `Latin Modern Mono`
- 텍스트 다이어그램 내 한글 보조 폰트: `UnDotum`

## 편집 규칙

- 요구사항 내용의 기준은 마크다운 파일이다.
- 생성된 `.aux`, `.toc`, `.lof`, `.lot`, `.out`, `.log` 파일은 수동으로 수정하지 않는다.
- 내용이 바뀌면 마크다운을 먼저 수정한 뒤 스크립트를 다시 실행한다.
- 형식이 바뀌면 스크립트 또는 생성 템플릿 로직을 수정한 뒤 다시 빌드한다.

## 기대 결과물

기본 출력은 입력 파일과 같은 디렉토리에 생성된다.

- `<input-stem>-srs.tex`
- `<input-stem>-srs.pdf`

빌드 후에는 다음으로 결과를 확인한다.

```bash
pdfinfo <output-pdf> | rg 'Pages|Page size|Creator'
pdffonts <output-pdf>
pdftotext -layout <output-pdf> - | rg 'List of Tables|Table|Figure'
```
