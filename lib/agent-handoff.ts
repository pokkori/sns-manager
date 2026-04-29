// lib/agent-handoff.ts

export interface HandoffItem {
  task: string;
  result?: string;
  artifact_path?: string;
  blocker?: string;
}

export interface HandoffDecision {
  what: string;
  why: string;
  alternatives_rejected: string[];
}

export interface AgentHandoff {
  session_id: string;
  timestamp_jst: string;
  agent_name: string;
  completed: HandoffItem[];
  in_progress: HandoffItem[];
  pending: Array<HandoffItem & { priority: "P0" | "P1" | "P2" }>;
  decisions: HandoffDecision[];
  errors_encountered: Array<{ error: string; resolution: string; pattern_id?: string }>;
  next_agent_context: string;
}

export function buildHandoffPromptSuffix(saveDir = "D:/99_Webアプリ/SNS自動投稿管理/lib/handoffs"): string {
  const timestamp = new Date().toISOString();
  return `
作業完了後、以下のJSON形式でハンドオフレポートを出力すること:
\`\`\`json
{
  "session_id": "${timestamp}-<agent_name>",
  "timestamp_jst": "${timestamp}",
  "agent_name": "<自分のエージェント名>",
  "completed": [{"task": "...", "result": "...", "artifact_path": "..."}],
  "in_progress": [],
  "pending": [{"task": "...", "priority": "P1"}],
  "decisions": [{"what": "...", "why": "...", "alternatives_rejected": []}],
  "errors_encountered": [],
  "next_agent_context": "次のエージェントへ: ..."
}
\`\`\`
このJSONを ${saveDir}/<timestamp>-<agent_name>.json として保存する。
`;
}

export function createHandoff(
  agentName: string,
  completed: HandoffItem[],
  pending: Array<HandoffItem & { priority: "P0" | "P1" | "P2" }> = [],
  context = ""
): AgentHandoff {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstTime = new Date(now.getTime() + jstOffset).toISOString().replace("Z", "+09:00");

  return {
    session_id: `${now.getTime()}-${agentName}`,
    timestamp_jst: jstTime,
    agent_name: agentName,
    completed,
    in_progress: [],
    pending,
    decisions: [],
    errors_encountered: [],
    next_agent_context: context,
  };
}
