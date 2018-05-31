const neo4j = require('neo4j-driver').v1
const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123'))
const session = driver.session()

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
