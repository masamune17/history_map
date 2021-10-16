const originColor = 'red'
const clickColor = 'blue'
const markers = []
const input = document.getElementById('search-box')
const wordValue = 100
const markerData = JSON.parse(document.querySelector('#marker-data').dataset.position)
let map
let inputElem = document.getElementById('era')
let currentValueElem = document.getElementById('current-value')

input.addEventListener('input', updateResult)

const setCurrentValue = (val) => {
  currentValueElem.innerText = val
  const era = Number(val)
  showMarker(era)
}

const rangeOnChange = (e) => {
  setCurrentValue(e.target.value)
}

inputElem.addEventListener('input', rangeOnChange)

function initMap () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 41,
      lng: 12
    },
    zoom: 4
  })
}

function showMarker (selectedEra) {
  for (let i = 0; i < markerData.length; i++) {
    const year = Number(markerData[i].accrual_date.slice(0, -6))
    if (selectedEra <= year && year < selectedEra + 100) {
      if (markers[i] == null) {
        const markerLatLng = new google.maps.LatLng({
          lat: markerData[i].latitude,
          lng: markerData[i].longitude
        })

        markers[i] = new google.maps.Marker({
          position: markerLatLng,
          map: map,
          icon: pinSymbol(originColor)
        })
        markerEvent(i)
      }
    } else {
      if (markers[i] != null) {
        markers[i].setMap(null)
      }
      markers[i] = null
    }
  }
}

function markerEvent (i) {
  markers[i].addListener('click', function () {
    showMarkerInfo(i)
    changeColor(i, clickColor)
  })
}

function showMarkerInfo (i) {
  document.getElementById('accrual_date').innerHTML = markerData[i].accrual_date
  document.getElementById('label').innerHTML = markerData[i].label.replace(/　/g, ' ')
  document.getElementById('abstract').innerHTML = markerData[i].abstract.replace(/　/g, ' ')
}

function updateResult (input) {
  const resultsElement = '<div id="search-results" class="search-results"></div>'
  const keyword = input.target.value
  if (keyword === '') {
    document.getElementById('search-results').remove()
  } else {
    if (document.getElementById('search-results') !== null) document.getElementById('search-results').remove()
    document.getElementById('search-items').insertAdjacentHTML('afterend', resultsElement)
    outputResult(keyword)
  }
}

function outputResult (keyword) {
  let results = ''
  const resultsArray = []
  for (let i = 0; i < markerData.length; i++) {
    const labelSearch = markerData[i].label.toLowerCase().indexOf(keyword)
    if (labelSearch !== -1) {
      const result = generateResult(keyword, markerData[i].label, i, true)
      results += result
      resultsArray.push(i)
    }
  }
  for (let i = 0; i < markerData.length; i++) {
    const labelSearch = markerData[i].label.toLowerCase().indexOf(keyword)
    if (labelSearch === -1) {
      const abstractSearch = markerData[i].abstract.toLowerCase().indexOf(keyword)
      if (abstractSearch !== -1) {
        const start = (abstractSearch >= wordValue / 2) ? abstractSearch - wordValue / 2 : 0
        const result = generateResult(keyword, markerData[i].abstract.substr(start, wordValue), i, false)
        results += result
        resultsArray.push(i)
      }
    }
  }
  document.getElementById('search-results').innerHTML = results
  if (results !== '') {
    for (let i = 0; i < resultsArray.length; i++) {
      clickResult(resultsArray[i])
    }
  }
}

function generateResult (keyword, matchSentence, arrayNum, jugeLabel) {
  const wordsPattern = keyword
    .trim()
    .replaceAll(/[.*+?^=!:${}()|[\]/\\]/g, '\\$&')
  const pattern = new RegExp(wordsPattern, 'i')
  const matchWord = matchSentence.replace(/　/g, ' ').replace(
    pattern,
    '<strong class=\'matched_word\'>$&</strong>'
  )
  let resultElement
  if (jugeLabel) {
    resultElement = `<div class="search-result" id="search-result${arrayNum}" value="${arrayNum}">` +
    `<p class='search-result' >${matchWord}</p>` +
    '</div>'
  } else {
    resultElement = `<div class="search-result" id="search-result${arrayNum}" value="${arrayNum}">` +
    `<small class='search-result'>名称：${markerData[arrayNum].label.substr(0, wordValue)}</small></br>` +
    `<p class='search-result' id="test">${matchWord}</p>` +
    '</div>'
  }
  return resultElement
}

function clickResult (arrayNum) {
  document.getElementById(`search-result${arrayNum}`).addEventListener('click', function () {
    const resultEra = Math.floor(Number(markerData[arrayNum].accrual_date.slice(0, -6)) / 100) * 100
    const resultSlidesr = `<p>西暦<span id="current-value">${resultEra}</span>年代</p>` +
    `<input type="range" id="era" min="-400" max="2000" step="100" value="${resultEra}">`
    document.getElementById('tag-container').innerHTML = resultSlidesr
    setSlider()
    showMarker(resultEra)
    showMarkerInfo(arrayNum)
    changeColor(arrayNum, clickColor)
    map.panTo(new google.maps.LatLng(markerData[arrayNum].latitude, markerData[arrayNum].longitude))
  }, false)
}

function setSlider () {
  inputElem = document.getElementById('era')
  currentValueElem = document.getElementById('current-value')
  inputElem.addEventListener('input', rangeOnChange)
}

function pinSymbol (color) {
  return {
    path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#000',
    strokeWeight: 2,
    scale: 1
  }
}
function changeColor (i, color) {
  restoreColors()
  markers[i].setIcon(pinSymbol(color))
}
function restoreColors () {
  for (let i = 0; i < markers.length; i++) {
    if (markers[i] != null) {
      markers[i].setIcon(pinSymbol(originColor))
    }
  }
}

window.onload = function () {
  initMap()
  setCurrentValue(inputElem.value)
}
