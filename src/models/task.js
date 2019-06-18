const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const taskSchema = mongoose.Schema({
    description:{
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    // cara membuat relationship antar documentnya
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task

/** 
const task = new Task({
    description: '    Eat luch'
})

task.save().then((task) => {
    console.log(task)
}).catch((error) => {
    console.log(error)
})
*/