import { useEffect, useRef, useState } from "react";
import { Bot, Search, ChevronDown } from "lucide-react";
import { AgentChat } from "@/components/AgentChat";
import { agentFetch } from "@/lib/agent";

interface Skill {
  id: string;
  name: string;
  path: string;
}

function SkillSelect({ skills, value, onChange }: { skills: Skill[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = skills.find((s) => s.id === value);
  const options = skills.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative sm:w-80">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm text-left">
        <span className="truncate">{selected ? selected.name : "不启用 skill（通用短线分析）"}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-glow">
          <div className="flex items-center gap-2 px-2 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索 skill..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-60 overflow-auto border-t border-border">
            <button type="button" onClick={() => { onChange(""); setOpen(false); setQ(""); }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted/50 ${!value ? "text-primary" : ""}`}>
              不启用 skill（通用短线分析）
            </button>
            {options.map((s) => (
              <button key={s.id} type="button" onClick={() => { onChange(s.id); setOpen(false); setQ(""); }}
                className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted/50 ${value === s.id ? "text-primary" : ""}`}>
                {s.name}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">未匹配到 skill</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Ask() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillId, setSkillId] = useState("");

  useEffect(() => {
    agentFetch<{ skills: Skill[] }>("/api/skills")
      .then((r) => setSkills(r.skills || []))
      .catch(() => setSkills([]));
  }, []);

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Bot className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">AI 提问</h1>
        <span className="text-xs text-muted-foreground">选择 skill 后可直接使用下面的默认问题。</span>
      </div>

      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">选择本地 Skill</label>
          <SkillSelect
            value={skillId}
            skills={skills}
            onChange={(id) => setSkillId(id)}
          />
        </div>
        <div className="flex items-center text-[11px] text-muted-foreground sm:mt-6">
          {skills.length === 0 && <span className="text-warning">未检测到本地 skill（~/.codex/skills）</span>}
          {skills.length > 0 && <span>已检测到 {skills.length} 个 skill</span>}
        </div>
      </div>

      <div className="mt-2 flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl glass">
        <AgentChat
          endpoint="/api/ask"
          placeholder="输入你的短线问题…"
          suggestions={
            skillId
              ? [
                  "请用当前 skill 判断当前环境阶段",
                  "当前最强龙头与映射股有哪些",
                  "给出可执行的模式与风控建议",
                ]
              : ["当前短线情绪怎样", "最强主线是谁", "明天验证什么数据"]
          }
          alwaysShowSuggestions
          skillId={skillId || undefined}
        />
      </div>
    </div>
  );
}
