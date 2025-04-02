import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import { z } from "zod";

//初始化一个MCPServer实例
const sqliteServer = new McpServer({
  name: "SQLite Explorer",
  version: "1.0.0"
});

//初始化Sqlite
const getDb = () => {
  const db = new sqlite3.Database("database.db");
  return {
    all: promisify<string, any[]>(db.all.bind(db)),
    close: promisify(db.close.bind(db))
  };
};

const app = express();

//定义一个server，该部分与stdio相同
sqliteServer.tool(
  "query",
  "这是用于执行 SQLite 查询的工具,你可以使用它来执行任何有效的 SQL 查询,例如SELECT sql FROM sqlite_master WHERE type='table'，或者SELECT * FROM table_name",
  { sql: z.string() },
  async ({ sql }) => {
    const db = getDb();
    try {
      const results = await db.all(sql);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    } finally {
      await db.close();
    }
  }
);

//使用SSETransport连接Server
const transports: {[sessionId: string]: SSEServerTransport} = {};

//用于处理SSE连接的路由
app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await sqliteServer.connect(transport);
});

//用于处理多个连接的路由
app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.listen(3001);