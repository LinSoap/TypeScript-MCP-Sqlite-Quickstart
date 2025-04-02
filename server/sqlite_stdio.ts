import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import { z } from "zod";

//创建一个MCPServer实例
export const sqliteServer = new McpServer({
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

//定义一个server
//第一个参数是tools名
//第二个参数是描述，向大模型介绍该工具的用途
//第三个参数是输入参数
//第四个参数是调用的方法
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

//使用StdioTransport连接Server
const transport = new StdioServerTransport();
await sqliteServer.connect(transport);