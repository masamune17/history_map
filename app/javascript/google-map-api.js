import { Marker, clickColor } from './marker_info.js'
import { searchYear } from './search_year.js'
export let map

const inputWord = document.getElementById('search-box')
const wordValue = 100

let searchResults
let inputYear = document.getElementById('year')
let currentValueElem = document.getElementById('current-value')

function rangeOnChange (year) {
  setCurrentValue(year.target.value)
}

function updateResult (input) {
  const resultsElement = '<div id="search-results" class="search-results"></div>'
  const keyword = input.target.value
  const minimumCharacterLimit = 2
  const searchResultElement = document.getElementById('search-results')
  if (searchResultElement !== null) {
    searchResultElement.remove()
  }
  if (minimumCharacterLimit <= keyword.length) {
    document.getElementById('search-items').insertAdjacentHTML('afterend', resultsElement)
    outputResult(keyword)
  }
}

async function outputResult (keyword) {
  const searcheWordApi = await searchKeyword(keyword)
  searchResults = searcheWordApi
  let results = ''
  const resultsArray = []
  for (let i = 0; i < searchResults.length; i++) {
    const labelSearch = searchResults[i].label.toLowerCase().indexOf(keyword)
    if (labelSearch !== -1) {
      const result = generateResult(keyword, searchResults[i].label, i, true)
      results += result
      resultsArray.push(i)
    }
  }
  for (let i = 0; i < searchResults.length; i++) {
    const labelSearch = searchResults[i].label.toLowerCase().indexOf(keyword)
    if (labelSearch === -1) {
      const abstractSearch = searchResults[i].abstract.toLowerCase().indexOf(keyword)
      if (abstractSearch !== -1) {
        const start = (abstractSearch >= wordValue / 2) ? abstractSearch - wordValue / 2 : 0
        const result = generateResult(keyword, searchResults[i].abstract.substr(start, wordValue), i, false)
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
  const matchWord = matchSentence.replace(/　/g, ' ').replace( // eslint-disable-line
    pattern,
    '<strong class=\'matched_word\'>$&</strong>'
  )
  let resultElement
  if (jugeLabel) {
    resultElement = `<div class="search-result" id="search-result${arrayNum}" value="${arrayNum}">` +
    `<div class='search-result__title'>${matchWord}</div>` +
    '</div>'
  } else {
    resultElement = `<div class="search-result" id="search-result${arrayNum}" value="${arrayNum}">` +
    `<div class='search-result__title'>${searchResults[arrayNum].label.substr(0, wordValue)}</div>` +
    `<div class='search-result__body'><p>${matchWord}</p></div>` +
    '</div>'
  }
  return resultElement
}

function clickResult (arrayNum) {
  document.getElementById(`search-result${arrayNum}`).addEventListener('click', async function () {
    const resultYear = Math.floor(Number(searchResults[arrayNum].accrual_date.slice(0, -6)) / 100) * 100
    const resultSlidesr = `<p class="year"><span id="current-value">${resultYear}</span> Year</p>` +
    `<input type="range" id="year" min="-400" max="2000" step="100" value="${resultYear}">`
    document.getElementById('slider-container').innerHTML = resultSlidesr
    setSlider()
    Marker.showMarker(resultYear)
    Marker.showMarkerInfo(searchResults[arrayNum])
    const searcheEraAPI = await searchYear(resultYear)
    let makerNum
    for (let i = 0; i < searcheEraAPI.length; i++) {
      if (searcheEraAPI[i].id === searchResults[arrayNum].id) {
        makerNum = i
      }
    }
    Marker.changeColor(makerNum, clickColor)
    map.panTo(new google.maps.LatLng(searchResults[arrayNum].latitude, searchResults[arrayNum].longitude)) // eslint-disable-line
  }, false)
}

function setSlider () {
  inputYear = document.getElementById('year')
  currentValueElem = document.getElementById('current-value')
  inputYear.addEventListener('input', rangeOnChange)
}

function searchKeyword (keyword) {
  const url = '/api/maps/searche_word'
  const data = { keyword: keyword }
  const queryParams = new URLSearchParams(data)
  return fetch(`${url}?` + queryParams) // eslint-disable-line
    .then(response => response.json())
}

// mapOptions.js

// googlemapを立ち上げるok
function initMap () {
  const mapOptions = {
    center: {
      lat: 41,
      lng: 12
    },
    zoom: 4,
    disableDefaultUI: true
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions) // eslint-disable-line
}

// 検索ボタンを押下した際のアクションok
function searchButtonAction () {
  const searchItemElement = document.getElementById('search-items-container')
  document.getElementById('search-btn').addEventListener('click', function () {
    if (searchItemElement.classList.length === 1) {
      searchItemElement.classList.add('fadein-search-items')
    } else if (searchItemElement.classList.contains('fadeout-search-items')) {
      searchItemElement.classList.add('fadein-search-items')
      searchItemElement.classList.remove('fadeout-search-items')
    } else {
      searchItemElement.classList.add('fadeout-search-items')
      searchItemElement.classList.remove('fadein-search-items')
    }
  })
}

// 年代スライダーに初期の値を入れる
function setCurrentValue (val) {
  currentValueElem.innerText = val
  const era = Number(val)
  Marker.showMarker(era)
}

// htmlを読み込み次第実行する初期操作
window.onload = function () {
  initMap()
  searchButtonAction()
  setCurrentValue(inputYear.value)
  inputYear.addEventListener('input', rangeOnChange)
  inputWord.addEventListener('input', updateResult)
}
