const https = require('https');
const fs = require('fs')

demtype = "SRTMGL3"
south = "45"
north = "45.005"
west = "-72.005"
east = "-72"
outputFormat = "AAIGrid"
API_Key = ""

request = `https://portal.opentopography.org/API/globaldem?demtype=${demtype}&south=${south}&north=${north}&west=${west}&east=${east}&outputFormat=${outputFormat}&API_Key=${API_Key}`
//request = "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY"

// https.get(request, (res) => {
//   let data = '';

//   res.on('data', (data) => {
//       console.log(data.toString())
//       fs.appendFileSync("./output.txt", data.toString())
//   })
// }).on("error", (err) => {
//   console.log("Error: " + err.message);
// });

const SCALE = 10
const AAIGRID_OFFSET = 13
const MIN_HEIGHT = -80

// acquire base data
let dataToCompile = fs.readFileSync("./output.txt", 'utf-8')
let arraysToCompile = dataToCompile.split('\n')
let ncols = arraysToCompile[0].slice(AAIGRID_OFFSET) // vertical
let nrows = arraysToCompile[1].slice(AAIGRID_OFFSET) // horizontal
let xllcorner = arraysToCompile[2].slice(AAIGRID_OFFSET) //bottom left corner X in degrees
let yllcorner = arraysToCompile[3].slice(AAIGRID_OFFSET) // bottom left corner Y in degrees
let cellsize = arraysToCompile[4].slice(AAIGRID_OFFSET) // length of a cell in degrees
let NODATA_value = arraysToCompile[5].slice(AAIGRID_OFFSET) // value that appears in the data array if there is no value to be shown

//console.log(`${ncols}, ${nrows}, ${xllcorner}, ${yllcorner}, ${cellsize}, ${NODATA_value}`)

let scaledArrayToCompile = []

arraysToCompile.forEach((val, idx) => {
    if(idx > 5) {
        val = val.trim() //removes whitespaces
        val = val.split(' ') //separates all values by spaces
        let tempArrayToCompile = []
        val.forEach((val2, idx2) => {
            if(val2 == NODATA_value) {
                tempArrayToCompile[idx2] = MIN_HEIGHT
            } else {
                tempArrayToCompile[idx2] = val2 *= SCALE
            }
        })
        scaledArrayToCompile[idx - 6] = tempArrayToCompile
    }
})

const SRTMGL3_RESOLUTION_METERS = 90
const LENGTH_OF_PIXEL = 153

let pixels = Math.floor((scaledArrayToCompile.length * SRTMGL3_RESOLUTION_METERS) / LENGTH_OF_PIXEL)
//let pixels = 1281
let chunks = pixels / 20

let compilingPlan = []
let distanceCompiled = 0
let previousDistanceCompiled = 0
let dataPointsCompiled = 0
//let totalDataPoints = scaledArrayToCompile.length

for(let idx = 0; idx <= pixels; idx++) {
    distanceToCompile = (LENGTH_OF_PIXEL * (idx + 1)) - distanceCompiled

    pointsToCompile = Math.round(distanceToCompile / SRTMGL3_RESOLUTION_METERS)
    compilingPlan[idx] = pointsToCompile

    dataPointsCompiled += pointsToCompile

    distanceCompiled = dataPointsCompiled * SRTMGL3_RESOLUTION_METERS

    previousDistanceCompiled = distanceCompiled
}

let dataPointsCompiledX = 0
let dataPointsCompiledY = 0
let map = []

for(let idxX = 0; idxX < pixels - 1; idxX++) {
    let finalZValue = 0
    let finalZArray = []
    dataPointsCompiledX = 0
    for(let idxY = 0; idxY < pixels - 1; idxY++) {
        dataPointsToCompile = compilingPlan[idxY]

        let averageSum = 0

        for(let idxDPX = 0; idxDPX < dataPointsToCompile; idxDPX++) {
            for(let idxDPY = 0; idxDPY < dataPointsToCompile; idxDPY++) {
                console.log(idxDPX)
                console.log(dataPointsCompiledX)
                console.log(idxDPY)
                console.log(dataPointsCompiledY)
                averageSum += scaledArrayToCompile[idxDPX + dataPointsCompiledX][idxDPY + dataPointsCompiledY]
            }
            dataPointsCompiledX++
        }

        finalZValue = averageSum / (Math.pow(dataPointsToCompile, 2))
        //console.log(finalZValue)

        finalZArray[idxY] = finalZValue
    }
    map[idxX] = finalZArray
    dataPointsCompiledY += compilingPlan[idxX]
}

console.log(map)