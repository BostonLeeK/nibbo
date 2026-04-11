#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = (process.env.NIBBO_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const token = process.env.NIBBO_MCP_READ_TOKEN;

async function nibboFetch(pathWithQuery: string): Promise<unknown> {
  if (!token) throw new Error("NIBBO_MCP_READ_TOKEN is required");
  const res = await fetch(`${baseUrl}/api/mcp/read/${pathWithQuery}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Nibbo API ${res.status}: ${body.slice(0, 800)}`);
  }
  return res.json() as Promise<unknown>;
}

function okText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errText(message: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}

const server = new McpServer({ name: "nibbo-mcp", version: "1.0.0" });

server.registerTool(
  "nibbo_list_tasks",
  {
    description:
      "Read task boards, columns, and open (incomplete) tasks for the Nibbo family tied to the configured bearer token (profile MCP key or server token map).",
  },
  async () => {
    try {
      return okText(await nibboFetch("tasks"));
    } catch (e) {
      return errText(e instanceof Error ? e.message : String(e));
    }
  }
);

server.registerTool(
  "nibbo_list_events",
  {
    description: "Read calendar events. Optional ISO date filters map to startDate (from) and endDate (to) on the API.",
    inputSchema: {
      from: z.string().optional().describe("ISO date: lower bound for event startDate"),
      to: z.string().optional().describe("ISO date: upper bound for event endDate"),
    },
  },
  async (args) => {
    try {
      const q = new URLSearchParams();
      if (args?.from) q.set("from", args.from);
      if (args?.to) q.set("to", args.to);
      const qs = q.toString();
      return okText(await nibboFetch(`events${qs ? `?${qs}` : ""}`));
    } catch (e) {
      return errText(e instanceof Error ? e.message : String(e));
    }
  }
);

server.registerTool(
  "nibbo_list_shopping",
  {
    description: "Read shopping lists and items for the configured Nibbo family.",
  },
  async () => {
    try {
      return okText(await nibboFetch("shopping"));
    } catch (e) {
      return errText(e instanceof Error ? e.message : String(e));
    }
  }
);

server.registerTool(
  "nibbo_list_notes",
  {
    description: "Read notes (title, content, categories) for the configured Nibbo family.",
  },
  async () => {
    try {
      return okText(await nibboFetch("notes"));
    } catch (e) {
      return errText(e instanceof Error ? e.message : String(e));
    }
  }
);

server.registerTool(
  "nibbo_task_stats",
  {
    description:
      "Read personal task completion stats and family XP snapshot (same shape as dashboard task-stats). Personal counters use the user tied to the bearer token.",
  },
  async () => {
    try {
      return okText(await nibboFetch("task_stats"));
    } catch (e) {
      return errText(e instanceof Error ? e.message : String(e));
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
