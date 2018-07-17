const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
const fs = require('fs')

// instantiate http server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res)
})

// start http server
httpServer.listen(config.port, () => {
  console.log(`Server listening on port ${config.httpPort}`)
})

// instantiate https server
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
}
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res)
})

// start https server
httpsServer.listen(config.httpsPort, () => {
  console.log(`Server listening on port ${config.httpsPort}`)
})

// all server logic for both http and https
const unifiedServer = (req, res) => {

  // get url and parse it
  const parsedUrl = url.parse(req.url, true)

  // get path and trim it
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // get query string as an object
  const queryStringObject = parsedUrl.query
  
  // get http method
  const method = req.method.toLowerCase()
  
  // get headers as an object
  const headers = req.headers
  
  // get payload, if any
  const decoder = new StringDecoder('utf-8')
  let buffer = ''
  
  req.on('data', (data) => {
    buffer += decoder.write(data)
  })
  
  req.on('end', () => {
    buffer += decoder.end()
    
    const chosenRouteHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : routeHandlers.notFound
    
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer,
    }
    
    chosenRouteHandler(data, (statusCode, payload) => {
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200
      payload = typeof(payload) == 'object' ? payload : {}
      
      const payloadString = JSON.stringify(payload)
      
      // specify that we're returning the response to the user in JSON
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode)
      res.end(payloadString)
      
      console.log('Returning this response:', statusCode, payloadString)
    })
  })
}

const routeHandlers = {}

// routeHandlers.sample = (data, cb) => cb(406, { 'name': 'sample handler' })

// ping handler
routeHandlers.ping = (data, cb) => {
  cb(200)
}

// not found handler
routeHandlers.notFound = (data, cb) => {
  cb(404)
}

const router = {
  // 'sample': routeHandlers.sample
  ping: routeHandlers.ping,

}
