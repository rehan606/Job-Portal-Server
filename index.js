const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000
const app = express();


app.use(cors());
app.use(express.json());







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwii9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    // JOb Related Api 
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const jobApplication = client.db('jobPortal').collection('job_application');

    // normal data display method 
    // app.get('/jobs', async(req, res) => {
    //     const cursor = jobsCollection.find();
    //     const result = await cursor.toArray()
    //     res.send(result)
        
    // })

    // conditional data display method 
    app.get('/jobs', async(req, res) => {
        const email = req.query.email;
        let query = {}
        if(email){
          query = { hr_email: email}
        }
        const cursor = jobsCollection.find(query);
        const result = await cursor.toArray()
        res.send(result)
        
    })

    // Create job 
    app.post('/jobs', async(req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob)
      res.send(result)
    })

    app.get('/jobs/:id', async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await jobsCollection.findOne(query);
        res.send(result)
    })

    // JOb application apis 
    app.post('/job-applications', async(req, res) => {
        const application = req.body;
        const result = await jobApplication.insertOne(application);

        // Count application 
        const id = application.job_id;
        const query = { _id: new ObjectId(id)}
        const job = await jobsCollection.findOne(query);

        let newCount = 0;
        if(job.applicationCount){
          newCount = job.applicationCount + 1 ;
        }else{
          newCount = 1 ;
        }

        // Update count in job info 
        const filter = { _id: new ObjectId(id)};
        const updateDoc = {
          $set:{
            applicationCount: newCount
          }
        }

        const updateResult = await jobsCollection.updateOne(filter, updateDoc)

        res.send(result)

    })

    // View Application 
    app.get('/job-applications/jobs/:job_id', async(req, res) =>{
      const jobId = req.params.job_id;
      const query = { job_id: jobId}
      const result = await jobApplication.find(query).toArray();
      res.send(result)
    })

    // Load User application 
    app.get('/job-application', async(req, res)=> {
      const email = req.query.email
      const query = { applicent_email: email }
      const result = await jobApplication.find(query).toArray();

      // send job details to application table  by job_id (optional) 
      for(const application of result){
        const query1 = { _id: new ObjectId(application.job_id)}
        const job = await jobsCollection.findOne(query1);

        if(job){
          application.title = job.title;
          application.company = job.company; 
          application.location = job.location;
          application.company_logo = job.company_logo;
        }
      }
      res.send(result)
    })

    // APplication UpdateStatus
    app.patch('/job-applications/:id', async(req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          status: data.status
        }
      }
      const result = await jobApplication.updateOne(filter, updateDoc);
      res.send(result)
    }) 

    

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Job server is Running')
})

app.listen(port, () => {
    console.log(`server running by port ${port}`);
    
})