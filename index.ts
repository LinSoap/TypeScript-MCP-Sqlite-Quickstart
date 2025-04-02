import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources.mjs";

//使用StdioTransport连接Server
//这里填写的参数与Inspector测试中填写的参数一致
const stdioTransport = new StdioClientTransport({
  command: "node",
  args: ["./build/server/sqlite_stdio.js"]
});

//使用SSETransport连接Server
//这里填写的参数与Inspector测试中填写的参数一致
const sseTransport = new SSEClientTransport(new URL("http://localhost:3001/sse"));

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0"
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {}
    }
  }
);

//连接StdioTransport和SSETransport,不过貌似只能同时连接一个，
//按需选择连接方式
await client.connect(stdioTransport);
// await client.connect(sseTransport);

//获取工具列表
const toolsResult = await client.listTools();
// console.log("Tools:", toolsResult);

//获取资源列表
// const resources = await client.listResources();

//获取提示列表
// const prompts = await client.listPrompts();

const anthropicTools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });
// console.log("Anthropic Tools:", anthropicTools);

const openaiTools:ChatCompletionTool[] = toolsResult.tools.map((tool) => {
        return {
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema,
            }
        }
      })

// console.log("OpenAI Tools:", openaiTools);

const openai = new OpenAI({
  apiKey: 'apikey',  // 使用你的apikey，建议从环境变量读取
  baseURL: 'https://api.deepseek.com/v1',
});

//替换成你的问题
const messages: ChatCompletionMessageParam[] = [{ role: "user", content: "我有一个sqlite数据库，数据库中有expenses表和incomes表，告诉我我的收入和支出分别是多少？" }];

// 发送第一次请求，带上tools参数
const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: messages,
        max_tokens: 1000,
        tools: openaiTools,
  }
);

const content = response.choices[0];
//监听finish_reason，如果是tool_calls，说明大模型调用了工具
console.log("finish_resaon",content.finish_reason);
if (content.finish_reason === "tool_calls" && content.message.tool_calls && content.message.tool_calls.length > 0) {
    //获取大模型返回工具调用的参数    
      const tool_call = content.message.tool_calls[0];
      const toolName = tool_call.function.name;
      const toolArgs = JSON.parse(tool_call.function.arguments) as { [x: string]: unknown } | undefined;


      const result = await client.callTool({
        name: toolName,
        arguments: toolArgs,
      });

      console.log(`[大模型调用工具 ${toolName}  参数为 ${JSON.stringify(toolArgs)}]`)

      //将获取到的结果添加到messages中，准备发送给大模型 
      messages.push({
        role: "user",
        content: result.content as string,
      });

      //将获取到的结果添加到messages中，再发送一次请求，可以再在这个请求中带上tools，实现多轮调用，但是也需要更好的流程处理逻辑
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        max_tokens: 1000,
        messages,
      });

    console.log(response.choices[0].message.content);
}