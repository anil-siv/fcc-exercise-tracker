const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

var db = mongoose.connection

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});


const userSchema = mongoose.Schema({
    username: String,
    exercises: [{
        description: String,
        duration: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }]
})

const USER_MODEL = mongoose.model('user', userSchema)

app.post('/api/exercise/new-user', (req, res) => {
    let userName = req.body.username;

    let userSubmit = new USER_MODEL({
        username: userName
    })

    userSubmit.save((err, user) => {
        if (err) console.log(err);
        res.json({
            username: user.username,
            _id: user._id
        })
    })

})

app.post('/api/exercise/add', (req, res) => {
    let userId = req.body.userId
    let exerciseDescription = req.body.description;
    let exerciseDuration = parseInt(req.body.duration);
    if (req.body.date) {
        //  console.log('reqbodydate' + req.body.date)
        let exerciseDate = req.body.date
    }
    //console.log(req.body)
    USER_MODEL.findOne({
        _id: userId
    }, (err, data) => {
        if (err) console.log(err);
        if (req.body.date) {
            //  console.log(data);
            data.exercises.push({
                description: exerciseDescription,
                duration: exerciseDuration,
                date: new Date(req.body.date)
            })
            data.save((err, data) => {
                if (err) console.log(err);
                //console.log(data);
                res.json({
                    username: data.username,
                    _id: data._id,
                    description: data.exercises[data.exercises.length - 1].description,
                    duration: data.exercises[data.exercises.length - 1].duration,
                    date: data.exercises[data.exercises.length - 1].date.toDateString()
                })
            })

        } else {
            data.exercises.push({
                description: exerciseDescription,
                duration: exerciseDuration
            })
            //console.log(data)
            data.save((err, data) => {
                if (err) console.log(err);
                res.json(data)
            })
        }

    })



})

app.get('/api/exercise/users', (req, res) => {
    USER_MODEL.find({}, (err, data) => {
        if (err) console.log(err);
        let arr = []
        data.forEach(elem => arr.push({
            username: elem.username,
            _id: elem._id
        }));
        res.json(arr)
    })
})

app.get('/api/exercise/log', (req, res) => {
    console.log(req.query)
    let lookupId = req.query.userId

    let lookupObj = {
        _id: lookupId,
    }

    let fromDate = new Date(req.query.from).toDateString()
    let toDate = new Date(req.query.to).toDateString()


    let query = USER_MODEL.findOne(lookupObj)

    query.exec((err, data) => {
        if (err) console.log(err);
        let cleanedArr = [];
        data.exercises.forEach(elem => cleanedArr.push({
            description: elem.description,
            duration: elem.duration,
            date: elem.date.toDateString()
        }))

        if (req.query.from) {
            cleanedArr = cleanedArr.filter(elem => new Date(elem.date) > new Date(fromDate))
        }


        if (req.query.to) {
            cleanedArr = cleanedArr.filter(elem => new Date(elem.date) < new Date(toDate))
        }
        if (req.query.limit) {
            cleanedArr = cleanedArr.splice(0, req.query.limit)
        }

        res.json({
            username: data.username,
            _id: data._id,
            count: cleanedArr.length,
            log: cleanedArr
        })
    })


})


const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
