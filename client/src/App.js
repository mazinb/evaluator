import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [page, setPage] = useState(1);
  const [responses, setResponses] = useState(Array(4).fill(''));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dynamicQuestion, setDynamicQuestion] = useState('');
  const [dynamicResponse, setDynamicResponse] = useState('');
  const [finalResult, setFinalResult] = useState(null);
  const [isValid, setIsValid] = useState(true);

  // New state variables for the resume and candidate questions
  const [resume, setResume] = useState(null);
  const [candidateResponses, setCandidateResponses] = useState(Array(3).fill(''));

  const questions = [
    "What problem does your startup idea solve?",
    "Who is your target audience?",
    "What makes your idea unique?",
    "How do you plan to monetize your idea?"
  ];

  const candidateQuestions = [
    "Why are you interested in this role?",
    "What is your experience with product management?",
    "How do you handle conflicts in a team?"
  ];

  const placeholders = [
    "E.g., My startup solves the problem of food waste by connecting restaurants with surplus food to customers at a discount.",
    "E.g., Our target audience is busy professionals aged 25-40 who want healthy meal options.",
    "E.g., Our idea is unique because we use AI to personalize meal plans based on dietary preferences.",
    "E.g., We plan to monetize through a subscription model offering premium features and access to exclusive deals."
  ];

  const handleInputChange = (e) => {
    const newResponses = [...responses];
    newResponses[page - 1] = e.target.value;
    setResponses(newResponses);
  };

  const handleCandidateInputChange = (e, index) => {
    const newResponses = [...candidateResponses];
    newResponses[index] = e.target.value;
    setCandidateResponses(newResponses);
  };

  const handleResumeUpload = (e) => {
    setResume(e.target.files[0]);
  };

  const handleNext = () => {
    const currentResponse = responses[page - 1];
    if (currentResponse.split(' ').filter(word => word).length < 5) {
      setIsValid(false);
      return;
    }
    setIsValid(true);
    if (page < questions.length) {
      setPage(page + 1);
    } else {
      handleSubmit();
    }
  };

  const handleDotClick = (index) => {
    setPage(index + 1);
    setIsValid(true); // Reset validation when changing questions
  };

  const handleSubmit = async () => {
    setLoading(true);
    const formattedResponses = questions.map((question, index) => ([
      {
        role: "assistant",
        content: question
      },
      {
        role: "user",
        content: responses[index]
      }
    ])).flat();

    try {
      const response = await axios.post('/api/ideafirstreview', { messages: formattedResponses });
      setDynamicQuestion(response.data);
      setResult(response.data);
    } catch (error) {
      console.error('Error generating idea:', error);
    }
    setLoading(false);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    const finalMessages = [
      {
        role: "assistant",
        content: dynamicQuestion
      },
      {
        role: "user",
        content: dynamicResponse
      }
    ];

    try {
      const response = await axios.post('/api/finalreview', { messages: finalMessages });
      setFinalResult(response.data);
    } catch (error) {
      console.error('Error generating final evaluation:', error);
    }
    setLoading(false);
  };

  const handleResumeSubmit = async () => {
    if (!resume || candidateResponses.some(response => response.split(' ').length < 5)) {
      setIsValid(false);
      return;
    }
    setLoading(true);
  
    const formData = new FormData();
    formData.append('resume', resume);
    const questionsAndAnswers = candidateQuestions.flatMap((question, index) => [
      { role: "assistant", content: question },
      { role: "user", content: candidateResponses[index] }
    ]);
    console.log(questionsAndAnswers);
    formData.append('data',JSON.stringify(questionsAndAnswers));
  
    try {
      const response = await axios.post('/api/analyze-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setDynamicQuestion(response.data);
      setResult(response.data);
    } catch (error) {
      console.error('Error analyzing resume:', error);
    }
    setLoading(false);
  };

  const handleRestart = () => {
    setPage(1);
    setResponses(Array(4).fill(''));
    setResult(null);
    setDynamicQuestion('');
    setDynamicResponse('');
    setFinalResult(null);
    setResume(null);
    setCandidateResponses(Array(3).fill(''));
  };

  useEffect(() => {
    setIsValid(true); // Reset validation state when page changes
  }, [page]);

  return (
    <div className="App">
      <h1>Candidate Evaluator</h1>
      {finalResult ? (
        <>
          <h2>Final Evaluation:</h2>
          <p>{finalResult}</p>
          <button className="button" onClick={handleRestart}>Start Over</button>
        </>
      ) : dynamicQuestion ? (
        <>
          <h2>Next Question:</h2>
          <p>{dynamicQuestion}</p>
          <textarea
            className="input-box"
            value={dynamicResponse}
            onChange={(e) => setDynamicResponse(e.target.value)}
            placeholder="Type your answer here"
            rows="5"
          />
          <br />
          <button className="button" onClick={handleFinalSubmit} disabled={loading || !dynamicResponse}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </>
      ) : (
        <>
          <h2>Upload Resume and Answer Questions</h2>
          <input type="file" onChange={handleResumeUpload} />
          {candidateQuestions.map((question, index) => (
            <div key={index} className={`question-container ${!isValid ? 'shake' : ''}`}>
              <h2>Question {index + 1}</h2>
              <p>{question}</p>
              <textarea
                className={`input-box ${!isValid ? 'invalid' : ''}`}
                value={candidateResponses[index]}
                onChange={(e) => handleCandidateInputChange(e, index)}
                placeholder="Type your answer here"
                rows="5"
              />
              {!isValid && <p className="validation-message">Please provide at least 5 words.</p>}
            </div>
          ))}
          <br />
          <button className="button" onClick={handleResumeSubmit} disabled={loading}>
            {loading ? 'Analyzing...' : 'Submit'}
          </button>
        </>
      )}
    </div>
  );
}

export default App;