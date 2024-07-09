const express = require('express');
const axios = require('axios');
const cors = require('cors');
const OpenAI = require("openai");
require('dotenv').config();

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({apiKey:apiKey});
const assistantId = 'asst_cEYI5vE1ApxMyuTjhOsq2KOq';

app.post('/api/test', async (req, res) => {
  if(req.body){
    console.log(req.body);
    res.send(req.body);
  } res.send('Error no body');
});

// Function to handle creating and running the assistant with specific instructions
const runAssistant = async (req, res, instruction) => {
  try {
    //console.log(req.body);
    // Create a new thread
    const thread = await openai.beta.threads.create(req.body);
    
    // Run the assistant with specific instructions
    const run = await openai.beta.threads.runs.createAndPoll(
      thread.id,
      {
        assistant_id: assistantId,
        instructions: instruction
      }
    );
    
    if (run.status === 'completed') {
      // List the messages from the thread
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      
      // Send the first message content as the response
      res.send(messages.data[0].content[0].text.value);
    } else {
      console.log(run.status);
      res.status(500).send('Run not completed');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Route for the initial review
app.post('/api/ideafirstreview', async (req, res) => {
  const instruction = "Please evaluate the start-up idea and ask a specific follow-up question to improve the quality of your assessment";
  await runAssistant(req, res, instruction);
});

// Add more routes as needed
app.post('/api/finalreview', async (req, res) => {
  const instruction = "Please evaluate the idea by providing a score out of 10 overall and then breaking it down into it's components";
  await runAssistant(req, res, instruction);
});

app.post('/api/generate-idea', async (req, res) => {
    try {
      const thread = await openai.beta.threads.create();
      const message = await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: "Wealth management app to plan for retirement"
        }
      );
      console.log(message);
      let run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        { 
          assistant_id: assistantId,
          instructions: "Please address the user as Jane Doe. The user has a premium account."
        }
      );
      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(
          run.thread_id
        );
        for (const message of messages.data.reverse()) {
          console.log(`${message.role} > ${message.content[0].text.value}`);
        }
      } else {
        console.log(run.status);
      }
        /*
        // retrive assistant
        const assistant = await axios.post(`https://api.openai.com/v1/assistants/${assistantId}`, {}, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        });
        console.log(assistant.data);
        */
        /*
        data: {
          id: 'asst_cEYI5vE1ApxMyuTjhOsq2KOq',
          object: 'assistant',
          created_at: 1720442605,
          name: 'Idea evaluator',
          description: null,
          model: 'gpt-4o',
          instructions: 'You are an assistant that will help users evaluate their startup idea based on the size of the market, the timing of the idea and why the founder is the best person to work on that idea. Ask additional questions as needed before evaluating the idea.',
          tools: [],
          top_p: 1,
          temperature: 1,
          tool_resources: {},
          metadata: {},
          response_format: 'auto'
        }
        */
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
