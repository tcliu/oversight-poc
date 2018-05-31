const fs = require('fs')

const { loadCsv } = require('./utils/csv-loader')
const { constructFieldMappers } = require('./utils/field-mapper-util')

const portfolioFieldMappers = constructFieldMappers({
  num: 'id',
  round_2: 'nav'
})

const positionFieldMappers = constructFieldMappers({
  num: 'portfolio_id',
  round_2: 'quantity,amount'
})

const priceFieldMappers = constructFieldMappers({
  round_2: 'open,high,low,close,adj_close,volume'
})

/**
 * Loads a portfolio from a CSV file.
 * @param path the path of the CSV
 */
const loadPortfolioCsv = path => {
  return loadCsv(path, portfolioFieldMappers)
}

/**
 * Loads portfolio positions from a CSV file.
 * @param path the path of the CSV
 */
const loadPositionCsv = path => {
  return loadCsv(path, positionFieldMappers)
}

/**
 * Loads instrument prices from a CSV file.
 * 
 * Source: 
 * Yahoo Finance HK (https://hk.finance.yahoo.com/)
 * Sample URL:
 * https://query1.finance.yahoo.com/v7/finance/download/0005.HK?period1=1524711473&period2=1527303473&interval=1d&events=history&crumb=0C5lrufdc3b
 *
 * @param path path of the CSV, or the directory which contains the CSV files
 */
const loadPriceCsv = path => {
  const stats = fs.lstatSync(path)
  if (stats.isDirectory()) {
    return loadPriceCsvDir(path)
  } else {
    const instrumentCode = path.replace(/.*\/([^/]+)\.csv/, '$1')
    const filter = o => {
      o.code = instrumentCode
      return o.close
    }
    return loadCsv(path, priceFieldMappers, filter)
  }
}

/**
 * Scans and loads instrument prices from CSV files under a given directory.
 *
 * @param path the path of the directory storing the CSV files
 */
const loadPriceCsvDir = path => new Promise((resolve, reject) => {
  fs.readdir(path, (err, files) => {
    Promise.all(files.map(file => loadPriceCsv(path + '/' + file))).then(values => {
      resolve(values)
    })
  })
})

module.exports = {
  loadPortfolioCsv, 
  loadPositionCsv,
  loadPriceCsv
}