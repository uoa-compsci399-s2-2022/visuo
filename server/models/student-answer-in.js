class StudentAnswerIn {
  constructor(studentAnswer) {
    this.tId = studentAnswer.tId;
    this.sId = studentAnswer.sId;
    this.answers = studentAnswer.answers.map((sa) => ({
      qId: sa.qId,
      aId: sa.aId,
    }));
  }
}

export default StudentAnswerIn;