const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

const router = express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)

        const token = await user.generateAuthToken()       
        res.status(201).send({ user, token })
    } catch(e) {
        res.status(400).send()
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        // pake user 'u' karena generateauth untuk spesifik user
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch(e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async(req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({ error: 'invalid updates!'})
    }
    
    try {
        // update setiap elemen yang ada di body
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        res.send(req.user)
    } catch(e) {
        res.status(400).send()
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch(e) {
        res.status(500).send(e)
    }
})

/** ========= UPLOAD AND DELETE PROFILE PICTURE ========= */
const upload = multer({
    // dest: 'avatars'
    limits: {
        // 1 mb == 1,000,000
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        // filtering tipe file dengan reguler expression (.match) $ <- untuk mengakhiri batas regex
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Please upload an images'))
        } 

        callback(undefined, true)
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // ubah ukuran gambar dan convert ke png dengan >> npm sharp
    const buffer = await sharp(req.file.buffer).resize({ width:250, height:250 }).png().toBuffer()
    req.user.avatar = buffer //req.file.buffer // file bisa di ambil disini, kalau multer menghapus 'dest' didalamnya
    await req.user.save()
    res.send()
}, (error, req, res, next) => { // untuk handle middleware error
    res.status(400).send({ error: error.message })
})

/** ========= DELETE PROFILE PICTURE ========= */
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

/** ========= SERVING OR READ PROFILE PICTURE ========= */
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user) {
            throw new Error()
        }
        // untuk set header, tipe file yang dikirim
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})


module.exports = router

/**
router.get('/users/:id', async (req, res) => {
const _id = req.params.id

try{
    const user = await User.findById(_id)
    if(!user){
        return res.status(404).send()
    }
    res.send(user)
} catch(e) {
    res.status(500).send()
}
})

router.patch('/users/:id', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({ error: 'invalid updates!'})
    }

    try{
        // pake versi ini, karena biar ada event 'save' dan bisa masuk ke middlewarenya mongoose
        const user = await User.findById(req.params.id)
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()

        // new: true, untuk update data user lama ke yang baru
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

        if(!user) {
            return res.status(404).send()
        }

        res.send(user)
    } catch(e) {
        res.status(400).send(e)
    }
})
 */