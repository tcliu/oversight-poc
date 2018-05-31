/******************************************************************************
 * Oversight POC
 *****************************************************************************/

const OversightEngine = require('./app/oversight-engine')

const { 
  loadPortfolioCsv,
  loadPositionCsv,
  loadPriceCsv
} = require('./app/portfolio-csv-loader')

const loadPortfolios = () => loadPortfolioCsv('data/portfolios/data.csv')
const loadPositions = () => loadPositionCsv('data/positions/data.csv')
const loadPrices = () => loadPriceCsv('data/prices')

const data = {}

const rules = {
  positions: position => position.amount == position.quantity * position._price.close
}

Promise.all([loadPortfolios(), loadPositions(), loadPrices()]).then(values => {
  const [portfolios, positions, prices] = values
  data.portfolios = portfolios
  data.positions = positions
  data.prices = prices

  console.log( JSON.stringify(data, null, 2) )
})
