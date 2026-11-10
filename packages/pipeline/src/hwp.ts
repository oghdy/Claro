// HWP 5.0 (한글 문서 · 바이너리) → 글 (E2-1). 한국 공공기관 첨부는 HWP 만 있는 때가 있다 (실물: 공정위 2020-06-02 요기요 보도자료 — 첨부가 .hwp 하나).
// 라이브러리를 더하지 않고 필요한 만큼만 읽는다 — 한컴 공개 문서 "HWP 5.0 문서 파일 구조"의 뜻 그대로:
//
//   1. 겉은 MS 복합 문서 (CFB · OLE2). 머리 512 바이트 → FAT (DIFAT 를 따라) → 디렉터리 → 스트림. 4096 바이트보다 작은 스트림은 미니 스트림에서
//   2. FileHeader 스트림 — 서명 "HWP Document File" · 속성 비트 0 = 압축 · 비트 1 = 암호 · 비트 2 = 배포용. 암호 · 배포용은 읽지 않는다 (멈춘다)
//   3. BodyText/Section0, Section1 … 차례대로. 압축이면 zlib raw deflate 를 푼다
//   4. 레코드 = 머리 4 바이트 (태그 10비트 · 수준 10비트 · 크기 12비트, 크기 0xFFF 면 뒤 4 바이트가 크기). HWPTAG_PARA_TEXT (= 0x10 + 51) 만 글이다
//   5. 문단 글은 UTF-16LE. 0 ~ 31 은 제어 문자: 글자 제어(1칸) 0 · 10 · 13 · 24 ~ 31, 나머지(1 ~ 9 · 11 · 12 · 14 ~ 23)는 8칸 묶음.
//      9 (탭) 는 공백 하나 · 10 (줄 나눔) · 13 (문단 끝) 은 줄바꿈 · 30 (묶음 빈칸) · 31 (고정폭 빈칸) 은 공백 · 나머지 제어는 버린다
//   표 · 글상자 안의 글도 PARA_TEXT 레코드다 — 문서에 나오는 차례대로 한 문단 = 한 줄 (표의 칸은 칸마다 줄. HTML 처럼 " | " 로 잇지 않는다 — 칸 경계를 레코드 수준으로 따로 읽어야 해서 안 했다)
// 그림 · 수식 · 머리말 · 꼬리말의 글자 묶음은 따로 다루지 않는다 (PARA_TEXT 에 있으면 나온다). 공백 정리는 extract.ts 의 tidy 하나.
import { inflateRawSync } from "node:zlib";

export const HWP_EXTRACTOR = "e2-hwp5/1 (자체 읽기 — CFB · zlib raw · HWPTAG_PARA_TEXT)";
const CFB_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const HWPTAG_PARA_TEXT = 0x10 + 51;
const ENDOFCHAIN = 0xfffffffe, FREESECT = 0xffffffff;

export const isCfb = (b: Uint8Array) => b.length >= 512 && CFB_MAGIC.every((v, i) => b[i] === v);

type Dir = { name: string; type: number; left: number; right: number; child: number; start: number; size: number };

function cfbStreams(buf: Uint8Array): Map<string, Uint8Array> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u16 = (o: number) => dv.getUint16(o, true), u32 = (o: number) => dv.getUint32(o, true);
  const sectorSize = 1 << u16(30), miniSize = 1 << u16(32);
  const nFat = u32(44), dirStart = u32(48), miniCutoff = u32(56), miniFatStart = u32(60), difatStart = u32(68);
  const sectorOff = (s: number) => (s + 1) * sectorSize;
  // FAT 섹터 목록 — 머리의 109 칸 + DIFAT 사슬
  const fatSectors: number[] = [];
  for (let i = 0; i < 109 && fatSectors.length < nFat; i++) fatSectors.push(u32(76 + i * 4));
  for (let s = difatStart, guard = 0; s !== ENDOFCHAIN && s !== FREESECT && fatSectors.length < nFat && guard++ < 1e5;) {
    const per = sectorSize / 4 - 1;
    for (let i = 0; i < per && fatSectors.length < nFat; i++) fatSectors.push(u32(sectorOff(s) + i * 4));
    s = u32(sectorOff(s) + per * 4);
  }
  const fat: number[] = [];
  for (const fs of fatSectors) for (let i = 0; i < sectorSize / 4; i++) fat.push(u32(sectorOff(fs) + i * 4));
  const chain = (start: number, next: number[]) => {
    const out: number[] = [];
    for (let s = start, guard = 0; s !== ENDOFCHAIN && s !== FREESECT && s < next.length && guard++ < 1e7;) {
      out.push(s);
      s = next[s]!;
    }
    return out;
  };
  const readChain = (start: number) => {
    const ss = chain(start, fat);
    const out = new Uint8Array(ss.length * sectorSize);
    ss.forEach((s, i) => out.set(buf.subarray(sectorOff(s), sectorOff(s) + sectorSize), i * sectorSize));
    return out;
  };
  // 디렉터리
  const dirBytes = readChain(dirStart);
  const ddv = new DataView(dirBytes.buffer);
  const dirs: Dir[] = [];
  for (let o = 0; o + 128 <= dirBytes.length; o += 128) {
    const nameLen = ddv.getUint16(o + 64, true);
    let name = "";
    for (let i = 0; i + 2 < nameLen; i += 2) name += String.fromCharCode(ddv.getUint16(o + i, true));
    dirs.push({ name, type: dirBytes[o + 66]!, left: ddv.getUint32(o + 68, true), right: ddv.getUint32(o + 72, true), child: ddv.getUint32(o + 76, true), start: ddv.getUint32(o + 116, true), size: ddv.getUint32(o + 120, true) });
  }
  const root = dirs[0]!;
  const miniStream = readChain(root.start);
  const miniFat: number[] = [];
  if (miniFatStart !== ENDOFCHAIN) {
    const mf = readChain(miniFatStart);
    const mdv = new DataView(mf.buffer);
    for (let o = 0; o + 4 <= mf.length; o += 4) miniFat.push(mdv.getUint32(o, true));
  }
  const readStream = (d: Dir) => {
    if (d.size < miniCutoff) {
      const ss = chain(d.start, miniFat);
      const out = new Uint8Array(ss.length * miniSize);
      ss.forEach((s, i) => out.set(miniStream.subarray(s * miniSize, (s + 1) * miniSize), i * miniSize));
      return out.subarray(0, d.size);
    }
    return readChain(d.start).subarray(0, d.size);
  };
  // 나무를 돌며 "저장소/스트림" 이름으로
  const out = new Map<string, Uint8Array>();
  const visit = (i: number, prefix: string, guard: Set<number>) => {
    if (i === FREESECT || i >= dirs.length || guard.has(i)) return;
    guard.add(i);
    const d = dirs[i]!;
    visit(d.left, prefix, guard);
    visit(d.right, prefix, guard);
    if (d.type === 2) out.set(prefix + d.name, readStream(d));
    else if (d.type === 1) visit(d.child, prefix + d.name + "/", guard);
  };
  visit(root.child, "", new Set());
  return out;
}

export function paraText(rec: Uint8Array): string {
  const n = rec.length >> 1;
  const dv = new DataView(rec.buffer, rec.byteOffset, rec.byteLength);
  let s = "";
  for (let i = 0; i < n;) {
    const c = dv.getUint16(i * 2, true);
    if (c >= 32) {
      s += String.fromCharCode(c);
      i++;
      continue;
    }
    if (c === 0 || c === 10 || c === 13 || (c >= 24 && c <= 31)) {
      if (c === 10 || c === 13) s += "\n";
      else if (c === 30 || c === 31) s += " ";
      i++;
      continue;
    }
    if (c === 9) s += " ";
    i += 8; // 묶음 제어 (인라인 · 확장) — 8칸
  }
  return s;
}

/** HWP 5.0 → 글 (공백 정리 전). 암호 · 배포용 문서 · HWP 아닌 CFB 는 오류 */
export function hwpToRawText(bytes: Uint8Array): string {
  const st = cfbStreams(bytes);
  const fh = st.get("FileHeader");
  if (!fh || new TextDecoder("latin1").decode(fh.subarray(0, 17)) !== "HWP Document File") throw new Error("CFB 이지만 HWP 문서가 아니다 (FileHeader 서명 없음)");
  const props = new DataView(fh.buffer, fh.byteOffset, fh.byteLength).getUint32(36, true);
  const compressed = (props & 1) !== 0;
  if (props & 2) throw new Error("암호가 걸린 HWP — 읽지 않는다");
  if (props & 4) throw new Error("배포용 HWP (본문이 ViewText 에 암호화) — 읽지 않는다");
  const sections = [...st.keys()].filter((k) => /^BodyText\/Section\d+$/.test(k)).sort((a, b) => Number(a.slice(16)) - Number(b.slice(16)));
  if (!sections.length) throw new Error("HWP 에 BodyText 구역이 없다");
  const parts: string[] = [];
  for (const k of sections) {
    let b = st.get(k)!;
    if (compressed) b = new Uint8Array(inflateRawSync(b));
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    for (let o = 0; o + 4 <= b.length;) {
      const h = dv.getUint32(o, true);
      const tag = h & 0x3ff;
      let size = h >>> 20;
      o += 4;
      if (size === 0xfff) {
        size = dv.getUint32(o, true);
        o += 4;
      }
      if (tag === HWPTAG_PARA_TEXT) parts.push(paraText(b.subarray(o, o + size)));
      o += size;
    }
  }
  return parts.join("\n");
}
