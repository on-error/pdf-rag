import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 4002}`;

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function evaluate() {
  console.log('PDF RAG Evaluation Script\n');
  console.log('─'.repeat(60));

  const question = await askQuestion('Enter your question: ');

  if (!question) {
    console.error('\nError: Question cannot be empty. Exiting...\n');
    process.exit(1);
  }

  console.log(`\nQuestion: ${question}`);
  console.log('─'.repeat(60));
  console.log('Processing...\n');

  try {
    const response = await fetch(`${API_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        topK: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error (${response.status}): ${errorText}`;
      
      if (response.status === 0 || response.status === 500) {
        errorMessage += '\n\nTip: Make sure the server is running on ' + API_URL;
        errorMessage += '\n   Start it with: npm run dev';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    console.log('Answer:');
    console.log('─'.repeat(60));
    console.log(data.answer);
    console.log('─'.repeat(60));

    if (data.sources && data.sources.length > 0) {
      console.log(`\nSources (${data.sourceCount}):`);
      console.log('─'.repeat(60));
      data.sources.forEach((source: {
        documentName: string;
        chunkIndex: number;
        text: string;
      }, index: number) => {
        console.log(`\n[${index + 1}] Document: ${source.documentName}`);
        console.log(`    Chunk Index: ${source.chunkIndex}`);
        console.log(`    Preview: ${source.text}`);
      });
    }

    console.log('\nEvaluation complete!\n');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\nError:', errorMessage);
    if (error instanceof Error && error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

evaluate();
