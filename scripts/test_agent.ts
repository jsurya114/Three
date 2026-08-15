import { ComputerAgent } from '../agents/computer/index';
import { AgentContext } from '../packages/types/agent';

async function run() {
  const agent = new ComputerAgent();
  await agent.initialize();

  const context: AgentContext = { taskId: 'test-123', workspacePath: __dirname };

  console.log('Testing open_application...');
  let result = await agent.execute('open_application:Calculator', context);
  console.log(result);

  console.log('Testing get_clipboard...');
  result = await agent.execute('get_clipboard', context);
  console.log(result);

  console.log('Testing set_clipboard...');
  result = await agent.execute('set_clipboard:Hello from Three AI!', context);
  console.log(result);

  console.log('Testing get_clipboard again...');
  result = await agent.execute('get_clipboard', context);
  console.log(result);
}

run().catch(console.error);
