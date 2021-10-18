const express = require('express');
const {Lesson} = require('../models/lesson');
const router = express.Router();
const passport = require('passport');
const {findById,findByEmail,generalSearch} = require('./tools/search');
const {totalHours,totalStudents,hourBreakdown} = require('./tools/hours');
const ExtractJwt = require('passport-jwt').ExtractJwt;
//const {checkAdminEmails,checkEmail,checkUser,checkAdminLocs} = require('../tools/toolExports');
const jwtAuth = passport.authenticate('jwt', { session: false });
const {levelAccess} = require('../tools/toolExports');
router.use(jwtAuth);

router.post('/',async (req,res) => {
    const {date,lessonType,notes,students,teacher} = req.body;
    console.log(req.body);
    try {
        const lesson = await Lesson.create({
            date,
            lessonType,
            notes,
            students,
            teacher
        });
        return res.json({
            code: 200,
            message: 'Lesson created'
        });
    } catch (err) {
        console.log('error ', err);
        if (err.message.includes('E11000')) {
            return res.json({
                code: 401,
                message: 'Lesson already exists'
            });
        }
        return res.json({
            code: 500,
            message: 'an error occured'
        });
    }
    
});

router.get('/',(req,res) => {
    //return Lesson.find({}).populate('students').populate('teacher')
    return Lesson.find({}).populate('teacher').populate({
        path:'students',
        populate:{
            path:'category'
        }
    })
    .then(lessons => {
       return res.json({
            code:200,
            lessons:lessons.map(lesson => lesson.serialize())
        }); 
    })

    .catch(err => {
        return res.json({
            code:500,
            message:'an error occured',
            error:err
        });
    });
});

router.get('/my-lessons',(req,res) => {
    let {id,email,startDate,endDate} = req.query;
    let start = startDate ? new Date(startDate) : new Date();
    //inclusive of start day
    start.setDate(start.getDate() + 1);
    let end = endDate ? new Date(endDate) : new Date(start);
    if(!endDate){
        const defaultRange = 30;
        end.setDate(end.getDate() - 30);
    }
    //inclusive of end day
    end.setDate(end.getDate() - 1);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    console.log(id,email,findById);
    if(id){
        return findById(id,start,end)

        .then(lessons => {
            return res.json({
                code:200,
                lessons:lessons.map(lesson => lesson.serialize())
            }); 
        })
        .catch(err => {
            return res.json({
                code:500,
                message:'an error occured',
                error:err
            });
        });
    }
    else if(email){
        return findByEmail(email,start,end)

        .then(lessons => {

            return res.json({
                code:200,
                lessons:lessons.map(lesson => lesson.serialize())
            }); 
        })
        .catch(err => {
            return res.json({
                code:500,
                message:'an error occured',
                error:err
            });
        });
    }
    
});

function createUpdateData(body){
    let data = {};
    let today = new Date();
    for(let field in body){
        data[field] = body[field];
    }
    //pass from browser?
    data.lastEdited = data.lastEdited ? data.lastEdited : today;

    return data;
}

router.put('/:id',async (req,res) => {
    let {id} = req.params;
    const updateData = createUpdateData(req.body);

    try {
        const response = await Lesson.findOneAndUpdate({ '_id': id }, {
            $set: updateData,
            $inc: { "totalEdits": 1 }
        }, {
            useFindAndModify: false
        });
        return res.json({
            code: 200,
            message: 'Lesson Updated'
        });
    } catch (err) {
        console.log('Error updating lesson ', err);
        return res.json({
            code: 500,
            message: 'Error Updating lesson',
            error: err.errmsg
        });
    }
});

router.get('/summary',(req,res) => {
    let {id,email,startDate,endDate} = req.query;
    let start = startDate ? new Date(startDate) : new Date();
    //inclusive of start day
    //start.setDate(start.getDate() + 1);
    let end = endDate ? new Date(endDate) : new Date(start);
    if(!endDate){
        const defaultRange = 30;
        end.setDate(end.getDate() - 30);
    }
    //inclusive of end day
    //end.setDate(end.getDate() - 1);
    //start.setHours(0,0,0,0);
    //end.setHours(0,0,0,0);
    console.log(id,email);
    if(id){
        return findById(id,start,end)

        .then(lessons => {
            let lessonData = {};
            let serializedLessons = lessons.map(lesson => lesson.serialize());
            console.log('num lessons: ',serializedLessons.length);
            lessonData.totalHours = totalHours(serializedLessons);
            lessonData.totalStudents = totalStudents(serializedLessons);
            let hourData = hourBreakdown(serializedLessons);
            lessonData.hours = hourData[0];
            lessonData.students = hourData[1];
            return res.json({
                code:200,
                lessonData
            }); 
        })
        .catch(err => {
            return res.json({
                code:500,
                message:'an error occured',
                error:err
            });
        });
    }
    else if(email){
        return findByEmail(email,start,end)

        .then(lessons => {
            let lessonData = {};
            let serializedLessons = lessons.map(lesson => lesson.serialize());
            lessonData.totalHours = totalHours(serializedLessons);
            lessonData.totalStudents = totalStudents(serializedLessons);
            let hourData = hourBreakdown(serializedLessons);
            lessonData.hours = hourData[0];
            lessonData.students = hourData[1];
            return res.json({
                code:200,
                lessonData
            }); 
        })
        .catch(err => {
            return res.json({
                code:500,
                message:'an error occured',
                error:err
            });
        });
    }
    
});
//to do error handler middleware at server leel
router.get('/search-student',async (req,res) => {
    let {id} = req.query;
    try{
        let lessons = await Lesson.find({students:id}).populate('teacher').populate({
            path:'students',
            populate:{
                path:'category'
            }
        }).populate('_lessonType');
        return res.json({
            code:200,
            lessons:lessons.map(lesson => lesson.serialize())
        });
    }
    catch(err){
        console.log(err);
        return res.json({
            code:500,
            message:'an error occured',
            error:err
        });
    }
});


router.get('/search',async (req,res) => {
    //to do user secure endpoints
    //console.log(req.user);
    let {startDate,endDate,teacherEmail,studentId,teacherId} = req.query;
    let searchOptions = {
        startDate,
        endDate,
        teacherEmail,
        studentId,
        teacherId
    };
    try{
        let lessons = await generalSearch(searchOptions)
        return res.json({
            code:200,
            lessons:lessons.map(lesson => lesson.serialize())
        });
    }
    catch(err){
        console.log(err);
        res.status(500);
        return res.json({
            code:500,
            message:'an error occured',
            error:err
        });
    }
});

router.delete('/:id',levelAccess(1),async (req,res) => {
    let {id} = req.params;
    try{
        await Lesson.findByIdAndDelete(id);
        res.status(200);
        return res.json({
            message:'Lesson deleted'
        });
    }
    catch(e){
        console.log(e);
        res.status(500);
        return res.json({
            code:500,
            message:'an error occured',
            error:e
        });
    }
});

module.exports = {router};