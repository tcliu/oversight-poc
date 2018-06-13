const neo4j = require('neo4j-driver').v1
const JSONPath = require('jsonpath-plus')
const { generateCypher, belongToProperty } = require('./app/cypher-generator.js')

const persons = [{
  name: 'Peter',
  age: 38,
  gender: 'M',
  friends: [{
    name: 'John',
    age: 36,
    gender: 'M'
  }, {
    name: 'Sally',
    age: 28,
    gender: 'F',
    attrs: [1,2,3],
    additionProps: [{
      name: 'code1',
      value: 12
    },{
      name: 'code2',
      value: 24
    }]
  }],
  siblings: [{
    name: 'Tom',
    age: 33,
    gender: 'M'
  }]
}]


const personConfig = {
  types: [
    {paths: ['$[*]', '$[*].friends[*]', '$[*].siblings[*]'], name: 'Person'},
    {paths: '$[*].friends[*].additionProps[*]', name: 'Property'}
  ],
  rels: [{
    from: '$[*].friends[*].additionProps[*]', 
    to: '$[*].friends[*]',
    name: 'PROP',
    matcher: (from, to) => belongToProperty(to, from, 'additionProps')
  }],
  mode: 'create'
}

/*
modules.export = {
  data: persons,
  config: personConfig
}*/

console.log( generateCypher(persons, personConfig) )

/*
const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123'))
const session = driver.session()
*/
/*
const getPerson = (tx, name) => tx.run('match (n: Person {name: $name}) return n', {'name': name})

const addPerson = (tx, name) => tx.run('merge (a: Person {name: $name})', {'name': name})

const run = async () => {

  const person = await session.readTransaction(tx => getPerson(tx, 'Peter'))
  if (person.records.length > 0) {
    person.records.forEach(rec => {
      console.log(rec.get(0).properties)
    })
  } else {
    await session.writeTransaction(tx => addPerson(tx, 'Peter'))
  }
  session.close()
  driver.close()

}
run()
*/
/*
session.readTransaction(tx => getPerson(tx, 'Peter')).then(result => {
  if (result.records.length > 0) {
    result.records.forEach(rec => {
      console.log(rec.get(0).properties)
    })
    session.close()
    driver.close()
  } else {
    session.writeTransaction(tx => addPerson(tx, 'Peter')).then(() => {
      session.close()
      driver.close()
    })
  }
})*/
