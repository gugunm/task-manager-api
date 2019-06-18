const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = express.Router()


router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        // cara copy semua isi object ...
        ...req.body,
        owner: req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

// GET /tasks?completed=true    >> query string (FILTERING) dengan populate
// GET /tasks?limit=2&skip=2    >> query string pagination
// GET /tasks?sortBy=createdAt:desc >> Sorting data, desc == -1, asc == 1
router.get('/tasks', auth, async (req, res) => {
    try {
        const match = {}
        const sort = {}

        if(req.query.completed) {
            match.completed = req.query.completed === 'true'
        }

        if(req.query.sortBy) {
            // nge split query string yang dibagi 2 oleh ':'
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 // ini namanya ternari operation
        }

        /** CARA 2 */
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch(e) {
        res.status(500).send()
    }

})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try{
        // const task = await Task.findById(_id)

        // cari task miliknya si user A / B
        const task = await Task.findOne({ _id, owner: req.user._id })

        if(!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch(e) {
        res.status(500).send()
    }

})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({ error: 'Invalid updates!'})
    }

    try{
        const task = await Task.findOne({ _id:req.params.id, owner: req.user._id })
        
        if(!task){
            res.status(404).send()
        }
        
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id:req.params.id, owner:req.user._id})

        if(!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router