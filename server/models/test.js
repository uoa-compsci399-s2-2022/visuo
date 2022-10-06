import mongoose from "mongoose";
import QuestionOut from "./question-out.js";
import StudentAnswer from "./student-answer.js";

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  creator: { type: String, required: true },
  questions: [
    {
      qId: { type: String, required: true },
      time: { type: Number, required: false, default: null },
      multiGrades: [
        new mongoose.Schema({
          aId: { type: String, required: true },
          grade: { type: mongoose.Decimal128, required: false, default: 0 },
        }),
      ],
      grade: { type: mongoose.Decimal128, required: false, default: 0 },
    },
  ],
  studentAnswers: [StudentAnswer.schema],
  published: { type: Boolean, required: true },
  code: { type: String, required: true },
  allowBackTraversal: { type: Boolean, required: false },
  totalTime: { type: Number, required: false },
});

//Check if question already a model before exporting
export default mongoose.models?.Test || mongoose.model("Test", testSchema);
