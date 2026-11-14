import { longByRef, oneLine, type Line } from "../catalog";

/**
 * 이야기들이 함께 가진 개념 — **이름이 같은 도구** (어림이다: 계약의 Tool.basis 가 비어 있어 "같은 개념"을 이름으로 맞춘다 — UX-7 의 _open 그대로 · F-E2-f).
 * 짧은 이야기의 도구는 가리킨 긴 이야기의 카드 그대로다 (tools_from — 이쪽은 어림이 아니다). 같은 이야기 묶음끼리 모은다.
 * href: 그 이야기로 가는 주소 (실제 주소 / 시안 주소 — 부르는 쪽이 정한다)
 */
export function sharedConcepts(lines: readonly Line[], href: (line: Line) => string): { stories: { title: string; path: string }[]; names: string[] }[] {
  const seen = new Map<string, { title: string; path: string }[]>();
  const add = (name: string, title: string, path: string) => seen.set(name, [...(seen.get(name) ?? []), { title: oneLine(title), path }]);
  for (const line of lines) {
    if (line.kind === "long") for (const tool of line.ep.tools) add(tool.name, line.ep.scenes.cover.title, href(line));
    else {
      const from = longByRef(line.story.tools_from?.episode);
      for (const key of from ? (line.story.tools_from?.keys ?? []) : []) {
        const tool = from!.ep.tools.find((x) => x.key === key);
        if (tool) add(tool.name, line.story.scenes.cover.title, href(line));
      }
    }
  }
  const groups = new Map<string, { stories: { title: string; path: string }[]; names: string[] }>();
  for (const [name, stories] of seen) {
    if (stories.length < 2) continue;
    const id = stories.map((x) => x.path).join("|");
    groups.set(id, { stories, names: [...(groups.get(id)?.names ?? []), name] });
  }
  return [...groups.values()];
}
