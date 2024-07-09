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

  const questions = [
    "What problem does your startup idea solve?",
    "Who is your target audience?",
    "What makes your idea unique?",
    "How do you plan to monetize your idea?"
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

  const handleRestart = () => {
    setPage(1);
    setResponses(Array(4).fill(''));
    setResult(null);
    setDynamicQuestion('');
    setDynamicResponse('');
    setFinalResult(null);
  };

  useEffect(() => {
    setIsValid(true); // Reset validation state when page changes
  }, [page]);

  return (
    <div className="App">
      <h1>Idea Decider</h1>
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
          <div className={`question-container ${!isValid ? 'shake' : ''}`}>
            <h2>Question {page}</h2>
            <p>{questions[page - 1]}</p>
            <textarea
              className={`input-box ${!isValid ? 'invalid' : ''}`}
              value={responses[page - 1]}
              onChange={handleInputChange}
              placeholder={placeholders[page - 1]}
              rows="5"
            />
            {!isValid && <p className="validation-message">Please provide at least 5 words.</p>}
            <br />
            <button className="button" onClick={handleNext} disabled={loading}>
              {loading ? 'Generating...' : (page < questions.length ? 'Next' : 'Submit')}
            </button>
          </div>
          <div className="progress-dots">
            {questions.map((_, index) => (
              <span key={index} className={`dot ${index < page ? 'active' : ''}`} onClick={() => handleDotClick(index)}></span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
