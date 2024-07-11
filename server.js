const express = require('express');
const axios = require('axios');
const cors = require('cors');
const OpenAI = require("openai");
require('dotenv').config();
const multer = require('multer');
const { Readable } = require('stream');
const fs = require('fs');
const bodyParser = require('body-parser');
const upload = multer();

const app = express();
const port = 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({apiKey:apiKey});

const startupAssistantId = process.env.OPENAI_ASSISTANT_ID; // start up anlayzer 
const resumeAssistantId = process.env.resumeAssistantId; // resumer screener

app.post('/api/test', async (req, res) => {
  if(req.body){
    console.log(req.body);
    res.send(req.body);
  } res.send('Error no body');
});

app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {

  console.log('in analyze api');
  //const prompt = JSON.parse(req.body.data); 
  //console.log(prompt);

  if (!req.file || !req.body.data) {
    return res.status(400).json({ error: 'Resume and questions are required.' });
  } else {
    await runAssistant(req,res,resumeAssistantId,"Please look at the candidate's resume that is attached evlaute this application for the product management position at a large tech company like Google");
    //res.json({ answer });
  } 
});

// Function to handle creating and running the assistant for resumes with instructions
const runAssistant = async (req, res, assistantId, instruction) => {
  try {

    /*does not work, get that size error
    const openaiFile = await openai.files.create({
      file: req.file.buffer,
      purpose: "assistants",
    });*/

    let openaiFile = {"id":process.env.resumeFileId};
    /*Attempts to sent readable stream to openAI
    // Convert the buffer to a readable stream
    //const bufferStream = stream.from(req.file.buffer)
    let bufferStream = fs.createReadStream('./resume.pdf')

    // Create a vector store
    let vectorStore = await openai.beta.vectorStores.create({
      name: "Resume Analysis",
    });

    console.log(vectorStore);

    // Upload the file to the vector store
    let uploadedFile = await openai.beta.vectorStores.file.uploadAndPoll(vectorStore.id, bufferStream);
    */

    let messageArr = JSON.parse(req.body.data)
    messageArr.push({
        role: "user",
        content: "This is a copy of resume",
        attachments: [{file_id:openaiFile.id, tools:[{type:"file_search"}]}]
      });


    const thread = await openai.beta.threads.create({
      messages:messageArr
    })

    console.log(thread);
    //const thread = {id:'thread_QNroLtHdua7eQBUP2cBnFCrX'};
    console.log(assistantId + ' with instrcution: ' + instruction);
      
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
      console.log('run completed');
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
/*
// Function to handle creating and running the assistant for resumes with instructions
const runAssistant = async (req, res, assistantId, instruction) => {
  try {
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
*/

// Route for the initial review
app.post('/api/ideafirstreview', async (req, res) => {
  const instruction = "Please evaluate the start-up idea and ask a specific follow-up question to improve the quality of your assessment";
  await runAssistant(req, res, startupAssistantId, instruction);
});

// Add more routes as needed
app.post('/api/finalreview', async (req, res) => {
  const instruction = "Please evaluate the idea by providing a score out of 10 overall and then breaking it down into it's components";
  await runAssistant(req, res, startupAssistantId, instruction);
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
          assistant_id: startupAssistantId,
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
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
