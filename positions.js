const { 
  generateCypher, 
  belongToProperty 
} = require('./app/cypher-generator.js')

// some dummy data
const dummy = {
  name: 'Something',
  something1: {
    name: 'Something1',
    something2: {
      name: 'Something2',
      something3: [{
        name: 'Something3A',
        value: 123
      }, {
        name: 'Something3B',
        value: 456,
        something4: {
          name: 'Something4',
          value: 789
        }
      }]
    }
  }
}

// prepare data
const instruments = [{
  id: 1,
  name: "Cheung Kong",
  marketSector: "Stock",
  listingDate: "1972-01-01",
  codes: [{
    source: "HKEX",
    code: "0001.HK"
  }, {
    source: "ABC",
    code: "000001"
  }],
  dummy: dummy
},{
  id: 2,
  name: "China Light Power",
  marketSector: "Stock",
  listingDate: "1972-01-01",
  codes: [{
    source: "HKEX",
    code: "0002.HK"
  }, {
    source: "ABC",
    code: "000002"
  }]
}]

const prices = [{
  instrumentId: 1,
  close: 83,
  date: '2018-05-25'
}, {
  instrumentId: 2,
  close: 81,
  date: '2018-05-25'
}, {
  instrumentId: 1,
  close: 82.5,
  date: '2018-05-24'
}, {
  instrumentId: 2,
  close: 80.8,
  date: '2018-05-24'
}]

const positions = [{
  instrumentId: 1,
  quantity: 1000,
  date: '2018-05-25',
  amount: 83000
}]

const data = {
  instruments: instruments,
  prices: prices,
  positions: positions,
  _ignored: true
}

const dataConfig = {
  types: [{
    name: 'Info', 
    paths: [
      '$.instruments[*].dummy..something4'
    ]
  }],
  rels: [{
    from: '$.positions[*]',
    to: '$.prices[*]',
    matcher: (from, to) => from.date == to.date && from.instrumentId === to.instrumentId,
    name: 'PRICE2'
  }, {
    from: '$.instruments[*].codes[*]',
    to: '$.instruments[*]',
    matcher: (from, to) => belongToProperty(to, from, 'codes'),
    name: (from, to) => from.source
  }],
  mode: 'create'
}

console.log( generateCypher(data, dataConfig) )
console.log(`
match (pr: Price), (p: Position)
where p.instrumentId = pr.instrumentId
and p.date = pr.date
merge (pr)-[:PRICE]->(p);

match (i: Instrument), (p: Position)
where p.instrumentId = i.id
merge (i)-[:INSTRUMENT]->(p);

match (i: Instrument)
merge (prs: Prices {instrumentId: i.id})
merge (prs)-[:PRICES]->(i);

match (pr: Price), (prs: Prices)
where pr.instrumentId = prs.instrumentId
merge (pr)-[:PRICE]->(prs);
`)


