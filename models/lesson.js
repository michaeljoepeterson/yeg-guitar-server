const mongoose = require('mongoose');

const lessonSchema = mongoose.Schema({
    date:{type:Date,required:true},
    lessonType:{type:String,required:true},
    notes:{type:String},
    students:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Student', unique: false, required: [false, 'No students found']}],
	teacher:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: false, required: [true, 'No teacher found']},
	createdAt:{type:Date},
	lastEdited:{type:Date},
	totalEdits:{type:Number,default:0}
});
//virtual to facilitate joining by string
//also could have just adjusted serialize method
lessonSchema.virtual('_lessonType', {
	ref: 'LessonType',
	localField: 'lessonType',
	foreignField: 'name', 
	justOne: true
});

lessonSchema.methods.serialize = function(){
	//console.log('==========lesson: ',this)
	return {
		id:this._id,
		lessonType:this._lessonType.name,
		students:this.students ? this.students.map(student => student.serialize()) : null,
		teacher:this.teacher ? this.teacher.serialize() : null,
		date:this.date,
		notes:this.notes,
		oldLessonType:this.lessonType
	};
};

lessonSchema.index({date: 1});

const Lesson = mongoose.model("Lesson",lessonSchema);

module.exports = {Lesson};
