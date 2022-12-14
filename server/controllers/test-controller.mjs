import Test from "../models/test.js";
import Question from "../models/question.js";
import APIError from "../handlers/APIError.js";

//////////////////////////
//// HELPER FUNCTIONS ////
//////////////////////////

const createCode = async () => {
  //Creates alphanumeric code of length 6
  let c = Math.random().toString(36).substring(2, 8);
  while (c.length !== 6 && !(await Test.findOne({ code: c }).exec())) {
    c = Math.random().toString(36).substring(2, 8);
  }
  return c;
};

const FisherYatesShuffle = (questions) => {
  let i = questions.length - 1;
  let ri, temp;

  while (i > 0) {
    ri = Math.floor(Math.random() * i);
    temp = questions[i];
    questions[i] = questions[ri];
    questions[ri] = temp;
    i--;
  }

  return questions;
};

const validateQuestions = async (questions) => {
  let q;
  for (let i = 0; i < questions.length; i++) {
    try {
      q = await Question.findById(questions[i].qId).lean().exec();
      if (!q) {
        throw new Error();
      }
    } catch (e) {
      throw new APIError(`Could not find question ${questions[i].qId}`, 400);
    }

    if (q.questionType === "MULTICHOICE") {
      if (q.multi.length !== questions[i].multiGrades.length) {
        throw new APIError(
          `Answer array given for ${questions[i].qId} does not match actual answer array`,
          400
        );
      }

      for (let j = 0; j < questions[i].multiGrades.length; j++) {
        if (
          q.multi.filter(
            (a) => a._id.toString() === questions[i].multiGrades[j].aId
          ).length !== 1
        ) {
          throw new APIError(`Answer not found`, 400);
        }
      }
    }
  }
};

const questionOutAdmin = async (qId) => {
  let adminQ;
  try {
    adminQ = await Question.findById(qId).lean().exec();
    if (!adminQ) {
      throw new Error();
    }
  } catch (e) {
    throw new APIError(`Could not find question with id ${qId}.`, 404);
  }
  const question = {};
  question.title = adminQ.title;
  question.description = adminQ.description;
  question.image = adminQ.image;
  question.category = adminQ.category;
  question.questionType = adminQ.questionType;
  question.creator = adminQ.creator;
  question.citation = adminQ.citation;
  question.multi = adminQ.multi;
  question.numMulti = adminQ.numMulti;
  question.answer = adminQ.answer;
  question.textGrade = adminQ.textGrade;
  question.totalMultiGrade = adminQ.totalMultiGrade;
  question.size = adminQ.size;
  question.lives = adminQ.lives;
  question.seed = adminQ.seed;
  question.patternFlashTime = adminQ.patternFlashTime;
  question.randomLevelOrder = adminQ.randomLevelOrder;
  question.corsi = adminQ.corsi;
  question.reverse = adminQ.reverse;
  question.gameStartDelay = adminQ.gameStartDelay;
  question.selectionDelay = adminQ.selectionDelay;
  question.testCode = adminQ.testCode;
  question.qId = adminQ._id;
  question.totalTime = adminQ.totalTime;
  question.order = adminQ.order;

  return question;
};

const questionOutStudent = async (test, qId) => {
  const studentQ = {};
  let adminQ;
  try {
    adminQ = await Question.findById(qId).lean().exec();
    if (!adminQ) {
      throw new Error();
    }
  } catch (e) {
    throw new APIError(`Could not find question ${qId}.`, 404);
  }

  const multi = test.shuffleAnswers
    ? FisherYatesShuffle(adminQ.multi)
    : adminQ.multi;
  multi.forEach((m) => {
    delete m.grade;
  });

  studentQ.title = adminQ.title;
  studentQ.description = adminQ.description;
  studentQ.image = adminQ.image;
  studentQ.category = adminQ.category;
  studentQ.questionType = adminQ.questionType;
  studentQ.creator = adminQ.creator;
  studentQ.citation = adminQ.citation;
  studentQ.multi = multi;
  studentQ.numMulti = adminQ.numMulti;
  studentQ.size = adminQ.size;
  studentQ.lives = adminQ.lives;
  studentQ.seed = adminQ.seed;
  studentQ.patternFlashTime = adminQ.patternFlashTime;
  studentQ.randomLevelOrder = adminQ.randomLevelOrder;
  studentQ.corsi = adminQ.corsi;
  studentQ.reverse = adminQ.reverse;
  studentQ.order = adminQ.order;
  studentQ.gameStartDelay = adminQ.gameStartDelay;
  studentQ.selectionDelay = adminQ.selectionDelay;
  studentQ.qId = adminQ._id;
  studentQ.testCode = adminQ.testCode;
  studentQ.totalTime = adminQ.totalTime;

  return studentQ;
};

const testOutAdmin = async (test) => {
  test.questions = await Promise.all(
    test.questions.map(async (qId) => await questionOutAdmin(qId))
  );
  return test;
};

const testOutStudent = async (test) => {
  const testOut = {};
  testOut.tId = test._id;
  testOut.title = test.title;
  testOut.creator = test.creator;
  testOut.code = test.code;
  testOut.allowBackTraversal = test.allowBackTraversal;
  testOut.totalTime = test.totalTime;
  testOut.individualTime = test.individualTime;

  testOut.questions = await Promise.all(
    test.questions.map(async (qId) => await questionOutStudent(test, qId))
  );

  testOut.questions = test.shuffleQuestions
    ? FisherYatesShuffle(testOut.questions)
    : testOut.questions;

  return testOut;
};

////////////////////////
//// MAIN FUNCTIONS ////
////////////////////////

const createTest = async (req, res, next) => {
  const createdTest = new Test({
    title: req.body.title,
    creator: req.name,
    questions: [],
    studentAnswers: [],
    published: false,
    allowBackTraversal:
      req.body.allowBackTraversal == null ? false : req.body.allowBackTraversal,
    totalTime: req.body.totalTime == null ? 0 : req.body.totalTime,
    code: await createCode(),
    individualTime:
      req.body.individualTime == null ? true : req.body.individualTime,
    shuffleAnswers:
      req.body.shuffleAnswers == null ? false : req.body.shuffleAnswers,
    shuffleQuestions:
      req.body.shuffleQuestions == null ? false : req.body.shuffleQuestions,
  });

  try {
    await createdTest.validate();
  } catch (e) {
    return next(new APIError("Invalid or missing inputs.", 400));
  }

  let result;
  try {
    result = await createdTest.save();
  } catch (e) {
    return next(new APIError("Could not save test.", 500));
  }

  // res.status(201).json(createdTest);
  res.status(201).json(result);
};

const getTestByCode = async (req, res, next) => {
  let test;
  try {
    test = await Test.findOne({ code: req.params.code }).lean().exec();
    if (!test) {
      throw new Error();
    }
  } catch (e) {
    return next(new APIError("Test not found.", 404));
  }

  //Can only access test if creator for admin or test permissions for students
  if (
    !(req.permissions.includes("admin") && req.name === test.creator) &&
    !(
      !req.permissions.includes("admin") &&
      req.permissions.includes(req.params.code)
    )
  ) {
    return next(new APIError("Forbidden.", 403));
  }

  //Different outputs depending on whether admin or student
  if (req.permissions.includes("admin")) {
    // res.json(await testOutStudent(test));
    try {
      res.json(await testOutAdmin(test));
    } catch (e) {
      return next(e);
    }
  } else {
    if (!test.published) {
      return next(new APIError("Cannot do unpublished test.", 403));
    }

    try {
      res.json(await testOutStudent(test));
    } catch (e) {
      return next(e);
    }
  }
};

const getMyTests = async (req, res, next) => {
  let tests;
  try {
    //lean to get plain old javascript object
    tests = await Test.find({ creator: req.name }).lean().exec();
    if (!tests) {
      throw new Error();
    }
  } catch (e) {
    return next(new APIError("No test not found.", 404));
  }

  const testsOut = await Promise.all(tests.map((t) => testOutAdmin(t)));
  res.json(testsOut);
};

const editTest = async (req, res, next) => {
  let test;
  try {
    test = await Test.findOne({
      creator: req.name,
      code: req.params.code,
    }).exec();
    if (!test) {
      throw new Error();
    }
  } catch (e) {
    return next(
      new APIError(
        "No test not found or user does not have permission to edit test.",
        404
      )
    );
  }

  if (test.published) {
    return next(new APIError("Cannot edit published test", 404));
  }

  //Validate questions field
  if (req.body.questions) {
    try {
      await validateQuestions(req.body.questions);
    } catch (e) {
      return next(e);
    }
  }

  test.title = req.body.title == null ? test.title : req.body.title;
  test.published =
    req.body.published == null ? test.published : req.body.published;
  test.allowBackTraversal =
    req.body.allowBackTraversal == null
      ? test.allowBackTraversal
      : req.body.allowBackTraversal;
  test.individualTime =
    req.body.individualTime == null
      ? test.individualTime
      : req.body.individualTime;
  test.totalTime = test.individualTime
    ? test.totalTime
    : req.body.totalTime
    ? req.body.totalTime
    : test.totalTime;
  test.shuffleAnswers =
    req.body.shuffleAnswers == null
      ? test.shuffleAnswers
      : req.body.shuffleAnswers;
  test.shuffleQuestions =
    req.body.shuffleQuestions == null
      ? test.shuffleQuestions
      : req.body.shuffleQuestions;

  try {
    await test.validate();
  } catch (e) {
    return next(new APIError("Invalid or missing inputs.", 400));
  }

  let result;
  try {
    result = await test.save();
  } catch (e) {
    return next(new APIError("Failed to save in database.", 500));
  }

  res.status(201).json(result);
};

const deleteTest = async (req, res, next) => {
  let test;
  try {
    test = await Test.findOne({ creator: req.name, code: req.params.code })
      .lean()
      .exec();
    if (!test) {
      throw new Error();
    }
  } catch (e) {
    return next(
      new APIError(
        "No test not found or user does not have permission to delete test.",
        404
      )
    );
  }

  //Delete questions in the test
  for (const q in test.questions){
    try{
      await Question.findByIdAndDelete(test.questions[q]).exec();
    }catch (e){
      return next(
        new APIError(
          "Could not delete questions in test",
          500
        )
      );
    }
  }

  try {
    await Test.findOneAndDelete({
      creator: req.name,
      code: req.params.code,
    }).exec();
  } catch (e) {
    return next(new APIError("Could not delete test", 400));
  }

  res.json({ message: "Successfully deleted test" });
};

export {
  createTest,
  getTestByCode,
  getMyTests,
  editTest,
  deleteTest,
};
