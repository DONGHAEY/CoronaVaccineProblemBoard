const mongoose = require("mongoose")


const newsSchema = new mongoose.Schema({
    title : {
        type:String,
        maxlength:100,
    },
    image : {
        type:String,
        maxlength:1000
    },
    link : {
        type:String,
        maxlength:1000
    },
    source : {
        type:String,
        maxlength:100
    },
    time : {
        type:String,
        maxlength:30
    },
    date : {
        type:String,
        default:new Date().toLocaleDateString(),
    }
})

const News = mongoose.model('News', newsSchema)

module.exports = {News}