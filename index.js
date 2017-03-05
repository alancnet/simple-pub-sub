const express = require('express');
const expressWs = require('express-ws');
const { RxRpc } = require('rx-rpc');
const { Subject } = require('rxjs');
const app = express();
expressWs(app);
const bus = {}
function getLogic() {
  const logic = {
    getTopic: (name) => {
      if (!bus.hasOwnProperty(name)) {
        bus[name] = new Subject();
      }
      return bus[name];
    },
    publish: (name, obj) => {
      logic.getTopic(name).next(obj);
    }
  };
  return logic;
}

app.get('/', (req, res) => {
  res.end("Hello World");
})

app.ws('/pubsub', function(ws, req) {
  const logic = getLogic();
  const left = new RxRpc({ provider: logic });
  left.output.forEach((obj) => ws.send(JSON.stringify(obj)));
  ws.on('message', function(msg) {
    left.input.next(JSON.parse(msg));
    // TODO Teardown
  });
  ws.on('close', () => {
    left.input.complete();
  })
  left.call('initialize');
});

app.listen(3000);
