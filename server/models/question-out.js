class QuestionOut {
  constructor(question) {
    this._id = question._id;
    this.title = question.title;
    this.description = question.description;
    this.image = question.image;
    this.multi = !question.multi ? null : question.multi.map((a) => ({ _id: a._id, image: a.image }));
    this.numMulti = question.numMulti;
    this.category = question.category;
    this.quesionType = question.quesionType;
    this.creator = question.creator;
    this.citation = question.citation;
    this.size = question.size
    this.lives = question.lives
    this.seed = question.seed
    this.randomLevelOrder = question.randomLevelOrder
  }
}

export default QuestionOut;
