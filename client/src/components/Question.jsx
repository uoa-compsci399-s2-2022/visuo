import MatchingGame from "../components/MatchingGame/MatchingGame";
import PatternGame from "../components/PatternGame/PatternGame";

const Question = (props) => {
  const { question, submit, submitValue, nextQuestion, userAnswer } = props;

  const renderMultiChoiceSingleAnswer = () => {
    const answerChoices = [];
    for (let i = 0; i < question.multi.length; i++) {
      answerChoices.push(
        <div className="answer__choice" key={i}>
          <label htmlFor={i}>
            <img src={question.multi[i].image} alt="" />
          </label>
          <input
            type="radio"
            id={i}
            value={question.multi[i]._id}
            name="answer"
            onChange={submit}
            checked={userAnswer.aIds.includes(question.multi[i]._id)}
          />
        </div>
      );
    }
    return answerChoices;
  };

  const renderMultiChoiceMultiAnswer = () => {
    const answerChoices = [];
    for (let i = 0; i < question.multi.length; i++) {
      answerChoices.push(
        <div className="answer__choice" key={i}>
          <label htmlFor={i}>
            <img src={question.multi[i].image} alt="" />
          </label>
          <input
            type="checkbox"
            id={i}
            value={question.multi[i]._id}
            name="answer"
            onChange={submit}
            checked={userAnswer.aIds.includes(question.multi[i]._id)}
          />
        </div>
      );
    }
    return answerChoices;
  };

  const renderTextEntryAnswer = () => {
    return (
      <div className="answer__text-entry">
        <label htmlFor="answer"></label>
        <input
          type="text"
          id="answer"
          placeholder="Answer"
          autoComplete="off"
          name="answer"
          onChange={submit}
          value={userAnswer.textAnswer}
        />
      </div>
    );
  };

  const renderMatchingGame = () => {
    return (
      <MatchingGame
        pairs={question.size}
        description={question.description}
        gameStartDelay={question.gameStartDelay.$numberDecimal}
        selectionDelay={question.selectionDelay.$numberDecimal}
        maxHealth={question.lives}
        timerState={question.totalTime.$numberDecimal == 0 ? false : true}
        timeAllowed={question.totalTime.$numberDecimal}
        randomSeed={question.seed}
        submit={submitValue}
        next={nextQuestion}
        firstVisit={userAnswer.value === null}
      />
    );
  };

  const renderPatternGame = () => {
    return (
      <PatternGame
        corsi={question.corsi}
        description={question.description}
        gameDim={question.size} // width and height of grid
        order={question.order} // pattern order/no-order
        maxHealth={question.lives}
        timerState={question.totalTime.$numberDecimal == 0 ? false : true} // set timer on/off
        timeAllowed={question.totalTime.$numberDecimal} // total time if timer on
        patternFlashTime={question.patternFlashTime.$numberDecimal} // time to flash each pattern block
        randomLevelOrder={question.randomLevelOrder} // each level is randomized
        randomSeed={question.seed}
        reverse={question.reverse}
        next={nextQuestion}
        submit={submitValue}
        firstVisit={userAnswer.value === null}
      />
    );
  };

  // Conditionally render answer format based on question type
  const renderAnswer = () => {
    switch (question.questionType) {
      case "MULTICHOICE-SINGLE":
        return renderMultiChoiceSingleAnswer();
      case "MULTICHOICE-MULTI":
        return renderMultiChoiceMultiAnswer();
      case "TEXT":
        return renderTextEntryAnswer();
      case "DYNAMIC-MEMORY":
        return renderMatchingGame();
      case "DYNAMIC-PATTERN":
        return renderPatternGame();
      default:
        console.log(`ERROR: Invalid question type ${question.questionType}.`);
        return;
    }
  };

  if (question.category === "MEMORY") {
    return renderAnswer();
  }
  return (
    <>
      <div className="test__question">
        <img src={question.image} alt="" className="test__image" />
      </div>

      <div className="test__question-text">
        <h2>{question.description}</h2>
      </div>

      <form className="test__answers" onSubmit={submit} autoComplete="off">
        {renderAnswer()}
      </form>
    </>
  );
};

export default Question;
