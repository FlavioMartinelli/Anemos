class Track {
  constructor(id, title, src) {
    this.id = id
    this.title = title
    this.src = src
    this.istances = 0
    this.volume = 100
    this.delay = 0
  }
}

class Controller {
  constructor(tracks) {
    this._tracks = tracks

  }

  get track() {
    let picked = this.trackPreview
    picked.istances++
    console.log("Picked", picked.title);
    return picked
  }

  get trackPreview() {
    return this._tracks.reduce((pick, t) => {
      return pick.istances > t.istances ? t : pick
    })
  }
}


const express = require('express'),
  async = require('async'), http = require('http'), mysql = require('mysql')
const app = express()
const port = 3333


app.set("view options", {
  layout: false
});
app.use(express.static(__dirname + '/public'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

let startTime = Date.now()

let duration = 1188.8848979591837 * 1000 //ms durata

let tracksUrl = '';
let trackQuery = 'SELECT * FROM `Tracks`';

let devices = []

let counter = 0

let pingTimeout = 5000

let tracks = []
let MANAGER //controller

let reassignmentTargetId = null
let reassignmentTargets = []

setupTracks();

function getCurrentTime() {
  let d = Date.now() - startTime
  if (d > duration) {
    startTime = startTime + duration
  }
  console.log("Giving ", startTime);
  return startTime
}

// async function loopBackTime() {
//   return new Promise((succ, err)=>{
//     startTime = startTime + duration
//     succ(1)
//   })
// }

function setupTracks() {
  //   connection.query(trackQuery, function(err, rows, fields) {
  //     console.log('Connection result error '+err);
  //     tracks = rows;
  // });

  tracks = [
    //TODO: B-c-d-e  singole istanze - ci saranno tante tracce e nessun duplicato
    new Track(0, 'ANuovo', 'ANuovo.mp3'),
    new Track(1, 'BNuovo', 'Bnuovo.mp3'),
    new Track(2, 'CBit', 'C bit.mp3'),
    new Track(3, 'DBit', 'D bit.mp3'),
    new Track(4, 'E', 'E.mp3'),
    new Track(5, 'Gbit nuovo', 'Gbit nuovo.mp3'),
    new Track(6, 'Gbit nuovo', 'Gbit nuovo.mp3'),
    new Track(8, 'Gbit nuovo', 'Gbit nuovo.mp3'),
    new Track(9, 'K slow', 'K slow.mp3'),
    new Track(10, 'K1', 'K prova1.mp3'),
    new Track(11, 'k2', 'k prova2.mp3'),
    new Track(12, 'Z1', 'Z1.mp3'),
    new Track(13, 'Z1', 'Z1.mp3'),
    new Track(14, 'Z1', 'Z1.mp3'),
    new Track(15, 'Z1', 'Z1.mp3'),
    new Track(16, 'Z2', 'Z2.mp3'),
    new Track(17, 'Z2', 'Z2.mp3'),
    new Track(18, 'Z2', 'Z2.mp3'),
    new Track(19, 'Z2', 'Z2.mp3'),
    new Track(20, 'Z2', 'Z2.mp3'),
    new Track(21, 'Z2', 'Z2.mp3'),
    new Track(22, 'Z2', 'Z2.mp3'),
    new Track(23, 'Z2', 'Z2.mp3'),
    new Track(24, 'Z2', 'Z2.mp3'),
    new Track(25, 'Z2', 'Z2.mp3'),
    new Track(26, 'Z2', 'Z2.mp3'),
    new Track(27, 'Z2', 'Z2.mp3'),
    new Track(28, 'Z2', 'Z2.mp3'),
    new Track(29, 'Z2', 'Z2.mp3'),
    new Track(30, 'Z2', 'Z2.mp3'),
    new Track(31, 'Z2', 'Z2.mp3'),
    new Track(32, 'Z2', 'Z2.mp3'),
    new Track(34, 'Z2', 'Z2.mp3'),
    new Track(35, 'Z2', 'Z2.mp3'),
    new Track(36, 'Z2', 'Z2.mp3'),
    new Track(37, 'Z2', 'Z2.mp3'),
    new Track(38, 'Z2', 'Z2.mp3'),
    new Track(39, 'Z2', 'Z2.mp3')
  ]

  MANAGER = new Controller(tracks)
}

function getTrack() {
  return MANAGER.track
}

app.listen(port, () => {
  console.log(`Synch Server Time listening on port ${port}`)
})

app.get('/', (req, res) => {
  res.render('public/index')
})

app.get('/start', (req, res) => {
  console.log("START");
  startTime = Date.now()
  res.send(JSON.stringify(1))
})

app.get('/setup', (req, res) => {
  let t = getTrack()

  counter++

  devices.push({
    id: counter,
    track: t,
    timeout: setTimeout(() => {
      removeDevice(counter)
    }, pingTimeout)
  })


  res.send({
    track: t,
    id: counter
  })
})

app.get('/time', (req, res) => {
  res.send(JSON.stringify(getCurrentTime()))
})

app.get('/track', (req, res) => {
  res.send(JSON.stringify(getTrack()))
})

app.get('/all_tracks', (req, res) => {
  res.send(JSON.stringify(tracks))
})

app.get('/delay', (req, res) => {
  let id = req.query.id
  res.send(tracks.find(x => x.id === id).delay)
})

app.get('/volume', (req, res) => {
  let id = req.query.id
  res.send(tracks.find(x => x.id === id).volume)
})

app.post('/delay', (req, res) => {
  let id = req.body.id
  let delay = req.body.delay
  tracks.find(x => x.id === id).delay = delay;
})

app.post('/volume', (req, res) => {
  let id = req.body.id
  let volume = req.body.volume
  tracks.find(x => x.id === id).volume = volume;
})

app.post('/ping', (req, res) => {
  // console.log(req.body);
  let id = req.body.id
  if(id == -1 ){
    let response = {
      reassign: false,
      error: false
    }
    res.send(JSON.stringify(response));
    return true
  }
  // console.log("PING FROM", id, devices.length);
  let d = getDevice(id)
  if(d == undefined) {
    console.log("EXTRA DEVICE - REMOVING", id);
    // res.send(JSON.stringify({error: true}));
    return
  }
  // console.log("Ping", d.id, d.track.title);
  // console.log(d);
  // console.log("Ping", id, d);
  clearTimeout(d.timeout)
  d.timeout = setTimeout(() => {
    console.log("TIMEOUT", d.id, d.track.title);
    removeDevice(d.id)
  }, pingTimeout)

  let response = {
    reassign: false,
    error: false
  }

  // console.log(reassignmentTargetId);

  // if (reassignmentTargetId && reassignmentTargetId == id) {
  //   console.log("Reassign to", reassignmentTargetId);
  //   reassignmentTargetId = null
  //   removeTrack(d.track)
  //   let replacer = MANAGER.track
  //   d.track = replacer;
  //   response = {
  //     reassign: true,
  //     track: replacer
  //   }
  // }
  // if (reassignmentTargets.length > 0) {
  //   if (reassignmentTargets[0] == id) {
  //     console.log("Reassign to", reassignmentTargets[0]);
  //     reassignmentTargetId = null
  //     removeTrack(d.track)
  //     let replacer = MANAGER.track
  //     d.track = replacer;
  //     response = {
  //       reassign: true,
  //       track: replacer
  //     }
  //   }
  // }


  if (devices[devices.length - 1].id == d.id) {
    if (MANAGER.trackPreview.id < d.track.id) {
      console.log("REPLACING");
      let replacer = MANAGER.track
      removeTrack(d.track)
      d.track = replacer;
      response = {
        reassign: true,
        error: false,
        track: replacer
      }
      devices.sort((a, b) => {
        return a.track.id - b.track.id
      })
      console.log("SORTED");
    }
  }


  res.send(JSON.stringify(response));
  // if(MANAGER.trackPreview.id < d.track.id){
  //   // response = {reassign: true, track: MANAGER.track}
  // }

})

function getDevice(id) {
  // console.log("FINDING", devices.length, id);
  return devices.find((e) => {
    // console.log(e.id, id);
    return e.id == id
  })
}

function removeTrack(t) {
  let ft = tracks.find((e) => e.id == t.id)
  // console.log("REMOVE ft", ft, t);
  ft.istances--
  console.log("Removing Track", t.title);
}

function removeDevice(id) {
  console.log("Removing Device", id);
  // removeTrack();
  // setTargetForReassignFromDevice(devices.filter(e => {
  //   if (e.id == id) return true
  //   return false
  // })[0])
  devices = devices.filter(e => {
    if (e.id != id) return true
    removeTrack(e.track)
    checkReassignment();
    return false
  })
}

function checkReassignment() {
  let missing = MANAGER.trackPreview
  if (missing.id < tracks.length) {}
}

function setTargetForReassignFromDevice(d) {
  console.log("setReass");

  let missingTrack = d.track

  // console.log("MISSING", missingTrack);

  let extraTrack = tracks.slice(missingTrack.id - 1).reduce((tot, el, i, arr) => {
    if (tot.istances > el.istances) return tot
    return el
  })

  let candidate = devices.find(e => {
    // console.log(e, extraTrack)
    e.track.id == extraTrack.id
  })

  // candidate = devices[devices.length - 1]

  // console.log("CANDIDATE", candidate);

  if (candidate && candidate.track.id != missingTrack.length) {
    console.log("reassigning");
    reassignmentTargets.push(candidate.id)
  }
}

function setTargetForReassign() {
  //TODO: pi?? tracce rimosse alla volta
  console.log("setReass");

  let missingTrack = tracks.reduceRight((tot, el, i, arr) => {
    if (tot.istances > el.istances) return el
    return tot
  })

  // console.log("MISSING", missingTrack);

  let extraTrack = tracks.slice(missingTrack.id - 1).reduce((tot, el, i, arr) => {
    if (tot.istances > el.istances) return tot
    return el
  })

  let candidate = devices.find(e => {
    // console.log(e, extraTrack)
    e.track.id == extraTrack.id
  })

  // candidate = devices[devices.length - 1]

  // console.log("CANDIDATE", candidate);

  if (!candidate || candidate.track.id == missingTrack.length) {
    reassignmentTargetId = null
  } else {
    console.log("reassigning");
    reassignmentTargetId = candidate.id
  }
}

// var waiting = false
// function checkForMissingTrack() {
//   if(waiting) return
//   //Get missing track
//   let missing = MANAGER.trackPreview
//   //Check if missing track is last
//   if(missing.id < tracks.length-1) {
//     let notLast = missing.istances < tracks.find(el=> e.id==missing.id+1)
//   }
//   if(!last) {waiting=false; return}

//   //

// }

// setInterval(checkForMissingTrack, 10000)