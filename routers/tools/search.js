const {Lesson} = require('../../models/lesson');
const {User} = require('../../models/user');
const {Student} = require('../../models/student');
//could extract into pipes within lesson model
function findById(id,start,end){
    let promise = new Promise((resolve,reject) => {
        let query = {
            teacher:id
        };
        if(start && end){
            query["date"] = {
                $gte:end,
                $lte:start
            }
        }
        console.log(query);
        return Lesson.find(query).populate('teacher').populate({
            path:'students',
            populate:{
                path:'category'
            }
        }).populate('_lessonType')

        .then(lessons => {
            resolve(lessons)
        })
        .catch(err => {
            reject(err);
        });
    });

    return promise;
}

async function findByLessonId(id){
    try{
        let lesson = await Lesson.findById(id).populate('teacher').populate({
            path:'students',
            populate:{
                path:'category'
            }
        }).populate('_lessonType');

        return lesson;
    }
    catch(e){
        console.warn(e);
    }
}


function findByEmail(email,start,end){
    let promise = new Promise((resolve,reject) => {
        return User.find({email})

        .then(user => {
            let id = user[0]._id;
            return findById(id,start,end);
        })

        .then(lessons => {
            resolve(lessons);
        })

        .catch(err => {
            reject(err);
        });

    });

    return promise;
}

async function findTeacher(teacherId,teacherEmail){
    try{
        if(teacherId){
            let teacher = await User.findById(teacherId);
            return teacher.serialize();
        }
        else{
            let teacher = await User.find({email:teacherEmail});
            return teacher[0].serialize();
        }
    }
    catch(e){
        console.log('error finding teacher: ',e);
        throw e
    }
}

async function findStudent(studentId,first,last){
    try{
        if(studentId){
            let student = await Student.findById(studentId).populate('category');
            return student.serialize();
        }
        else{
            let students = await Student.find({firstName:first,lastName:last});
            students = students.map(student => student.serialize());
            return students;
        }
    }
    catch(e){
        console.log('error finding student: ',e);
        throw e
    }
}

async function queryBuilder(options){
    let {startDate,endDate,studentId,studentFirst,studentLast,teacherId,lessonType,teacherEmail} = options;
    let query = {};
    console.log('options=========',options);
    if(startDate === endDate){
        let start = new Date(startDate);
        let end = new Date(startDate);
        
        query.date = {};
        query.date.$gte = end;
        query.date.$lte = start;
    }
    else if(endDate){
        let start = startDate ? new Date(startDate) : new Date();
        //inclusive of start day
        //start.setDate(start.getDate() + 1);
        let end = endDate ? new Date(endDate) : new Date(start);

        query.date = {};
        query.date.$gte = end;
        query.date.$lte = start;
    }
    if(studentId){
        let student = await findStudent(studentId);
        query.students = student.id;
    }
    else if(studentFirst && studentLast){
        let students = await findStudent(null,studentFirst,studentLast);
        
        //in this caes do multiple queries to get lessons of all students with same name
        //query.students = students.map(student => student.id);
        query.students = students[0].id;
    }

    if(teacherId){
        let teacher = await findTeacher(teacherId);
        query.teacher = teacher.id;
    }
    else if(teacherEmail){
        let teacher = await findTeacher(null,teacherEmail);
        query.teacher = teacher.id;
    }

    return query;
}

async function generalSearch(options){
    let query = await queryBuilder(options);
    console.log(query)
    try {
        const lessons = await Lesson.find(query).populate('teacher').populate({
            path:'students',
            populate:{
                path:'category'
            }
        }).populate('_lessonType');
        return lessons
    } catch (err) {
        throw(err);
    }
}

async function getStudentLastLesson(){
    try{
        const lessons = await Lesson.aggregate([
            {
                "$group": {
                    _id: "$teacher"
                }
            }
        ])
        return lessons;
    }
    catch(e){
        throw e;
    }
}

module.exports = {findById, findByEmail, generalSearch, findByLessonId, getStudentLastLesson};