const { default: axios } = require('axios')
const express = require('express')

const app = express()
const port = 8008
app.use(express.json())

app.all('/hello', (req, res) => {
  res.send({response: "Hello from enclave", ...req.body})
});

app.post('/compute', (req, res) => {
  try {
    const { a, b } = req.body;
    return res.send({
      result: a + b
    });
  } catch (err) {
    console.log('An error occurred while computing the sum: ', err);
    return res.status(500).send({
      message: 'An error occurred while computing the sum',
      error: err
    });
  }
});

app.get('/egress', async (_, res) => {
  try {
    const result = await axios.get("https://jsonplaceholder.typicode.com/posts/1")
    res.send({...result.data})
  } catch (err) {
    console.log("Could not send request out of enclave", e)
    return res.status(500).send({
      message: 'An error occurred while calling an external service',
      error: err
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});