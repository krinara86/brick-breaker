// Run with: node test-hf.mjs
import { readFileSync } from 'fs';

let apiKey = '';

try {
  const env = readFileSync('.env', 'utf8');
  for (const line of env.split('\n')) {
    if (line.startsWith('VITE_HF_API_KEY=')) apiKey = line.split('=')[1].trim();
  }
} catch {
  console.error('❌ No .env file found.');
  process.exit(1);
}

if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
  console.error('❌ No API key set.');
  process.exit(1);
}

console.log(`🔑 Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}\n`);

// New HuggingFace API uses OpenAI-compatible chat completions
// at https://router.huggingface.co/v1/chat/completions
const models = [
  'Qwen/Qwen2.5-72B-Instruct',
  'meta-llama/Llama-3.1-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'HuggingFaceTB/SmolLM3-3B',
];

console.log('=== Testing https://router.huggingface.co/v1/chat/completions ===\n');

for (const model of models) {
  console.log(`Model: ${model}`);
  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Reply with just the word hello' }],
        max_tokens: 20,
        temperature: 0.3,
      }),
    });
    console.log(`  Status: ${response.status}`);
    const text = await response.text();
    console.log(`  Response: ${text.slice(0, 300)}\n`);
    if (response.ok) {
      console.log(`\n✅ WORKING! Model: ${model}`);
      console.log(`Update your .env: VITE_HF_MODEL=${model}`);
      break;
    }
  } catch (err) {
    console.log(`  Error: ${err.message}\n`);
  }
}
