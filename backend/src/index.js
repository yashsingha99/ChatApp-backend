const { default: mongoose } = require('mongoose')
const  app  = require('./app')



//* DB CONNECTION .....
const dbURI = process.env.MONGODB_URI
const connectdb = async()=>{
  try {
    const connect = await mongoose.connect(dbURI)
     console.log("database is connected!!");
  } catch (error) {
    console.log("database isn't connected ", error);
  }
}
console.log(process.env.MONGODB_URI);
connectdb();


const port = process.env.PORT || 5000

const server = app.listen(port ,console.log("server is running....."))

